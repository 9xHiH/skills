// Automated accessibility audit (axe-core, WCAG 2.0/2.1 A+AA rules) of every page in both themes.
// Requires axe-core installed somewhere: AXE=/path/to/axe.min.js NODE_PATH=$(npm root -g) node tests/a11y.cjs [exportJsonForData]
const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path');
const FILE = path.resolve(__dirname, '../dist/military_calisthenics_coach_v5.html');
const AXE = process.env.AXE; if (!AXE || !fs.existsSync(AXE)) { console.error('set AXE=/path/to/axe.min.js'); process.exit(2); }
const DATA = process.argv[2];
(async () => {
  const b = await chromium.launch(); const c = await b.newContext({ viewport: { width: 1280, height: 900 } }); const p = await c.newPage();
  await p.goto('file://' + FILE);
  if (DATA) { await p.evaluate(d => localStorage.setItem('MCC_V5_DB', JSON.stringify(d)), JSON.parse(fs.readFileSync(DATA, 'utf8')).data); await p.reload(); }
  const src = fs.readFileSync(AXE, 'utf8'); const all = {}; let total = 0;
  for (const theme of ['dark', 'light']) {
    await p.evaluate(t => { document.documentElement.dataset.theme = t; }, theme);
    for (const pg of ['dash', 'setup', 'plan', 'session', 'review', 'library', 'more', 'trainees', 'screen', 'history', 'data', 'sources']) {
      await p.evaluate(x => App.go(x), pg); await p.waitForTimeout(150);
      await p.addScriptTag({ content: src });
      const r = await p.evaluate(async () => { const res = await axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] } }); return res.violations.map(v => ({ id: v.id, impact: v.impact, n: v.nodes.length, help: v.help, sample: v.nodes[0] && v.nodes[0].target.join(' ') })); });
      r.forEach(v => { const k = theme + ' ' + v.id; all[k] = all[k] || { ...v, pages: [] }; all[k].pages.push(pg); total += v.n; });
    }
  }
  await p.evaluate(() => { document.documentElement.dataset.theme = 'dark'; });
  await p.evaluate(() => App.go('library')); await p.click('.excard'); await p.addScriptTag({ content: src });
  const d = await p.evaluate(async () => (await axe.run(document.querySelector('#exDialog'), { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] } })).violations.map(v => ({ id: v.id, impact: v.impact, n: v.nodes.length, help: v.help, sample: v.nodes[0].target.join(' ') })));
  d.forEach(v => { all['dialog ' + v.id] = { ...v, pages: ['exercise dialog'] }; total += v.n; });
  const keys = Object.keys(all);
  keys.forEach(k => console.log(`${all[k].impact}\t${k}\t${all[k].n} nodes\t${all[k].help}\tpages: ${all[k].pages.join(',')}\te.g. ${all[k].sample}`));
  console.log(`\nA11Y (axe-core ${await p.evaluate(() => axe.version)}): ${keys.length} distinct violation types, ${total} node instances`);
  await b.close(); process.exit(keys.length ? 1 : 0);
})();
