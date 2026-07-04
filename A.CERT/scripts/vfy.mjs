import { Client } from 'ssh2';
const c = new Client();
c.on('ready', () => {
  const pre = 'cd /var/www/acert && git checkout -- . 2>/dev/null; git clean -fd 2>/dev/null; git pull origin main';
  c.exec(pre, { pty: true }, (e, s) => {
    s.stderr.on('data', d => process.stdout.write(d.toString()));
    s.on('close', () => {
      const cmd = [
        'cd /var/www/acert/A.CERT && npm install',
        'npx --yes prisma generate && npx --yes prisma migrate deploy',
        'npx tsc',
        'cd frontend && npm install && npx --yes next build',
      ].join(' && ');
      console.log('Building...');
      c.exec(cmd, { pty: true }, (e2, s2) => {
        s2.on('data', d => process.stdout.write(d.toString()));
        s2.stderr.on('data', d => process.stdout.write(d.toString()));
        s2.on('close', () => {
          const pm2 = 'pm2 delete all 2>/dev/null; cd /var/www/acert/A.CERT && pm2 start dist/server.js --name acert-backend && cd frontend && pm2 start npx --name acert-frontend -- next start -p 3000 && pm2 save';
          c.exec(pm2, { pty: true }, (e3, s3) => {
            s3.on('data', d => process.stdout.write(d.toString()));
            s3.stderr.on('data', d => process.stdout.write(d.toString()));
            s3.on('close', () => { console.log('\n✅ Pronto!'); c.end(); process.exit(0); });
          });
        });
      });
    });
  });
});
c.connect({ host: '76.13.171.216', username: 'root', password: 'A.certcert2026' });
