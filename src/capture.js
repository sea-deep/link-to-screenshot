const { KnownDevices } = require('puppeteer');
const { getBrowser, incrementScreenshotCount } = require('./browserManager');
const {
  validateAndNormalizeUrl,
  generateHideCss,
  isAdOrTrackerUrl
} = require('./utils');

/**
 * Core screenshot capture engine using Puppeteer.
 * Supports URL navigation, HTML string rendering, viewport control,
 * ad blocking, dark mode, selector hiding/waiting, and format selection.
 *
 * @param {object} options
 * @param {string} [options.url] - Target URL to capture
 * @param {string} [options.html] - Raw HTML string to render
 * @param {boolean} [options.fullPage=false] - Capture full scrollable page
 * @param {boolean|string} [options.mobile=false] - Mobile emulation (boolean or device name)
 * @param {number} [options.width=1920] - Viewport width
 * @param {number} [options.height=1080] - Viewport height
 * @param {number} [options.deviceScaleFactor=1] - Device scale factor (Retina support)
 * @param {'png'|'jpeg'|'webp'|'pdf'} [options.format='png'] - Output format
 * @param {number} [options.quality] - Image quality (1-100, for jpeg/webp)
 * @param {boolean} [options.darkMode=false] - Emulate dark color scheme
 * @param {number} [options.delay=0] - Milliseconds to delay before screenshot
 * @param {string} [options.waitForSelector] - CSS selector to await in DOM
 * @param {string} [options.click] - CSS selector to click before capture
 * @param {string|string[]} [options.hideSelectors] - Selectors to hide via CSS
 * @param {boolean} [options.blockAds=false] - Block common ad/tracker domains
 * @param {string} [options.userAgent] - Custom User-Agent string
 * @param {object} [options.headers] - Custom HTTP request headers
 * @param {number} [options.timeout=30000] - Navigation timeout in ms
 * @param {string} [options.waitUntil='networkidle2'] - Navigation wait condition
 * @param {boolean} [options.returnDetails=false] - Return object with metadata instead of plain Buffer
 * @param {object} [options.browser] - Custom existing browser instance
 * @returns {Promise<Buffer|{ buffer: Buffer, title: string, url: string }>}
 */
async function capture(options = {}) {
  const {
    url,
    html,
    fullPage = false,
    mobile = false,
    width = 1920,
    height = 1080,
    deviceScaleFactor = 1,
    format = 'png',
    quality,
    darkMode = false,
    delay = 0,
    waitForSelector,
    click,
    hideSelectors,
    blockAds = false,
    userAgent,
    headers,
    timeout = 30000,
    waitUntil = 'networkidle2',
    returnDetails = false,
    browser: customBrowser
  } = options;

  if (!url && !html) {
    throw new Error('You must provide either a "url" or an "html" option to capture.');
  }

  const normalizedUrl = url ? validateAndNormalizeUrl(url) : null;
  const browser = customBrowser || (await getBrowser());
  const page = await browser.newPage();

  try {
    // Configure mobile emulation or standard viewport
    if (mobile) {
      const deviceName = typeof mobile === 'string' ? mobile : 'iPhone 13 Pro Max';
      const device = KnownDevices[deviceName];
      if (device) {
        await page.emulate(device);
      } else {
        await page.setViewport({
          width: 390,
          height: 844,
          isMobile: true,
          hasTouch: true,
          deviceScaleFactor: 3
        });
      }
    } else {
      await page.setViewport({
        width: Number(width) || 1920,
        height: Number(height) || 1080,
        deviceScaleFactor: Number(deviceScaleFactor) || 1
      });
    }

    // Set custom User-Agent
    if (userAgent) {
      await page.setUserAgent(userAgent);
    }

    // Set custom HTTP headers
    if (headers && typeof headers === 'object') {
      await page.setExtraHTTPHeaders(headers);
    }

    // Configure Dark Mode emulation
    if (darkMode) {
      await page.emulateMediaFeatures([
        { name: 'prefers-color-scheme', value: 'dark' }
      ]);
    }

    // Configure Ad & Tracker Blocking
    if (blockAds) {
      await page.setRequestInterception(true);
      page.on('request', (req) => {
        const reqUrl = req.url();
        if (isAdOrTrackerUrl(reqUrl)) {
          req.abort();
        } else {
          req.continue();
        }
      });
    }

    // Navigate to target URL or render HTML string
    if (normalizedUrl) {
      await page.goto(normalizedUrl, {
        timeout: Number(timeout) || 30000,
        waitUntil
      });
    } else if (html) {
      await page.setContent(html, {
        timeout: Number(timeout) || 30000,
        waitUntil: 'load'
      });
    }

    // Inject CSS to hide unwanted DOM elements (cookie banners, overlays, ads)
    const hideCss = generateHideCss(hideSelectors);
    if (hideCss) {
      await page.addStyleTag({ content: hideCss });
    }

    // Click selector if specified (e.g. accept/dismiss modal)
    if (click && typeof click === 'string') {
      try {
        await page.waitForSelector(click, { timeout: 3000 });
        await page.click(click);
      } catch (e) {
        // Continue even if click target wasn't found or timed out
      }
    }

    // Wait for a specific DOM selector if requested
    if (waitForSelector && typeof waitForSelector === 'string') {
      await page.waitForSelector(waitForSelector, {
        timeout: Number(timeout) || 30000
      });
    }

    // Apply custom delay before capture if requested
    if (delay && Number(delay) > 0) {
      await new Promise(resolve => setTimeout(resolve, Number(delay)));
    }

    // Capture output Buffer
    let buffer;
    if (format === 'pdf') {
      buffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '10mm', bottom: '10mm', left: '10mm', right: '10mm' }
      });
    } else {
      const screenshotOptions = {
        type: format === 'jpg' ? 'jpeg' : format,
        fullPage: Boolean(fullPage)
      };

      if (['jpeg', 'jpg', 'webp'].includes(format) && quality !== undefined) {
        screenshotOptions.quality = Math.max(1, Math.min(100, Number(quality)));
      }

      buffer = await page.screenshot(screenshotOptions);
    }

    // Collect page title & current URL
    const title = await page.title();
    const currentUrl = page.url();

    // Increment global screenshot count
    if (!customBrowser) {
      incrementScreenshotCount();
    }

    if (returnDetails) {
      return {
        buffer,
        title,
        url: currentUrl
      };
    }

    return buffer;
  } finally {
    // ALWAYS ensure page is closed to prevent memory leaks
    if (page && !page.isClosed()) {
      await page.close().catch(() => {});
    }
  }
}

module.exports = { capture };
