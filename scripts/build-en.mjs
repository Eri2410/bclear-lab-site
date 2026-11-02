// Сборка английского сайта для bclearlab.com (Timeweb Cloud, отдельное приложение Frontend,
// команда `npm run build:en`, директория сборки /build).
// Английские страницы из en/ ложатся в корень: en/about/ → bclearlab.com/about/.
// Русские страницы (политика, согласие, методика, блог) на .com не копируются:
// ссылки на них ведут на bclearlab.ru.
import { cpSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const RU = 'https://bclearlab.ru';
const EN = 'https://bclearlab.com';
const APP_EN = 'https://app.bclearlab.com';
const OUT = 'build';

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT);
cpSync('assets', `${OUT}/assets`, { recursive: true, filter: (src) => !src.endsWith('.DS_Store') });
for (const f of ['favicon.ico', 'favicon.png']) cpSync(f, `${OUT}/${f}`);

function rewrite(html) {
  return (
    html
      // 1. Относительные ссылки на русские страницы → полный адрес на bclearlab.ru.
      //    Ассеты, якоря и английские страницы не трогаем.
      .replace(/(href)="\/(?!en\/|assets\/|\/)([^"]*)"/g, `$1="${RU}/$2"`)
      // 2. Английские страницы теперь в корне .com.
      .replace(/href="\/en\//g, 'href="/')
      .replace(new RegExp(`${RU}/en/`, 'g'), `${EN}/`)
      // 3. Картинки для соцсетей и сервис — с .com.
      .replace(new RegExp(`${RU}/assets/`, 'g'), `${EN}/assets/`)
      .replace(/https:\/\/app\.bclearlab\.ru\/?/g, `${APP_EN}/`)
      // 4. Без x-default на русскую главную: на .com по умолчанию английский.
      .replace(/<link rel="alternate" hreflang="x-default"[^>]*>\n?/g, '')
  );
}

// На .com нет ничего, что относится к России: ни русских документов (политика, согласие)
// и галочки согласия, которую требует российский закон, ни ссылок на русский сайт.
// Что должно стоять на английском вместо документов — решим отдельно.
// Статья про карьеру построена на российской статистике (hh.ru, Skyeng), на .com её нет.
const SKIP_PAGES = new Set(['blog/english-for-your-career']);
const CUTS = [
  // Переключатель RU в шапке и пометки о русской версии для поисковиков.
  [/\s*<a class="lang-switch"[^>]*hreflang="ru"[^>]*>[\s\S]*?<\/a>/g, 'RU в шапке'],
  [/<link rel="alternate" hreflang="(ru|en)"[^>]*>\n?/g, 'hreflang'],
  // Колонка «In Russian» в подвале.
  [/<div>\s*<h4>In Russian<\/h4>[\s\S]*?<\/ul>\s*<\/div>\s*/g, 'колонка In Russian'],
  // Русские политика и согласие внизу страницы → своя английская политика.
  [/<a href="[^"]*\/privacy\/" lang="ru">[^<]*<\/a>/g, 'политика в подвале', '<a href="/privacy/">Privacy policy</a>'],
  [/\s*<a href="[^"]*\/consent\/" lang="ru">[^<]*<\/a>/g, 'согласие в подвале'],
  // Галочка согласия в формах вместе с полем для ошибки.
  [/<label class="check"[^>]*>\s*<input[^>]*>\s*<span>I consent[\s\S]*?<\/label>\s*<p class="field-err" id="(consent|gate)-err"[^>]*><\/p>\s*/g, 'галочка согласия'],
  // Без галочки кнопке «Write to us» на странице для бизнеса проверять нечего.
  [/ data-consent-gate| data-needs-consent/g, 'проверка галочки'],
  // Блок «More detail, in Russian» со ссылками на русские страницы.
  [/<section class="band-deep section-tight">\s*<div class="shell">\s*<div class="head">\s*<h2>More detail, in Russian<\/h2>[\s\S]*?<\/section>\s*/g, 'блок More detail, in Russian'],
  // Ссылка «Read more» на статью про карьеру.
  [/\s*<a class="goal-more" href="\/blog\/english-for-your-career\/"[^>]*>[^<]*<\/a>/g, 'Read more на статью'],
];
const cutCount = new Map(CUTS.map(([, name]) => [name, 0]));
function cutRussia(html) {
  for (const [re, name, to = ''] of CUTS) {
    html = html.replace(re, () => {
      cutCount.set(name, cutCount.get(name) + 1);
      return to;
    });
  }
  return html;
}

