/* Public bulletin content only. */
(()=>{
  const style = document.createElement('style');
  style.textContent = `
    .news-single { align-items:start; }
    #babillard-content.babillard-with-image { display:grid;grid-template-columns:minmax(0,1fr) 180px;gap:24px;align-items:start; }
    #babillard-content .babillard-text { min-width:0; }
    #babillard-content [data-babillard-image] { display:block;width:100%;height:auto;max-height:200px;object-fit:contain;border-radius:12px;margin:0; }
    @media(max-width:1000px) {
      #babillard-content.babillard-with-image { grid-template-columns:minmax(0,1fr) 140px;gap:18px; }
    }
    @media(max-width:760px) {
      #babillard-content.babillard-with-image { grid-template-columns:1fr;gap:12px; }
      #babillard-content [data-babillard-image] { max-width:200px;max-height:200px; }
    }
  `;
  document.head.appendChild(style);
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
    if (!box.querySelector('.babillard-text')) {
      const text = document.createElement('div');
      text.className = 'babillard-text';
      for (const el of [...box.children]) {
        if (!el.hasAttribute('data-babillard-image')) text.appendChild(el);
      }
      box.prepend(text);
    }
    let img = box.querySelector('[data-babillard-image]');
    const path = typeof content.image === 'string' ? content.image : '';
    // Only images from the bulletin upload folder are rendered.
    const valid = /^\/?assets\/uploads\/babillard\/[^?#]+$/i.test(path) && !path.includes('..');
    if (!valid) { if (img) img.remove(); box.classList.remove('babillard-with-image'); return; }
    box.classList.add('babillard-with-image');
    if (!img) {
      img = document.createElement('img');
      img.dataset.babillardImage = '';
      img.loading = 'lazy';
      img.decoding = 'async';
      img.onerror = () => { img.remove(); box.classList.remove('babillard-with-image'); };
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
