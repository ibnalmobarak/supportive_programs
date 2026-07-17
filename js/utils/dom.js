/**
 * js/utils/dom.js
 * Small, framework-free DOM & string helpers shared across components.
 */

/** Escapes a value for safe interpolation into innerHTML. */
export function escapeHtml(str) {
  if (str == null) return "";
  return String(str)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

/**
 * Takes raw text, escapes HTML entities, then:
 *  1. Converts any URL (http/https) into a clickable <a> link styled in blue.
 *  2. After every period (.) that is followed by a space or end-of-string,
 *     inserts a <br> so the next sentence starts on a new line.
 * Use this instead of escapeHtml() wherever rich inline formatting is desired
 * (e.g. descriptions, notes, conditions).
 */
export function formatText(str) {
  if (str == null) return "";
  let escaped = escapeHtml(String(str));

  // 1. Convert URLs to clickable links.
  //    After escapeHtml, & becomes &amp; so we include that in the URL pattern.
  escaped = escaped.replace(
    /(https?:\/\/[^\s<>"']*(?:&amp;[^\s<>"']*)*)/gi,
    '<a href="$1" target="_blank" rel="noopener noreferrer" class="inline-link">$1</a>'
  );

  // Fix the href: restore &amp; back to & inside href attributes only.
  escaped = escaped.replace(/href="([^"]*)"/g, (match, url) => {
    return 'href="' + url.replace(/&amp;/g, '&') + '"';
  });

  // 2. Break lines when encountering "(.)".
  //    This acts as a manual line-break trigger without showing in the text.
  //    We split by anchor tags, process only the non-tag parts, then rejoin.
  const parts = escaped.split(/(<a\s[^>]*>.*?<\/a>)/gi);
  escaped = parts.map(part => {
    // If this part is an <a> tag, leave it untouched
    if (/^<a\s/i.test(part)) return part;
    // Replace "(.)" and any surrounding spaces with "<br>"
    return part.replace(/\s*\(\.\)\s*/g, '<br>');
  }).join('');

  return escaped;
}

/** Shorthand for document.getElementById, returns null safely if missing. */
export function $id(id) {
  return document.getElementById(id);
}

/** Shorthand for querySelectorAll -> real array. */
export function $all(selector, root = document) {
  return Array.from(root.querySelectorAll(selector));
}
