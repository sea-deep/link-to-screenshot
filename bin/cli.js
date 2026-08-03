#!/usr/bin/env node
const path = require('path');
const screenshot = require('../src/index');
const pkg = require('../package.json');

function printHelp() {
  console.log(`
  ${pkg.name} v${pkg.version} - ${pkg.description}

  USAGE:
    link-to-screenshot <url> [options]
    link-to-screenshot --html "<h1>Hello World</h1>" -o output.png

  OPTIONS:
    -o, --output <path>       Output image path (default: screenshot.png)
    --full-page               Capture full scrollable web page
    --mobile [device]         Emulate mobile device (default: iPhone 13 Pro Max)
    --width <pixels>          Viewport width (default: 1920)
    --height <pixels>         Viewport height (default: 1080)
    --scale <number>          Device scale factor (default: 1)
    --dark-mode               Emulate prefers-color-scheme: dark
    --delay <ms>              Wait N milliseconds before capturing
    --wait-for <selector>     Wait for DOM CSS selector before capturing
    --click <selector>        Click CSS selector before capturing
    --hide <selectors>        Comma-separated CSS selectors to hide
    --block-ads               Block common ad and tracking domains
    --html <code>             Render an HTML string directly instead of a URL
    --quiet                   Suppress non-error logs
    -v, --version             Display version
    -h, --help                Display this help screen

  EXAMPLES:
    # Capture desktop PNG of a website
    link-to-screenshot https://example.com -o example.png

    # Capture mobile full-page screenshot in dark mode
    link-to-screenshot https://example.com -o mobile-dark.png --mobile --full-page --dark-mode

    # Capture PDF of an invoice HTML string
    link-to-screenshot --html "<h1>Invoice #123</h1>" -o invoice.pdf
`);
}

async function run() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('-h') || args.includes('--help')) {
    printHelp();
    process.exit(0);
  }

  if (args.includes('-v') || args.includes('--version')) {
    console.log(pkg.version);
    process.exit(0);
  }

  let url = null;
  let html = null;
  let outputPath = 'screenshot.png';
  let fullPage = false;
  let mobile = false;
  let width = 1920;
  let height = 1080;
  let deviceScaleFactor = 1;
  let darkMode = false;
  let delay = 0;
  let waitForSelector = null;
  let click = null;
  let hideSelectors = [];
  let blockAds = false;
  let quiet = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '-o' || arg === '--output') {
      outputPath = args[++i];
    } else if (arg === '--full-page') {
      fullPage = true;
    } else if (arg === '--mobile') {
      const nextArg = args[i + 1];
      if (nextArg && !nextArg.startsWith('-')) {
        mobile = nextArg;
        i++;
      } else {
        mobile = true;
      }
    } else if (arg === '--width') {
      width = parseInt(args[++i], 10);
    } else if (arg === '--height') {
      height = parseInt(args[++i], 10);
    } else if (arg === '--scale') {
      deviceScaleFactor = parseFloat(args[++i]);
    } else if (arg === '--dark-mode') {
      darkMode = true;
    } else if (arg === '--delay') {
      delay = parseInt(args[++i], 10);
    } else if (arg === '--wait-for') {
      waitForSelector = args[++i];
    } else if (arg === '--click') {
      click = args[++i];
    } else if (arg === '--hide') {
      const selectorsStr = args[++i] || '';
      hideSelectors = selectorsStr.split(',').map(s => s.trim()).filter(Boolean);
    } else if (arg === '--block-ads') {
      blockAds = true;
    } else if (arg === '--html') {
      html = args[++i];
    } else if (arg === '--quiet') {
      quiet = true;
    } else if (!arg.startsWith('-') && !url && !html) {
      url = arg;
    } else {
      console.error(`Unknown or invalid argument: ${arg}`);
      process.exit(1);
    }
  }

  if (!url && !html) {
    console.error('Error: You must specify a target URL or provide an --html string.');
    process.exit(1);
  }

  try {
    const start = Date.now();
    if (!quiet) {
      console.log(`[link-to-screenshot] Capturing ${url ? `URL: ${url}` : 'HTML string'}...`);
    }

    let result;
    if (url) {
      result = await screenshot.file(url, outputPath, {
        fullPage,
        mobile,
        width,
        height,
        deviceScaleFactor,
        darkMode,
        delay,
        waitForSelector,
        click,
        hideSelectors,
        blockAds
      });
    } else {
      result = await screenshot.htmlToFile(html, outputPath, {
        fullPage,
        mobile,
        width,
        height,
        deviceScaleFactor,
        darkMode,
        delay,
        waitForSelector,
        click,
        hideSelectors,
        blockAds
      });
    }

    const duration = ((Date.now() - start) / 1000).toFixed(2);
    if (!quiet) {
      console.log(`[link-to-screenshot] Saved screenshot to ${result.filePath} (${duration}s)`);
    }
    process.exit(0);
  } catch (err) {
    console.error(`[link-to-screenshot] Error capturing screenshot:`, err.message);
    process.exit(1);
  } finally {
    await screenshot.close();
  }
}

if (require.main === module) {
  run();
}

module.exports = { run };
