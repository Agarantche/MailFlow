const fs = require("node:fs");
const path = require("node:path");
const { spawn } = require("node:child_process");

const root = path.resolve(__dirname, "..");
const out = fs.openSync(path.join(root, "preview-server.log"), "a");
const err = fs.openSync(path.join(root, "preview-server.err.log"), "a");
const child = spawn(process.execPath, [
  path.join(root, "node_modules", "next", "dist", "bin", "next"),
  "start", "--hostname", "127.0.0.1", "--port", "3000"
], { cwd: root, detached: true, stdio: ["ignore", out, err], windowsHide: true });
child.unref();
console.log(`Preview process ${child.pid}. Open http://localhost:3000`);
