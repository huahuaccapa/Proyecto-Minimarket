import { spawn } from 'node:child_process';

const input = process.argv.slice(2);
const previewMode = input.includes('--strictPort');
const args = [previewMode ? 'start' : 'dev'];

for (let index = 0; index < input.length; index += 1) {
  if (input[index] === '--host') {
    args.push('-H', input[index + 1]);
    index += 1;
  } else if (input[index] === '--strictPort') {
    // Next.js ya falla si el puerto indicado no está disponible.
  } else {
    args.push(input[index]);
  }
}

const child = spawn(process.execPath, ['./node_modules/next/dist/bin/next', ...args], {
  stdio: 'inherit',
});

child.on('exit', (code) => process.exit(code ?? 0));
process.on('SIGINT', () => child.kill('SIGINT'));
process.on('SIGTERM', () => child.kill('SIGTERM'));
