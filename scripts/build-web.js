import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import esbuild from 'esbuild';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const www = path.join(root, 'www');

fs.mkdirSync(path.join(www, 'js'), { recursive: true });
fs.mkdirSync(path.join(www, 'icons'), { recursive: true });

esbuild.buildSync({
  entryPoints: [path.join(root, 'src', 'app.js')],
  bundle: true,
  format: 'iife',
  outfile: path.join(www, 'js', 'app.js'),
  sourcemap: true,
  target: ['es2020'],
});

fs.copyFileSync(path.join(root, 'index.html'), path.join(www, 'index.html'));

for (const f of ['manifest.webmanifest', 'sw.js']) {
  const p = path.join(root, f);
  if (fs.existsSync(p)) fs.copyFileSync(p, path.join(www, f));
}

const iconSrc = path.join(root, 'icons', 'icon.svg');
if (fs.existsSync(iconSrc)) {
  fs.copyFileSync(iconSrc, path.join(www, 'icons', 'icon.svg'));
}

const androidPublic = path.join(
  root,
  'android',
  'app',
  'src',
  'main',
  'assets',
  'public'
);
if (fs.existsSync(path.dirname(androidPublic))) {
  fs.mkdirSync(androidPublic, { recursive: true });
  fs.cpSync(www, androidPublic, { recursive: true });
  console.log('✅ android/.../public synced');
}

const iosPublic = path.join(root, 'ios', 'App', 'App', 'public');
if (fs.existsSync(path.dirname(iosPublic))) {
  fs.mkdirSync(iosPublic, { recursive: true });
  fs.cpSync(www, iosPublic, { recursive: true });
  console.log('✅ ios/.../public synced');
}

console.log('Built 逍遥游组曲 → www/');
