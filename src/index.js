const fs = require('fs').promises;
const path = require('path');
const { capture } = require('./capture');
const { closeBrowser, getStatus, getBrowser } = require('./browserManager');
const { detectFormatFromPath } = require('./utils');

/**
 * Captures a screenshot of a web page as a Buffer.
 *
 * @param {string} url - Target web URL
 * @param {object} [options={}] - Screenshot & viewport options
 * @returns {Promise<Buffer|{ buffer: Buffer, title: string, url: string }>}
 */
async function screenshot(url, options = {}) {
  if (url && typeof url === 'object') {
    return capture(url);
  }
  return capture({ ...options, url });
}

/**
 * Captures a screenshot and saves it directly to a file.
 * The output format is automatically inferred from the file extension (.png, .jpg, .webp, .pdf)
 * unless explicitly overridden in options.
 *
 * @param {string} url - Target web URL
 * @param {string} outputPath - Output file path
 * @param {object} [options={}] - Screenshot & viewport options
 * @returns {Promise<{ filePath: string, buffer: Buffer, title: string, url: string }>}
 */
screenshot.file = async function (url, outputPath, options = {}) {
  let targetUrl = url;
  let targetPath = outputPath;
  let targetOpts = options;

  if (url && typeof url === 'object') {
    targetOpts = url;
    targetUrl = targetOpts.url;
    targetPath = outputPath;
  }

  if (!targetPath || typeof targetPath !== 'string') {
    throw new Error('outputPath must be a valid file path string');
  }

  const format = targetOpts.format || detectFormatFromPath(targetPath);
  const result = await capture({
    ...targetOpts,
    url: targetUrl,
    format,
    returnDetails: true
  });

  // Ensure parent directory exists
  const dir = path.dirname(targetPath);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(targetPath, result.buffer);

  return {
    filePath: path.resolve(targetPath),
    buffer: result.buffer,
    title: result.title,
    url: result.url
  };
};

/**
 * Captures a screenshot of a web page and returns it as a Base64 string or Data URL.
 *
 * @param {string} url - Target web URL
 * @param {object} [options={}] - Screenshot & viewport options
 * @param {boolean} [options.dataUrl=false] - If true, prefixes with data:image/<format>;base64,
 * @returns {Promise<string>}
 */
screenshot.base64 = async function (url, options = {}) {
  let targetUrl = url;
  let targetOpts = options;
  if (url && typeof url === 'object') {
    targetOpts = url;
    targetUrl = targetOpts.url;
  }

  const format = targetOpts.format || 'png';
  const buffer = await capture({ ...targetOpts, url: targetUrl, format, returnDetails: false });
  const base64Str = buffer.toString('base64');
  if (targetOpts.dataUrl) {
    const mimeType = format === 'jpg' ? 'jpeg' : format;
    return `data:image/${mimeType};base64,${base64Str}`;
  }
  return base64Str;
};

/**
 * Directly renders an HTML string to a screenshot Buffer.
 *
 * @param {string} htmlString - Raw HTML content string
 * @param {object} [options={}] - Viewport & rendering options
 * @returns {Promise<Buffer>}
 */
screenshot.html = async function (htmlString, options = {}) {
  return capture({ ...options, html: htmlString });
};

/**
 * Directly renders an HTML string and saves the screenshot to a file.
 *
 * @param {string} htmlString - Raw HTML content string
 * @param {string} outputPath - Output file path
 * @param {object} [options={}] - Viewport & rendering options
 * @returns {Promise<{ filePath: string, buffer: Buffer }>}
 */
screenshot.htmlToFile = async function (htmlString, outputPath, options = {}) {
  if (!outputPath || typeof outputPath !== 'string') {
    throw new Error('outputPath must be a valid file path string');
  }

  const format = options.format || detectFormatFromPath(outputPath);
  const buffer = await capture({ ...options, html: htmlString, format });

  const dir = path.dirname(outputPath);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(outputPath, buffer);

  return {
    filePath: path.resolve(outputPath),
    buffer
  };
};

/**
 * Shuts down and cleans up any open Puppeteer browser instance managed by the library.
 * Should be called when the application or script is shutting down.
 *
 * @returns {Promise<void>}
 */
screenshot.close = async function () {
  await closeBrowser();
};

/**
 * Returns current browser connection status and screenshot counter.
 * @returns {{ isConnected: boolean, screenshotCount: number, restartThreshold: number }}
 */
screenshot.getStatus = function () {
  return getStatus();
};

/**
 * Returns the underlying Puppeteer browser instance for advanced custom automation.
 * @returns {Promise<puppeteer.Browser>}
 */
screenshot.getBrowser = getBrowser;

module.exports = screenshot;
