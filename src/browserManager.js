const puppeteer = require('puppeteer');

let browserInstance = null;
let launchPromise = null;
let screenshotCount = 0;

const DEFAULT_RESTART_THRESHOLD = parseInt(
  process.env.MAX_SCREENSHOTS_BEFORE_RESTART || '100',
  10
);

/**
 * Returns an active Puppeteer browser instance.
 * Automatically initializes or reconnects if crashed/disconnected.
 * Also recycles the browser after N screenshots to prevent memory fragmentation.
 * @param {object} [customLaunchOptions={}] - Optional Puppeteer launch arguments
 * @returns {Promise<puppeteer.Browser>}
 */
async function getBrowser(customLaunchOptions = {}) {
  // If threshold reached, recycle browser cleanly
  if (browserInstance && screenshotCount >= DEFAULT_RESTART_THRESHOLD) {
    await closeBrowser();
  }

  // If already launching, wait for the existing launch promise
  if (launchPromise) {
    return launchPromise;
  }

  // Check if existing browser is still connected
  if (browserInstance && browserInstance.isConnected()) {
    return browserInstance;
  }

  // Otherwise, launch a new browser
  launchPromise = (async () => {
    try {
      const defaultArgs = [
        '--disable-setuid-sandbox',
        '--no-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--no-first-run',
        '--no-default-browser-check',
        '--single-process'
      ];

      const defaultOptions = {
        args: defaultArgs,
        headless: 'new',
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
        ...customLaunchOptions
      };

      const browser = await puppeteer.launch(defaultOptions);

      // Handle accidental disconnects or crashes
      browser.on('disconnected', () => {
        browserInstance = null;
      });

      browserInstance = browser;
      screenshotCount = 0;
      return browser;
    } finally {
      launchPromise = null;
    }
  })();

  return launchPromise;
}

/**
 * Increments the internal screenshot counter.
 */
function incrementScreenshotCount() {
  screenshotCount++;
}

/**
 * Gracefully closes the active browser instance if connected.
 * @returns {Promise<void>}
 */
async function closeBrowser() {
  if (browserInstance) {
    try {
      if (browserInstance.isConnected()) {
        await browserInstance.close();
      }
    } catch (err) {
      // Ignore errors on close
    } finally {
      browserInstance = null;
      screenshotCount = 0;
    }
  }
}

/**
 * Returns the current health and usage status of the managed browser.
 * @returns {{ isConnected: boolean, screenshotCount: number, restartThreshold: number }}
 */
function getStatus() {
  return {
    isConnected: Boolean(browserInstance && browserInstance.isConnected()),
    screenshotCount,
    restartThreshold: DEFAULT_RESTART_THRESHOLD
  };
}

module.exports = {
  getBrowser,
  incrementScreenshotCount,
  closeBrowser,
  getStatus
};
