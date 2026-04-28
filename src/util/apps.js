const fs = require('fs');
const path = require('path');
const os = require('os');

function scanApps() {
  const platform = process.platform;
  const results = [];

  if (platform === 'darwin') {
    const dirs = ['/Applications', path.join(os.homedir(), 'Applications')];
    for (const dir of dirs) {
      if (!fs.existsSync(dir)) continue;
      try {
        fs.readdirSync(dir).forEach(file => {
          if (file.endsWith('.app') && !file.startsWith('.')) {
            results.push({ name: file.replace('.app', ''), appPath: path.join(dir, file) });
          }
        });
      } catch (e) {}
    }
  }

  if (platform === 'win32') {
    const dirs = [
      'C:\\Program Files',
      'C:\\Program Files (x86)',
      path.join(process.env.APPDATA || '', 'Microsoft\\Windows\\Start Menu\\Programs'),
      path.join(process.env.PROGRAMDATA || '', 'Microsoft\\Windows\\Start Menu\\Programs'),
    ];
    function scanDir(dir, depth = 0) {
      if (depth > 2 || !fs.existsSync(dir)) return;
      try {
        fs.readdirSync(dir).forEach(file => {
          const full = path.join(dir, file);
          try {
            const stat = fs.statSync(full);
            if (stat.isDirectory() && depth < 2) {
              scanDir(full, depth + 1);
            } else if (file.endsWith('.exe') || file.endsWith('.lnk')) {
              const name = file.replace(/\.(exe|lnk)$/, '');
              if (!name.match(/uninstall|setup|install|update|helper|crash|redist/i)) {
                results.push({ name, appPath: full });
              }
            }
          } catch (e) {}
        });
      } catch (e) {}
    }
    dirs.forEach(d => scanDir(d));
  }

  const seen = new Set();
  return results
    .filter(a => { if (seen.has(a.name.toLowerCase())) return false; seen.add(a.name.toLowerCase()); return true; })
    .sort((a, b) => a.name.localeCompare(b.name));
}

module.exports = { scanApps };