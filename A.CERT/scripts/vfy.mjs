import { Client } from 'ssh2';
const c = new Client();
c.on('ready', () => {
  c.exec('ls -la /var/www/acert/A.CERT/', { pty: true }, (e, s) => {
    s.on('data', d => process.stdout.write(d.toString()));
    s.on('close', () => { c.end(); process.exit(0); });
  });
});
c.connect({ host: '76.13.171.216', username: 'root', password: 'A.certcert2026' });
