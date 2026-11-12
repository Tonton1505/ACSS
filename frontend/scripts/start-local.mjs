import { spawn } from 'node:child_process';
import net from 'node:net';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';
import { existsSync } from 'node:fs';

const fe = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const be = resolve(fe, '..', 'be');
const children = [];
const listening = port => new Promise(done => {
  const socket = net.createConnection({ port, host: '127.0.0.1' });
  socket.once('connect', () => { socket.destroy(); done(true); });
  socket.once('error', () => done(false));
});
for (const [port, cwd, entry, args] of [
  [3000, be, resolve(be, 'server.js'), []],
  [5173, fe, resolve(fe, 'node_modules/vite/bin/vite.js'), ['--host', '127.0.0.1', '--port', '5173', '--strictPort']],
]) {
  if (await listening(port)) { console.log(`Port ${port} is already running; leaving that process unchanged.`); continue; }
  if (!existsSync(entry)) throw new Error(`Missing ${entry}. Install project dependencies first.`);
  const child = spawn(process.execPath, [entry, ...args], { cwd, stdio: 'inherit', windowsHide: true });
  child.on('error', error => console.error(error.message));
  children.push(child);
}
console.log('Frontend: http://127.0.0.1:5173/');
console.log('Backend: http://127.0.0.1:3000/api');
console.log('Press Ctrl+C to stop processes started by this command.');
process.on('SIGINT', () => { for (const child of children) child.kill(); process.exit(); });
