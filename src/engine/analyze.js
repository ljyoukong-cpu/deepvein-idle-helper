// Split the game's client module into top-level units and record, per unit,
// what fingerprints and the dependency closure need. Name-based resolution:
// a reference to any top-level name counts as a dependency even if a local
// shadows it. That can only enlarge the closure, never miss a dependency.

export function patternNames(p, out = []) {
  if (!p) return out;
  if (p.type === 'Identifier') out.push(p.name);
  else if (p.type === 'ObjectPattern') for (const pr of p.properties) patternNames(pr.type === 'RestElement' ? pr.argument : pr.value, out);
  else if (p.type === 'ArrayPattern') for (const e of p.elements) patternNames(e, out);
  else if (p.type === 'AssignmentPattern') patternNames(p.left, out);
  else if (p.type === 'RestElement') patternNames(p.argument, out);
  return out;
}

const KEYED = new Set(['Property', 'MethodDefinition', 'PropertyDefinition']);

function inspect(unit, topNames) {
  const props = new Set(), strings = new Set(), idents = new Map(), locals = new Set(), writes = new Set();
  const declare = pattern => patternNames(pattern).forEach(n => locals.add(n));
  const visit = (n, parent, key) => {
    if (!n || typeof n !== 'object') return;
    if (Array.isArray(n)) { for (const c of n) visit(c, parent, key); return; }
    switch (n.type) {
      case 'Identifier': {
        const isKey = parent && (parent.type === 'MemberExpression' && key === 'property' && !parent.computed ||
          KEYED.has(parent.type) && key === 'key' && !parent.computed);
        if (isKey) props.add(n.name);
        else if (!(parent && (parent.type === 'LabeledStatement' || parent.type === 'BreakStatement' || parent.type === 'ContinueStatement')))
          idents.set(n.name, (idents.get(n.name) ?? 0) + 1);
        return;
      }
      case 'PrivateIdentifier': props.add(n.name); return;
      case 'Literal': if (typeof n.value === 'string') strings.add(n.value); return;
      case 'TemplateElement': strings.add(n.value.cooked); return;
      case 'VariableDeclarator': declare(n.id); break;
      case 'FunctionDeclaration': case 'FunctionExpression': case 'ArrowFunctionExpression':
        if (n.id) locals.add(n.id.name); n.params.forEach(declare); break;
      case 'ClassDeclaration': case 'ClassExpression': if (n.id) locals.add(n.id.name); break;
      case 'CatchClause': declare(n.param); break;
      case 'AssignmentExpression': if (n.left.type === 'Identifier') writes.add(n.left.name); break;
      case 'UpdateExpression': if (n.argument.type === 'Identifier') writes.add(n.argument.name); break;
    }
    for (const k in n) if (k !== 'type' && k !== 'start' && k !== 'end' && n[k] && typeof n[k] === 'object') visit(n[k], n, k);
  };
  visit(unit.node, null, null);
  const own = new Set(unit.names);
  for (const n of unit.names) locals.delete(n);
  unit.props = props;
  unit.strings = strings;
  unit.deps = [...idents.keys()].filter(n => topNames.has(n) && !own.has(n));
  unit.globals = new Set([...idents.keys()].filter(n => !topNames.has(n) && !locals.has(n)));
  unit.writes = new Set([...writes].filter(n => topNames.has(n) && !own.has(n) && !locals.has(n)));
}

export function analyzeModule(source, parse) {
  const ast = parse(source, {ecmaVersion: 'latest', sourceType: 'module'});
  const units = [], unitOfName = new Map();
  const add = unit => { unit.index = units.length; units.push(unit); for (const n of unit.names) unitOfName.set(n, unit); };
  for (const st of ast.body) {
    if (st.type === 'VariableDeclaration') for (const d of st.declarations)
      add({kind: st.kind, node: d, names: patternNames(d.id), src: source.slice(d.start, d.end)});
    else if ((st.type === 'FunctionDeclaration' || st.type === 'ClassDeclaration') && st.id)
      add({kind: st.type === 'ClassDeclaration' ? 'class' : 'function', node: st, names: [st.id.name], src: source.slice(st.start, st.end)});
    else add({kind: /^(Import|Export)/.test(st.type) ? 'module' : 'stmt', node: st, names: [], src: source.slice(st.start, st.end)});
  }
  const topNames = new Set(unitOfName.keys());
  for (const unit of units) inspect(unit, topNames);
  return {units, unitOfName};
}

// Units needed by `roots`, plus top-level statements that write to them.
export function closure(mod, roots) {
  const need = new Set(), stack = [];
  const addName = n => { const u = mod.unitOfName.get(n); if (u && !need.has(u)) { need.add(u); stack.push(u); } };
  roots.forEach(addName);
  const drain = () => { while (stack.length) for (const d of stack.pop().deps) addName(d); };
  drain();
  for (let changed = true; changed;) {
    changed = false;
    const names = new Set([...need].flatMap(u => u.names));
    for (const u of mod.units) if (!need.has(u) && u.kind === 'stmt' && [...u.writes].some(w => names.has(w))) {
      need.add(u); stack.push(u); changed = true;
    }
    drain();
  }
  return [...need].sort((a, b) => a.index - b.index);
}
