import { spawn } from 'child_process';
const child = spawn('node', ['server.ts'], { env: { ...process.env, NODE_ENV: 'production' } });
child.stdout.on('data', data => console.log(data.toString()));
child.stderr.on('data', data => console.error(data.toString()));
setTimeout(() => {
  fetch('http://localhost:3000/').then(r => r.text()).then(html => {
    console.log('HTML:', html);
    child.kill();
  });
}, 2000);
