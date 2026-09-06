import { spawn } from "node:child_process";

const input = process.argv.slice(2);

const previewMode = input.includes("--strictPort");

const useHttps = input.includes("--https");

const args = [previewMode ? "start" : "dev"];

for (let index = 0; index < input.length; index += 1) {
  if (input[index] === "--host") {
    const host = input[index + 1];

    if (host) {
      args.push("-H", host);

      index += 1;
    }
  } else if (input[index] === "--strictPort") {
    // Next falla
    // automáticamente
    // si el puerto está
    // ocupado.
  } else if (input[index] === "--https") {
    if (!previewMode) {
      args.push("--experimental-https");
    }
  } else {
    args.push(input[index]);
  }
}

const child = spawn(
  process.execPath,

  ["./node_modules/next/dist/bin/next", ...args],

  {
    stdio: "inherit",
  },
);

child.on(
  "exit",

  (code) => process.exit(code ?? 0),
);

process.on(
  "SIGINT",

  () => child.kill("SIGINT"),
);

process.on(
  "SIGTERM",

  () => child.kill("SIGTERM"),
);
