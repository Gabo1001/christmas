const enc = new TextEncoder(), dec = new TextDecoder();
const b64 = a => btoa(String.fromCharCode(...new Uint8Array(a)));
const unb64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));

// "Gherciu Gabriel" == "gabriel gherciu" == "Gherciu  Gábriel"
function norm(n) {
  return n.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean).sort().join(' ');
}
async function lookupHash(n) {
  return b64(await crypto.subtle.digest('SHA-256', enc.encode('xmas|' + norm(n))));
}
async function deriveKey(n, salt) {
  const km = await crypto.subtle.importKey('raw', enc.encode(norm(n)), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    km, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}
async function encryptFor(name, payload) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(name, salt);
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(JSON.stringify(payload)));
  return { h: await lookupHash(name), s: b64(salt), i: b64(iv), c: b64(ct) };
}
async function decryptFor(name, e) {
  const key = await deriveKey(name, unb64(e.s));
  const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(e.i) }, key, unb64(e.c));
  return JSON.parse(dec.decode(pt));
}

// zăpadă
(function () {
  const box = document.createElement('div'); box.className = 'snow';
  for (let i = 0; i < 40; i++) {
    const f = document.createElement('i');
    f.style.left = Math.random() * 100 + '%';
    f.style.animationDuration = 8 + Math.random() * 10 + 's';
    f.style.animationDelay = -Math.random() * 15 + 's';
    f.style.transform = 'scale(' + (0.6 + Math.random()) + ')';
    box.appendChild(f);
  }
  document.body.appendChild(box);
})();
