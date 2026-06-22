import { spawn } from "node:child_process";
import { once } from "node:events";
import path from "node:path";
import process from "node:process";
import { setTimeout as delay } from "node:timers/promises";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const timeoutMs = Number(process.env.WAIT_ON_TIMEOUT || 300000);
const intervalMs = Number(process.env.WAIT_ON_INTERVAL || 1000);
const urls = ["http://localhost:4000", "http://localhost:4000/api/health"];
const children = [];
let stopping = false;

function start(label, command, options = {}) {
  const child = spawn(command, {
    cwd: rootDir,
    env: process.env,
    stdio: "inherit",
    detached: process.platform !== "win32",
    shell: true,
    windowsHide: true,
    ...options,
  });

  child.on("exit", (code, signal) => {
    if (!stopping && code && code !== 0) {
      console.error(`${label} exited with code ${code}${signal ? ` (${signal})` : ""}`);
    }
  });

  children.push(child);
  return child;
}

async function waitForExit(child) {
  if (child.exitCode !== null || child.signalCode !== null) return;
  await once(child, "exit");
}

async function stop(child) {
  if (!child || child.exitCode !== null || child.signalCode !== null) return;

  if (process.platform === "win32") {
    await new Promise((resolve) => {
      const killer = spawn("taskkill", ["/pid", String(child.pid), "/T", "/F"], {
        stdio: "ignore",
        windowsHide: true,
      });
      killer.on("error", resolve);
      killer.on("exit", resolve);
    });
    return;
  }

  try {
    process.kill(-child.pid, "SIGINT");
  } catch {
    return;
  }

  await Promise.race([waitForExit(child), delay(2000)]);

  if (child.exitCode === null && child.signalCode === null) {
    try {
      process.kill(-child.pid, "SIGKILL");
    } catch {
      // The process tree may have already exited.
    }
  }
}

async function stopAll() {
  if (stopping) return;
  stopping = true;
  await Promise.all(children.map(stop));
}

async function isReady(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(url, { method: "HEAD", signal: controller.signal });
    return (response.status >= 200 && response.status < 300) || response.status === 304;
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

async function waitForUrls() {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const exited = children.find((child) => child.exitCode !== null || child.signalCode !== null);
    if (exited) {
      throw new Error(`A local server exited before ${urls.join(" and ")} were ready.`);
    }

    const results = await Promise.all(urls.map(isReady));
    if (results.every(Boolean)) return;
    await delay(intervalMs);
  }

  throw new Error(`Timed out waiting for ${urls.join(" and ")}.`);
}

async function run(command) {
  const child = spawn(command, {
    cwd: rootDir,
    env: process.env,
    stdio: "inherit",
    shell: true,
    windowsHide: true,
  });

  const [code] = await once(child, "exit");
  return code ?? 1;
}

process.once("SIGINT", async () => {
  await stopAll();
  process.exit(130);
});

process.once("SIGTERM", async () => {
  await stopAll();
  process.exit(143);
});

try {
  start("api", "node dist/main.js", {
    cwd: path.join(rootDir, "apps", "api"),
    env: {
      ...process.env,
      NODE_ENV: "production",
      PORT: "4000",
      DATA_FILE: "./data/e2e-state.json",
      AUTH_USERNAME: "admin",
      AUTH_PASSWORD: "admin",
      AUTH_JWT_SECRET: "e2e-secret",
      AUTH_COOKIE_SECURE: "false",
      DATABASE_URL: "",
    },
  });

  await waitForUrls();
  const code = await run("cypress run --config baseUrl=http://localhost:4000");
  await stopAll();
  process.exit(code);
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  await stopAll();
  process.exit(1);
}
