// Build the single self-contained offline HTML file: dist/military_calisthenics_coach_v5.html
import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const r = f => fs.readFileSync(path.join(root, f), 'utf8');
const data = fs.readdirSync(path.join(root, 'src/data')).filter(f => f.startsWith('ex_')).sort().map(f => 'src/data/' + f);
const order = ['src/anim.js', 'src/data/_core.js', ...data, 'src/sources.js', 'src/store.js', 'src/screening.js', 'src/engine.js', 'src/ui_core.js', 'src/ui_screen.js', 'src/ui_library.js', 'src/ui_plan.js', 'src/ui_session.js', 'src/main.js'];
const js = order.map(f => '/* ==== ' + f + ' ==== */\n' + r(f)).join('\n;\n').replace(/<\/script/gi, '<\\/script');
const css = r('src/fig.css') + '\n' + r('src/styles.css');
let html = r('src/index.html').replace('/*@@CSS@@*/', () => css).replace('/*@@JS@@*/', () => js);
// guard: no external URLs in executable/style parts (source register URLs are plain text strings shown to the user)
const bad = html.match(/(src|href)\s*=\s*["']https?:/gi); if (bad) { console.error('external resource reference found', bad); process.exit(1); }
if (/@import|url\(\s*["']?https?:/i.test(css)) { console.error('external CSS reference'); process.exit(1); }
fs.mkdirSync(path.join(root, 'dist'), { recursive: true });
const out = path.join(root, 'dist/military_calisthenics_coach_v5.html');
fs.writeFileSync(out, html);
console.log('built', out, (html.length / 1024).toFixed(0) + ' KB', 'files:', order.length, 'exercise files:', data.length);
