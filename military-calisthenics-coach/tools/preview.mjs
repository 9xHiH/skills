// Render every key pose of every exercise into a contact sheet PNG and print validation issues.
// usage: node tools/preview.mjs out.png [idPrefixFilter]
import { createRequire } from 'module'; const { chromium } = createRequire(import.meta.url)('playwright');
import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = process.argv[2] || 'preview.png'; const filt = process.argv[3] || '';
const files = ['src/anim.js', 'src/data/_core.js', ...fs.readdirSync(path.join(root, 'src/data')).filter(f => f.startsWith('ex_')).sort().map(f => 'src/data/' + f)];
const js = files.map(f => fs.readFileSync(path.join(root, f), 'utf8')).join('\n;\n');
const css = fs.readFileSync(path.join(root, 'src/fig.css'), 'utf8');
const html = `<!doctype html><meta charset=utf-8><style>${css} body{background:#111;color:#eee;font:12px sans-serif;margin:8px}
.row{display:flex;gap:6px;align-items:flex-start;margin:4px 0;border-bottom:1px solid #333;padding:4px}.row b{width:150px;flex:none}.k{width:${process.env.W||190}px;flex:none}.k small{display:block}.iss{color:#f88;width:260px}</style><div id=o></div><script>${js}
const F=${JSON.stringify(filt)};const o=document.getElementById('o');const issues={};
MCEX.list.filter(e=>e.id.startsWith(F)).forEach(e=>{const r=document.createElement('div');r.className='row';r.innerHTML='<b>'+e.id+'<br>'+e.en+'</b>';
e.anim.keys.forEach((k,i)=>{const d=document.createElement('div');d.className='k';d.innerHTML=MCAnim.staticSVG(e.anim,i)+'<small>'+i+' '+(k.lab||'')+'</small>';r.appendChild(d)});
const v=MCAnim.validate(e.anim);if(v.length)issues[e.id]=v;const s=document.createElement('div');s.className='iss';s.textContent=v.join(' | ');r.appendChild(s);o.appendChild(r)});
window.__issues=issues;</script>`;
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1250, height: 800 } });
const errs = []; p.on('pageerror', e => errs.push(e.message));
await p.setContent(html); console.log(JSON.stringify(await p.evaluate(() => window.__issues), null, 1));
if (errs.length) console.log('PAGE ERRORS', errs);
await p.screenshot({ path: out, fullPage: true }); await b.close();
