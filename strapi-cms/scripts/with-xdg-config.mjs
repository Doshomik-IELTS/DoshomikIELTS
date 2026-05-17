import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error("Usage: node scripts/with-xdg-config.mjs <command> [...args]");
  process.exit(1);
}

const xdgConfigHome = path.resolve(".tmp", "xdg-config");
fs.mkdirSync(xdgConfigHome, { recursive: true });

const [command, ...commandArgs] = args;
const result = spawnSync(command, commandArgs, {
  stdio: "inherit",
  shell: process.platform === "win32",
  env: {
    ...process.env,
    XDG_CONFIG_HOME: xdgConfigHome,
  },
});

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}

process.exit(result.status ?? 0);
