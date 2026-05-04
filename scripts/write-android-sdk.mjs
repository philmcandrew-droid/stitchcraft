/**
 * Writes android/local.properties with sdk.dir for the Android Gradle Plugin.
 * Same pattern as Artist Studio — set ANDROID_HOME or rely on default paths.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const requireSdk = process.argv.includes('--require');

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const androidDir = path.join(root, 'android');
const dest = path.join(androidDir, 'local.properties');

function hasSdk(p) {
  if (!p || typeof p !== 'string') return false;
  let norm;
  try {
    norm = path.resolve(p);
  } catch {
    return false;
  }
  const adbWin = path.join(norm, 'platform-tools', 'adb.exe');
  const adbUnix = path.join(norm, 'platform-tools', 'adb');
  const hasAdb = fs.existsSync(adbWin) || fs.existsSync(adbUnix);
  const hasBuildTools = fs.existsSync(path.join(norm, 'build-tools'));
  return hasAdb || hasBuildTools;
}

const home = os.homedir();
const candidates = [];

for (const v of [process.env.ANDROID_HOME, process.env.ANDROID_SDK_ROOT]) {
  if (v) candidates.push(v);
}

candidates.push(path.join(home, 'Android', 'Sdk'));
candidates.push(path.join(home, 'Library', 'Android', 'sdk'));

if (process.platform === 'win32' && process.env.LOCALAPPDATA) {
  candidates.push(path.join(process.env.LOCALAPPDATA, 'Android', 'Sdk'));
}

if (process.platform === 'win32') {
  candidates.push('C:\\Android\\sdk', 'C:\\Android\\Sdk');
}

const seen = new Set();
const unique = candidates.filter((p) => {
  if (!p || typeof p !== 'string') return false;
  const k = path.resolve(p);
  if (seen.has(k)) return false;
  seen.add(k);
  return true;
});

const sdk = unique.find(hasSdk);

if (!sdk) {
  if (requireSdk) {
    console.error(
      '[StitchCraft] No Android SDK found (need platform-tools adb or build-tools).\n' +
        '  Set ANDROID_HOME or ANDROID_SDK_ROOT to the SDK root.\n' +
        '  Checked: ' +
        unique.join(', '),
    );
    process.exit(1);
  }
  if (fs.existsSync(dest)) {
    console.log('[StitchCraft] No SDK in env/paths; leaving existing', dest);
    process.exit(0);
  }
  console.warn(
    '[StitchCraft] No Android SDK detected; skipped writing local.properties. ' +
      'Set ANDROID_HOME or run this script after installing the SDK.',
  );
  process.exit(0);
}

const line = `sdk.dir=${path.resolve(sdk).replace(/\\/g, '/')}\n`;
fs.writeFileSync(dest, line, 'utf8');
console.log('[StitchCraft] Wrote', dest, '→', line.trim());
