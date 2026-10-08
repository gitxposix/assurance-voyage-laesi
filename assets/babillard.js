/* Public bulletin content only. */
(()=>{
  let content;
  const scriptURL = document.currentScript.src;
  const siteURL = new URL('../', scriptURL);
  window.renderBabillard = language => {
    if (!content) return;
    const item = content[language] || content.fr;
    const box = document.getElementById('babillard-content');
    if (!box) return;
    for (const [selector, key] of [['h3', 'title'], ['p', 'message']]) {
      const el = box.querySelector(selector);
      if (el) el.textContent = item[key];
    }
    let img = box.querySelector('[data-babillard-image]');
    const path = typeof content.image === 'string' ? content.image : '';
    // Only images from the bulletin upload folder are rendered.
    const valid = /^\/?assets\/uploads\/babillard\/[^?#]+$/i.test(path) && !path.includes('..');
    if (!valid) { if (img) img.remove(); return; }
    if (!img) {
      img = document.createElement('img');
      img.dataset.babillardImage = '';
      img.loading = 'lazy';
      img.decoding = 'async';
      img.style.cssText = 'display:block;width:100%;max-width:480px;max-height:320px;object-fit:contain;object-position:left center;border-radius:12px;margin:18px 0 0';
      img.onerror = () => { img.remove(); };
      box.appendChild(img);
    }
    const url = new URL(path.replace(/^\//, ''), siteURL).href;
    if (img.src !== url) img.src = url;
    img.alt = typeof item.image_alt === 'string' ? item.image_alt : '';
  };
  fetch(new URL('babillard.json', scriptURL), {cache:'no-store'})
    .then(r => { if (!r.ok) throw Error('unavailable'); return r.json(); })
    .then(data => {
      if (!['fr','es'].every(l => data[l] && typeof data[l].title === 'string' && typeof data[l].message === 'string')) throw Error('invalid');
      content = data;
      window.renderBabillard(document.documentElement.lang);
    }).catch(() => { /* Preserve the original text when offline. */ });
})();
