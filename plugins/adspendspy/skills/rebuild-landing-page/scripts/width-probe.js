// Browser eval snippet: DOM rect probe of top-level blocks and key containers.
// Set TARGET_HOST, then run at widths 390, 1440 and 1920 (and the hero at two window heights).
// Read innerWidth/innerHeight in the output: some tools ignore the requested viewport size.
// Fit each block's numbers across widths to a width model (see references/extraction.md).
(() => {
  const TARGET_HOST = 'example.com';
  if (!location.hostname.endsWith(TARGET_HOST)) {
    return JSON.stringify({ ERROR: 'wrong page context', expected: TARGET_HOST, url: location.href, title: document.title });
  }

  const rect = (el) => {
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    return {
      x: Math.round(r.left), y: Math.round(r.top + window.scrollY), w: Math.round(r.width), h: Math.round(r.height),
      maxWidth: cs.maxWidth, paddingLeft: cs.paddingLeft, paddingRight: cs.paddingRight, position: cs.position
    };
  };
  const label = (el) => el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + (el.className && el.className.toString ? '.' + el.className.toString().split(/\s+/).filter(Boolean).slice(0, 2).join('.') : '');

  // Top-level blocks: direct children of main (or body), skipping invisible ones.
  const container = document.querySelector('main') || document.body;
  let blocks = [...container.children];
  if (blocks.length === 1) blocks = [...blocks[0].children];
  blocks = blocks.filter((el) => el.getBoundingClientRect().height > 0 && !['SCRIPT', 'STYLE', 'NOSCRIPT', 'LINK'].includes(el.tagName));

  const key = {};
  const pick = (name, sel) => { const el = document.querySelector(sel); if (el) key[name] = { selector: sel, label: label(el), ...rect(el) }; };
  pick('nav', 'header, nav');
  pick('h1', 'h1');
  pick('firstH2', 'h2');
  pick('firstImage', 'main img, body img');
  pick('firstVideo', 'video, iframe');
  pick('firstGrid', '[style*="grid"], .grid');
  pick('firstButton', 'a[href] button, button, a[class*="btn"], a[class*="button"]');

  const wide = [...document.querySelectorAll('body *')].find((el) => {
    const mw = getComputedStyle(el).maxWidth;
    return mw && mw !== 'none' && parseFloat(mw) >= 600 && el.getBoundingClientRect().height > 100;
  });

  return JSON.stringify({
    url: location.href,
    innerWidth: window.innerWidth,
    innerHeight: window.innerHeight,
    docHeight: document.documentElement.scrollHeight,
    mainWrapperCap: wide ? { label: label(wide), maxWidth: getComputedStyle(wide).maxWidth, ...rect(wide) } : null,
    blocks: blocks.map((el) => ({ label: label(el), ...rect(el) })),
    key
  }, null, 2);
})();