const pages = [];
function walk(dir) {
  for (const name of readdirSync(dir)) {
    const src = path.join(dir, name);
    if (statSync(src).isDirectory()) walk(src);
    else if (name === 'index.html') {
      const rel = path.relative('en', dir); // '' для главной
      if (SKIP_PAGES.has(rel.split(path.sep).join('/'))) continue;
      const out = path.join(OUT, rel, 'index.html');
      mkdirSync(path.dirname(out), { recursive: true });
      writeFileSync(out, cutRussia(rewrite(readFileSync(src, 'utf8'))));
      pages.push(rel ? `/${rel.split(path.sep).join('/')}/` : '/');
    }
  }
}
walk('en');

// Своя английская политика (текст — scripts/en-privacy.html), без российских требований.
// Шапка и подвал — со страницы about, у неё же меняем заголовок, описание и адреса.
const about = cutRussia(rewrite(readFileSync('en/about/index.html', 'utf8')));
const privacyDesc = 'What BClear Lab receives, why, who helps us process it, and how to have it deleted. Your camera video never leaves your device.';
const privacy = about
  .replace(/About me — BClear Lab/g, 'Privacy Policy — BClear Lab')
  .replace(/(<meta (?:name|property)="(?:description|og:description|twitter:description)" content=")[^"]*"/g, `$1${privacyDesc}"`)
  .replace(new RegExp(`${EN}/about/`, 'g'), `${EN}/privacy/`)
  .replace(' aria-current="page"', '')
  .replace(/<main[^>]*>[\s\S]*<\/main>/, () => readFileSync('scripts/en-privacy.html', 'utf8').replace(/^<!--[\s\S]*?-->\n/, '').trim());
mkdirSync(`${OUT}/privacy`, { recursive: true });
writeFileSync(`${OUT}/privacy/index.html`, privacy);
pages.push('/privacy/');

// Страница 404 собирается из английской главной: шапка и подвал те же, внутри — короткий текст.
const home = cutRussia(rewrite(readFileSync('en/index.html', 'utf8')));
const notFound = home
  .replace(/<title>[^<]*<\/title>/, '<title>Page not found — BClear Lab</title>')
  .replace(/<link rel="(canonical|alternate)"[^>]*>\n?/g, '')
  .replace(/<meta name="description"[^>]*>/, '<meta name="description" content="This page doesn’t exist.">\n<meta name="robots" content="noindex">')
  .replace(
    /<main[^>]*>[\s\S]*<\/main>/,
    `<main id="main">
<section class="shell page-head">
  <h1>This page doesn’t exist</h1>
  <p class="lead">The link may be out of date, or there’s a typo in the address.</p>
  <div class="btn-row" style="margin-top:30px">
    <a class="btn btn-primary btn-lg" href="/">Go to the home page</a>
    <a class="btn btn-ghost btn-lg" href="/early-access/">Join the waitlist</a>
  </div>
</section>
</main>`,
  );
writeFileSync(`${OUT}/404.html`, notFound);

writeFileSync(`${OUT}/robots.txt`, `User-agent: *\nAllow: /\n\nSitemap: ${EN}/sitemap.xml\n`);
writeFileSync(
  `${OUT}/sitemap.xml`,
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pages
    .sort()
    .map((p) => `  <url><loc>${EN}${p}</loc></url>`)
    .join('\n')}\n</urlset>\n`,
);

// Если разметка страниц поменялась и какое-то правило перестало срабатывать, сборка падает:
// иначе русские документы молча вернутся на .com.
const missed = [...cutCount].filter(([, n]) => n === 0).map(([name]) => name);
if (missed.length) throw new Error(`Не сработали правила вырезки: ${missed.join(', ')}`);

console.log(`build/ для bclearlab.com готов: ${pages.length} страниц`);
