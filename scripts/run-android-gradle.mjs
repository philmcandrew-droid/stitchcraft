/**
 * Run Gradle for the android/ subproject (Windows: gradlew.bat, Unix: ./gradlew).
 * Pass one or more tasks, e.g. `assembleDebug` or `clean assembleRelease`.
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const tasks = process.argv.slice(2).filter(Boolean);
if (tasks.length === 0) {
  console.error('Usage: node scripts/run-android-gradle.mjs <task> [task...]  e.g. assembleDebug  or  clean assembleRelease');
  process.exit(1);
}

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const androidDir = path.join(root, 'android');
const isWin = process.platform === 'win32';
const cmd = isWin ? '.\\gradlew.bat' : './gradlew';

const r = spawnSync(cmd, tasks, {
  cwd: androidDir,
  stdio: 'inherit',
  shell: isWin,
});

process.exit(r.status ?? 1);
