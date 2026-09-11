// Сборка для Timeweb Cloud (App Platform, тип Frontend): копирует страницы и
// ассеты в build/. Служебные файлы репозитория на сайт не попадают.
import { cpSync, readdirSync, rmSync } from 'node:fs';

const SKIP = new Set([
  'build', 'node_modules', 'scripts',
  '.git', '.github', '.gitignore', '.gstack', '.DS_Store',
  '.nojekyll', 'CNAME',
  'README.md', 'DEPLOY.md', 'package.json', 'package-lock.json',
]);

rmSync('build', { recursive: true, force: true });
for (const name of readdirSync('.')) {
  if (SKIP.has(name)) continue;
  cpSync(name, `build/${name}`, {
    recursive: true,
    filter: (src) => !src.endsWith('.DS_Store'),
  });
}
console.log('build/ готов');
