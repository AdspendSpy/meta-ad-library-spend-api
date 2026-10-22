// Browser eval snippet: inventory of media slots, fonts, forms and third-party scripts.
// Set TARGET_HOST, then run at several scroll positions (top, every viewport, bottom):
// results accumulate in window.__rlpAssets so lazy-loaded media is captured as a union.
// Media is inventoried as REFERENCE ONLY (role, size, layering). Never download or hotlink it.
(() => {
  const TARGET_HOST = 'example.com';
  if (!location.hostname.endsWith(TARGET_HOST)) {
    return JSON.stringify({ ERROR: 'wrong page context', expected: TARGET_HOST, url: location.href, title: document.title });
  }

  const store = (window.__rlpAssets = window.__rlpAssets || { images: {}, videos: {}, backgrounds: {}, scrollPositions: [] });
  store.scrollPositions.push(Math.round(window.scrollY));

  const rectOf = (el) => {
    const r = el.getBoundingClientRect();
    return { x: Math.round(r.left), y: Math.round(r.top + window.scrollY), w: Math.round(r.width), h: Math.round(r.height) };
  };
  const sectionOf = (el) => {
    const s = el.closest('section, header, footer, main > div, [id]');
    return s ? s.tagName.toLowerCase() + (s.id ? '#' + s.id : '') : null;
  };

  document.querySelectorAll('img').forEach((img) => {
    const src = img.currentSrc || img.src;
    if (!src) return;
    const cs = getComputedStyle(img);
    store.images[src] = {
      src, alt: img.alt, naturalWidth: img.naturalWidth, naturalHeight: img.naturalHeight,
      aspect: img.naturalHeight ? +(img.naturalWidth / img.naturalHeight).toFixed(3) : null,
      rect: rectOf(img), section: sectionOf(img),
      siblingsInParent: img.parentElement ? img.parentElement.querySelectorAll('img').length : 0,
      position: cs.position, zIndex: cs.zIndex, objectFit: cs.objectFit
    };
  });

  document.querySelectorAll('video').forEach((v) => {
    const src = v.currentSrc || v.src || (v.querySelector('source') || {}).src || '';
    store.videos[src || 'inline-' + Object.keys(store.videos).length] = {
      src, poster: v.poster, autoplay: v.autoplay, loop: v.loop, muted: v.muted, controls: v.controls,
      rect: rectOf(v), section: sectionOf(v)
    };
  });

  document.querySelectorAll('body *').forEach((el) => {
    const bg = getComputedStyle(el).backgroundImage;
    if (bg && bg !== 'none' && bg.includes('url(')) {
      store.backgrounds[bg] = { value: bg.slice(0, 300), element: el.tagName.toLowerCase() + (el.id ? '#' + el.id : ''), rect: rectOf(el), section: sectionOf(el) };
    }
  });

  const iframes = [...document.querySelectorAll('iframe')].map((f) => ({ host: (() => { try { return new URL(f.src).hostname; } catch (e) { return null; } })(), rect: rectOf(f), section: sectionOf(f) }));

  const fonts = [...new Set([...document.querySelectorAll('h1, h2, h3, p, a, button, li, span')].slice(0, 300).map((el) => {
    const cs = getComputedStyle(el);
    return cs.fontFamily + ' | ' + cs.fontWeight;
  }))];

  const forms = [...document.querySelectorAll('form')].map((f) => ({
    action: f.getAttribute('action'), method: f.method, section: sectionOf(f),
    fields: [...f.querySelectorAll('input, select, textarea')].map((i) => ({ type: i.type, name: i.name, required: i.required }))
  }));

  const scriptHosts = [...new Set([...document.querySelectorAll('script[src]')].map((s) => {
    try { return new URL(s.src).hostname; } catch (e) { return null; }
  }).filter((h) => h && !h.endsWith(TARGET_HOST)))];

  return JSON.stringify({
    url: location.href, title: document.title, innerWidth: window.innerWidth, innerHeight: window.innerHeight,
    scrollPositions: store.scrollPositions,
    images: Object.values(store.images),
    videos: Object.values(store.videos),
    backgrounds: Object.values(store.backgrounds),
    iframes, svgCount: document.querySelectorAll('svg').length, fonts,
    formsToExclude: forms, thirdPartyScriptHostsToExclude: scriptHosts
  }, null, 2);
})();
