import {analyzeModule, closure} from './analyze.js';
import {DOM_GLOBALS, REQUIRED, findEntryPoints} from './fingerprints.js';

// Standard globals the engine may use; anything else rejects the extraction.
const ALLOWED = new Set(['Math', 'Number', 'Object', 'Array', 'Map', 'Set', 'WeakMap', 'WeakSet', 'JSON', 'String', 'Boolean',
  'Error', 'TypeError', 'RangeError', 'Symbol', 'Infinity', 'NaN', 'undefined', 'isFinite', 'isNaN', 'parseInt', 'parseFloat',
  'BigInt', 'Uint8Array', 'Uint16Array', 'Uint32Array', 'Int8Array', 'Int16Array', 'Int32Array', 'Float32Array', 'Float64Array',
  'Uint8ClampedArray', 'ArrayBuffer', 'DataView', 'Date', 'Reflect', 'Proxy', 'Promise', 'globalThis', 'structuredClone',
  'console', 'Intl', 'RegExp', 'encodeURIComponent', 'decodeURIComponent', 'arguments', 'this', 'self']);

// Extract a self-contained simulation engine from the game's public client.
// Returns {ok, factory, found, problems, stats}; `factory` is a function body
// that returns the engine API. Nothing is evaluated here.
export function extractEngine(source, parse) {
  const mod = analyzeModule(source, parse);
  const {found, problems} = findEntryPoints(mod);
  const missing = REQUIRED.filter(k => !found[k]);
  if (missing.length) return {ok: false, found, problems: [`missing: ${missing.join(', ')}`, ...problems]};
  const units = closure(mod, Object.values(found));
  const inClosure = new Set(units.flatMap(u => u.names));
  const stats = {units: units.length, bytes: units.reduce((n, u) => n + u.src.length, 0)};
  const checks = [];
  const foreign = new Set(units.flatMap(u => [...u.globals]).filter(g => !ALLOWED.has(g)));
  if ([...foreign].some(g => DOM_GLOBALS.has(g))) checks.push(`uses page APIs: ${[...foreign].filter(g => DOM_GLOBALS.has(g)).join(', ')}`);
  if (units.some(u => u.kind === 'module')) checks.push('depends on import/export statements');
  if (stats.units < 300 || stats.units > 2000 || stats.bytes > 1.5e6) checks.push(`unexpected size: ${stats.units} units, ${stats.bytes} bytes`);
  const writers = mod.units.filter(u => !units.includes(u) && [...u.writes].some(w => inClosure.has(w)));
  if (writers.length) checks.push(`engine state written from outside: ${writers.length} units`);
  if (checks.length) return {ok: false, found, problems: [...checks, ...problems], stats};
  const body = units.map(u => u.kind === 'function' || u.kind === 'class' || u.kind === 'stmt' ? u.src : `${u.kind} ${u.src};`).join('\n');
  const api = Object.entries(found).map(([k, v]) => `${k}:${v}`).join(',');
  return {ok: true, factory: `"use strict";\n${body}\nreturn {${api}};`, found, problems, stats: {...stats, foreignGlobals: [...foreign]}};
}
