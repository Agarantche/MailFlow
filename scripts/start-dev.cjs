const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

const root = path.resolve(__dirname, "..");
const out = fs.openSync(path.join(root, "dev-server.log"), "a");
const err = fs.openSync(path.join(root, "dev-server.err.log"), "a");

const child = spawn(process.execPath, [
  path.join(root, "node_modules", "next", "dist", "bin", "next"),
  "dev",
  "--hostname",
  "127.0.0.1",
  "--port",
  "3000"
], {
  cwd: root,
  detached: true,
  stdio: ["ignore", out, err],
  windowsHide: true
});

child.unref();
console.log(child.pid);
