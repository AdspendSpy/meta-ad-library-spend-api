// Browser eval snippet: exact computed styles of one container and its descendants (depth 4).
// Set TARGET_HOST and SELECTOR, then run. Run again after triggering a state change
// (scroll past threshold, click a tab, hover) and diff the two outputs: the diff is the behavior spec.
// Text is truncated on purpose: specs keep a content outline, not the original copy.
(() => {
  const TARGET_HOST = 'example.com';
  const SELECTOR = 'section';
  if (!location.hostname.endsWith(TARGET_HOST)) {
    return JSON.stringify({ ERROR: 'wrong page context', expected: TARGET_HOST, url: location.href, title: document.title });
  }
  const root = document.querySelector(SELECTOR);
  if (!root) return JSON.stringify({ ERROR: 'element not found', selector: SELECTOR });

  const props = ['fontSize', 'fontWeight', 'fontFamily', 'lineHeight', 'letterSpacing', 'color',
    'textTransform', 'textDecoration', 'textAlign', 'backgroundColor', 'backgroundImage',
    'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
    'marginTop', 'marginRight', 'marginBottom', 'marginLeft',
    'width', 'height', 'maxWidth', 'minWidth', 'maxHeight', 'minHeight', 'aspectRatio',
    'display', 'flexDirection', 'flexWrap', 'justifyContent', 'alignItems', 'gap',
    'gridTemplateColumns', 'gridTemplateRows',
    'borderRadius', 'borderTop', 'borderRight', 'borderBottom', 'borderLeft',
    'boxShadow', 'overflowX', 'overflowY',
    'position', 'top', 'right', 'bottom', 'left', 'zIndex',
    'opacity', 'transform', 'transition', 'animationName', 'animationDuration', 'cursor',
    'objectFit', 'objectPosition', 'mixBlendMode', 'filter', 'backdropFilter',
    'whiteSpace', 'textOverflow', 'WebkitLineClamp', 'scrollSnapType', 'scrollSnapAlign'];
  const skip = new Set(['none', 'normal', 'auto', '0px', 'rgba(0, 0, 0, 0)', 'start', 'visible']);

  const stylesOf = (el) => {
    const cs = getComputedStyle(el);
    const out = {};
    props.forEach((p) => { const v = cs[p]; if (v && !skip.has(v)) out[p] = v; });
    return out;
  };

  const walk = (el, depth) => {
    if (depth > 4) return null;
    const r = el.getBoundingClientRect();
    const kids = [...el.children];
    const ownText = [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent.trim()).join(' ').trim();
    return {
      tag: el.tagName.toLowerCase(),
      id: el.id || null,
      classes: (el.className && el.className.toString ? el.className.toString() : '').split(/\s+/).slice(0, 5).join(' '),
      rect: { x: Math.round(r.left), y: Math.round(r.top + window.scrollY), w: Math.round(r.width), h: Math.round(r.height) },
      textOutline: ownText ? { words: ownText.split(/\s+/).length, sample: ownText.slice(0, 40) } : null,
      media: el.tagName === 'IMG' ? { aspect: el.naturalHeight ? +(el.naturalWidth / el.naturalHeight).toFixed(3) : null, alt: el.alt ? 'present' : 'empty' } : null,
      styles: stylesOf(el),
      childCount: kids.length,
      children: kids.slice(0, 20).map((c) => walk(c, depth + 1)).filter(Boolean)
    };
  };

  return JSON.stringify({ url: location.href, innerWidth: window.innerWidth, scrollY: Math.round(window.scrollY), selector: SELECTOR, tree: walk(root, 0) }, null, 2);
})();
