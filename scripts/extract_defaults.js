const fs = require('fs');
const src = fs.readFileSync('/app/sky-index-B8WVc7MV.js', 'utf8');

function extractObject(marker) {
  const start = src.indexOf(marker);
  if (start === -1) return null;
  // position of the opening brace (marker ends with '{')
  let i = start + marker.indexOf('{'); // at first '{'
  let depth = 0;
  let inStr = null;
  let out = '';
  for (; i < src.length; i++) {
    const ch = src[i];
    out += ch;
    if (inStr) {
      if (ch === '\\') { out += src[i+1]; i++; continue; }
      if (ch === inStr) inStr = null;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') { inStr = ch; continue; }
    if (ch === '{') depth++;
    else if (ch === '}') { depth--; if (depth === 0) break; }
  }
  return out;
}

const config = extractObject('config:{Open:{');
const lang = extractObject('lang:{');
fs.writeFileSync('/app/scripts/_defaults.js',
  'window.__SKY_DEFAULT_CONFIG = ' + config + ';\n' +
  'window.__SKY_DEFAULT_LANG = ' + lang + ';\n');
console.log('config len', config && config.length, 'lang len', lang && lang.length);
