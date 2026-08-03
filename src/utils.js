const path = require('path');
const { URL } = require('url');

/**
 * Validates and normalizes a URL string.
 * Automatically prepends 'https://' if protocol is omitted.
 * @param {string} url - The URL to validate
 * @returns {string} - The normalized valid URL string
 */
function validateAndNormalizeUrl(url) {
  if (!url || typeof url !== 'string') {
    throw new TypeError('URL must be a non-empty string');
  }

  let normalized = url.trim();
  if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(normalized)) {
    normalized = `https://${normalized}`;
  }

  try {
    const parsed = new URL(normalized);
    if (!['http:', 'https:', 'data:', 'about:'].includes(parsed.protocol)) {
      throw new Error(`Unsupported protocol: ${parsed.protocol}. Only http, https, data, and about are supported.`);
    }
    return parsed.toString();
  } catch (err) {
    throw new Error(`Invalid URL provided: "${url}" (${err.message})`);
  }
}

/**
 * Detects output file format from file path extension.
 * @param {string} filePath - Target file path
 * @param {string} [defaultFormat='png'] - Default format if extension is unrecognized
 * @returns {'png' | 'jpeg' | 'webp' | 'pdf'}
 */
function detectFormatFromPath(filePath, defaultFormat = 'png') {
  if (!filePath || typeof filePath !== 'string') {
    return defaultFormat;
  }
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case '.jpg':
    case '.jpeg':
      return 'jpeg';
    case '.webp':
      return 'webp';
    case '.pdf':
      return 'pdf';
    case '.png':
      return 'png';
    default:
      return defaultFormat;
  }
}

/**
 * Generates a CSS style string to hide specified CSS selectors.
 * @param {string|string[]} selectors - Single selector string or array of selectors
 * @returns {string} - CSS string
 */
function generateHideCss(selectors) {
  if (!selectors) return '';
  const list = Array.isArray(selectors) ? selectors : [selectors];
  const validSelectors = list.filter(s => s && typeof s === 'string' && s.trim().length > 0);
  if (validSelectors.length === 0) return '';
  return `${validSelectors.join(', ')} { display: none !important; visibility: hidden !important; opacity: 0 !important; }`;
}

/**
 * Domains commonly associated with ads and tracking scripts.
 */
const AD_AND_TRACKING_DOMAINS = [
  'doubleclick.net',
  'googleadservices.com',
  'googlesyndication.com',
  'adservice.google.com',
  'google-analytics.com',
  'analytics.google.com',
  'facebook.net',
  'connect.facebook.net',
  'adsystem.com',
  'adroll.com',
  'amazon-adsystem.com',
  'criteo.com',
  'outbrain.com',
  'taboola.com'
];

/**
 * Checks if a request URL matches known ad/tracking domains.
 * @param {string} requestUrl - The HTTP request URL
 * @returns {boolean}
 */
function isAdOrTrackerUrl(requestUrl) {
  try {
    const { hostname } = new URL(requestUrl);
    return AD_AND_TRACKING_DOMAINS.some(domain =>
      hostname === domain || hostname.endsWith(`.${domain}`)
    );
  } catch {
    return false;
  }
}

module.exports = {
  validateAndNormalizeUrl,
  detectFormatFromPath,
  generateHideCss,
  isAdOrTrackerUrl,
  AD_AND_TRACKING_DOMAINS
};
