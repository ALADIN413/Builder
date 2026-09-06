import { execSync } from "node:child_process";
import { rmSync } from "node:fs";
import { join } from "node:path";

export default function globalSetup() {
  const cwd = process.cwd();
  for (const f of ["test.db", "test.db-journal", "test.db-wal", "test.db-shm"]) {
    rmSync(join(cwd, f), { force: true });
  }
  execSync("npx prisma migrate deploy", {
    cwd,
    env: { ...process.env, DATABASE_URL: "file:./test.db" },
    stdio: "inherit",
  });
}