import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const target = path.join(__dirname, "..", "node_modules", "@prisma", "client", ".prisma");

function ensurePrismaClientSymlink() {
  try {
    const stats = fs.lstatSync(target);
    if (stats.isSymbolicLink() && fs.existsSync(target)) return;
    fs.unlinkSync(target);
  } catch { /* doesn't exist */ }

  const prismaClientDir = path.join(__dirname, "..", "node_modules", ".pnpm");
  if (!fs.existsSync(prismaClientDir)) return;

  const entries = fs.readdirSync(prismaClientDir, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const pkgPath = path.join(prismaClientDir, entry.name, "node_modules", ".prisma");
    if (fs.existsSync(path.join(pkgPath, "client"))) {
      fs.symlinkSync(pkgPath, target, "junction");
      return;
    }
  }
}

ensurePrismaClientSymlink();
