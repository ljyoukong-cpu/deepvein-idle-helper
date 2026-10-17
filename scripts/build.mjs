// Builds the published userscripts from src/.
//   node scripts/build.mjs
// Outputs (repo root): deepvein-balanced{,-cdn}.user.js and .meta.js
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import * as esbuild from 'esbuild';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const {version} = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const REPO = 'ljyoukong-cpu/deepvein-idle-helper';

const DISTRIBUTIONS = {
  github: {
    file: 'deepvein-balanced',
    updateURL: `https://raw.githubusercontent.com/${REPO}/main/deepvein-balanced.meta.js`,
    downloadURL: `https://raw.githubusercontent.com/${REPO}/main/deepvein-balanced.user.js`,
  },
  cdn: {
    file: 'deepvein-balanced-cdn',
    updateURL: `https://gcore.jsdelivr.net/gh/${REPO}@main/deepvein-balanced-cdn.meta.js`,
    downloadURL: `https://gcore.jsdelivr.net/gh/${REPO}@v${version}/deepvein-balanced-cdn.user.js`,
  },
};

const header = d => `// ==UserScript==
// @name         Deep Vein Idle 自给成长与职业助手
// @namespace    local.deepvein.balanced
// @version      ${version}
// @description  自主发展、经验优先、指定主业与收菜Boss辅助；连续发展计划、批量供料、装备与市场比价；默认暂停
// @homepageURL  https://github.com/ljyoukong-cpu/deepvein-idle-helper
// @updateURL    ${d.updateURL}
// @downloadURL  ${d.downloadURL}
// @match        https://deepveinidle.com/*
// @match        https://cn.deepveinidle.com/*
// @run-at       document-start
// @grant        none
// @sandbox      raw
// @noframes
// ==/UserScript==
`;

// Shared settings: keep every statement (no tree shaking), readable output,
// Chinese text unescaped, and the Acorn licence comment in place.
const common = {
  bundle: true,
  format: 'esm',
  platform: 'browser',
  target: 'esnext',
  treeShaking: false,
  legalComments: 'inline',
  charset: 'utf8',
  write: false,
  logLevel: 'warning',
  absWorkingDir: root,
};

async function bundle(entry, options = {}) {
  const result = await esbuild.build({...common, entryPoints: [entry], ...options});
  return result.outputFiles[0].text;
}

// The planning Worker runs from a Blob URL, so it is embedded as a string.
const workerSource = "'use strict';\n" + await bundle('src/worker/entry.js');

const workerSourcePlugin = {
  name: 'planning-worker-source',
  setup(build) {
    build.onResolve({filter: /^virtual:planning-worker-source$/}, args => ({path: args.path, namespace: 'virtual'}));
    build.onLoad({filter: /.*/, namespace: 'virtual'}, () => ({
      contents: `export default ${JSON.stringify(workerSource)};`, loader: 'js',
    }));
  },
};

// Local build time, shown next to the version so an installed build can be told apart.
const now = new Date(), two = n => String(n).padStart(2, '0');
const built = `${two(now.getMonth() + 1)}-${two(now.getDate())} ${two(now.getHours())}:${two(now.getMinutes())}`;
for (const [name, d] of Object.entries(DISTRIBUTIONS)) {
  const code = await bundle('src/main/entry.js', {
    define: {__SCRIPT_VERSION__: JSON.stringify(version), __SCRIPT_DISTRIBUTION__: JSON.stringify(name),
      __SCRIPT_BUILT__: JSON.stringify(built)},
    plugins: [workerSourcePlugin],
  });
  const script = `${header(d)}\n(function () {\n'use strict';\n${code}\n})();\n`;
  fs.writeFileSync(path.join(root, `${d.file}.user.js`), script);
  fs.writeFileSync(path.join(root, `${d.file}.meta.js`), header(d));
  console.log(`${d.file}.user.js  ${(script.length / 1024).toFixed(0)} KB`);
}
