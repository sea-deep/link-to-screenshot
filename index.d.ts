import { Browser } from 'puppeteer';

export interface ScreenshotOptions {
  /**
   * The target HTTP/HTTPS URL to capture.
   */
  url?: string;

  /**
   * Raw HTML string to render directly instead of navigating to a URL.
   */
  html?: string;

  /**
   * If true, takes a screenshot of the entire scrollable page.
   * @default false
   */
  fullPage?: boolean;

  /**
   * Emulates a mobile device viewport and user-agent.
   * Can be a boolean or the name of a device from Puppeteer's KnownDevices (e.g., "iPhone 13 Pro Max").
   * @default false
   */
  mobile?: boolean | string;

  /**
   * Viewport width in pixels.
   * @default 1920
   */
  width?: number;

  /**
   * Viewport height in pixels.
   * @default 1080
   */
  height?: number;

  /**
   * Device scale factor (for Retina display resolution).
   * @default 1
   */
  deviceScaleFactor?: number;

  /**
   * Output image file format.
   * @default "png"
   */
  format?: 'png' | 'jpeg' | 'webp' | 'pdf';

  /**
   * Image compression quality (1-100), applicable only for jpeg and webp formats.
   */
  quality?: number;

  /**
   * Emulates `prefers-color-scheme: dark`.
   * @default false
   */
  darkMode?: boolean;

  /**
   * Time in milliseconds to delay after page load before taking the screenshot.
   * @default 0
   */
  delay?: number;

  /**
   * CSS selector to await in the DOM before taking the screenshot.
   */
  waitForSelector?: string;

  /**
   * CSS selector to click before taking the screenshot (e.g. cookie consent buttons).
   */
  click?: string;

  /**
   * One or more CSS selectors to hide (`display: none !important`) before taking the screenshot.
   */
  hideSelectors?: string | string[];

  /**
   * Automatically blocks known ad and tracker domains to speed up rendering.
   * @default false
   */
  blockAds?: boolean;

  /**
   * Custom User-Agent string.
   */
  userAgent?: string;

  /**
   * Custom HTTP request headers.
   */
  headers?: Record<string, string>;

  /**
   * Navigation timeout in milliseconds.
   * @default 30000
   */
  timeout?: number;

  /**
   * When to consider navigation succeeded.
   * @default "networkidle2"
   */
  waitUntil?: 'load' | 'domcontentloaded' | 'networkidle0' | 'networkidle2';

  /**
   * If true, returns an object containing Buffer and metadata instead of plain Buffer.
   * @default false
   */
  returnDetails?: boolean;

  /**
   * Provide a custom existing Puppeteer Browser instance instead of using the managed pool.
   */
  browser?: Browser;
}

export interface ScreenshotResult {
  /**
   * Image or PDF binary Buffer.
   */
  buffer: Buffer;

  /**
   * Page title.
   */
  title: string;

  /**
   * Final page URL after redirects.
   */
  url: string;
}

export interface ScreenshotFileResult extends ScreenshotResult {
  /**
   * Absolute path where the file was saved.
   */
  filePath: string;
}

export interface ScreenshotHtmlFileResult {
  filePath: string;
  buffer: Buffer;
}

export interface BrowserStatus {
  isConnected: boolean;
  screenshotCount: number;
  restartThreshold: number;
}

/**
 * Captures a screenshot of a webpage and returns it as a Buffer (or detailed result object).
 *
 * @param url Target HTTP or HTTPS URL
 * @param options Viewport, rendering, and capture options
 */
declare function screenshot(
  url: string,
  options?: ScreenshotOptions & { returnDetails?: false }
): Promise<Buffer>;

declare function screenshot(
  url: string,
  options: ScreenshotOptions & { returnDetails: true }
): Promise<ScreenshotResult>;

declare namespace screenshot {
  /**
   * Captures a screenshot and saves it directly to a file on disk.
   * Automatically detects image format from file extension unless overridden in options.
   *
   * @param url Target HTTP or HTTPS URL
   * @param outputPath Output file path (e.g., "./output.png")
   * @param options Viewport, rendering, and capture options
   */
  function file(
    url: string,
    outputPath: string,
    options?: ScreenshotOptions
  ): Promise<ScreenshotFileResult>;

  /**
   * Captures a screenshot and returns it as a Base64-encoded string or Data URL.
   *
   * @param url Target HTTP or HTTPS URL
   * @param options Viewport, rendering, and capture options
   */
  function base64(
    url: string,
    options?: ScreenshotOptions & { dataUrl?: boolean }
  ): Promise<string>;

  /**
   * Directly renders a raw HTML string into a screenshot Buffer.
   *
   * @param htmlString Raw HTML content string
   * @param options Viewport, rendering, and capture options
   */
  function html(
    htmlString: string,
    options?: Omit<ScreenshotOptions, 'url'>
  ): Promise<Buffer>;

  /**
   * Directly renders a raw HTML string and saves it to a file on disk.
   *
   * @param htmlString Raw HTML content string
   * @param outputPath Output file path
   * @param options Viewport, rendering, and capture options
   */
  function htmlToFile(
    htmlString: string,
    outputPath: string,
    options?: Omit<ScreenshotOptions, 'url'>
  ): Promise<ScreenshotHtmlFileResult>;

  /**
   * Shuts down and cleans up any open Puppeteer browser managed by the library.
   * Recommended to call before exiting your process.
   */
  function close(): Promise<void>;

  /**
   * Returns current browser connection status and screenshot counter.
   */
  function getStatus(): BrowserStatus;

  /**
   * Returns the underlying Puppeteer browser instance for custom automation tasks.
   */
  function getBrowser(customLaunchOptions?: Record<string, any>): Promise<Browser>;
}

export default screenshot;
