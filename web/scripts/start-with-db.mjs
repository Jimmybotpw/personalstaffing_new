import net from "node:net";
import { spawn } from "node:child_process";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

const url = new URL(databaseUrl);
const host = url.hostname;
const port = Number(url.port || 5432);
const attempts = Number(process.env.DB_WAIT_ATTEMPTS || 60);
const delayMs = Number(process.env.DB_WAIT_DELAY_MS || 2000);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function waitForPort() {
  return new Promise((resolve, reject) => {
    const socket = net.createConnection({ host, port });

    socket.once("connect", () => {
      socket.end();
      resolve();
    });

    socket.once("error", (error) => {
      socket.destroy();
      reject(error);
    });
  });
}

async function waitForDatabase() {
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      await waitForPort();
      console.log(`Database reachable at ${host}:${port}`);
      return;
    } catch (error) {
      console.log(`Waiting for database (${attempt}/${attempts})... ${error.message}`);
      await sleep(delayMs);
    }
  }

  throw new Error(`Database did not become reachable after ${attempts} attempts`);
}

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: "inherit",
      env: process.env,
    });

    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${command} ${args.join(" ")} exited with code ${code}`));
    });

    child.on("error", reject);
  });
}

async function main() {
  await waitForDatabase();
  await run("npx", ["prisma", "generate"]);
  await run("npx", ["prisma", "db", "push", "--skip-generate"]);
  await run("npm", ["run", "start"]);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
