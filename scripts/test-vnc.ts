import puppeteer from 'puppeteer';

async function test() {
  console.log('Iniciando Chrome no display :99...');
  const b = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--display=:99', '--window-size=1366,900'],
  });
  const p = await b.newPage();
  await p.goto('https://google.com', { waitUntil: 'networkidle2', timeout: 15000 });
  console.log('Chrome ABERTO no display :99!');
  console.log('Acesse http://76.13.171.216/novnc/viewer.html?displayId=display-99&autoconnect=1');
  console.log('Aguardando 30s...');
  await new Promise(r => setTimeout(r, 30000));
  await b.close();
  console.log('Fim.');
  process.exit(0);
}

test().catch(err => { console.error(err); process.exit(1); });
