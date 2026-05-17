// Copies src/views and src/public into dist/ so the compiled app can serve them.
const fs = require("fs");
const path = require("path");

function copyRecursive(src, dest) {
  if (!fs.existsSync(src)) return;
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const entry of fs.readdirSync(src)) {
      copyRecursive(path.join(src, entry), path.join(dest, entry));
    }
  } else {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
  }
}

const root = path.resolve(__dirname, "..");
copyRecursive(path.join(root, "src/views"), path.join(root, "dist/views"));
copyRecursive(path.join(root, "src/public"), path.join(root, "dist/public"));
copyRecursive(path.join(root, "src/i18n/messages"), path.join(root, "dist/i18n/messages"));
console.log("Copied views, public assets, and locale files into dist/");
