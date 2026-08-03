# link-to-screenshot

[![npm version](https://img.shields.io/npm/v/link-to-screenshot.svg)](https://www.npmjs.com/package/link-to-screenshot)
[![CI](https://github.com/sea-deep/link-to-screenshot/actions/workflows/ci.yml/badge.svg)](https://github.com/sea-deep/link-to-screenshot/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/node/v/link-to-screenshot.svg)](https://nodejs.org/)
[![GitHub Repo](https://img.shields.io/badge/GitHub-Repository-181717?logo=github)](https://github.com/sea-deep/link-to-screenshot)

An **npm package and CLI tool** for capturing high-resolution website screenshots, mobile emulations, PDFs, and HTML renders from any link or URL using Puppeteer.

Unlike basic wrappers, `link-to-screenshot` features an **auto-reconnecting browser pool**, **automatic memory-leak prevention**, **cookie banner & overlay removal**, and **ad/tracker blocking** out of the box.

---

## 🌟 Key Features

- **🚀 Auto-Reconnecting Browser Pool**: Manages a shared, lazy-loaded Puppeteer instance that automatically recovers from crashes and recycles itself after heavy use to prevent Chromium memory fragmentation.
- **🛡️ Guaranteed Resource Cleanup**: Wrapped in strict `try...finally` execution blocks—never leaks open tabs or orphan browser processes.
- **🎨 Dark Mode & Viewport Control**: Effortlessly emulate dark mode (`prefers-color-scheme: dark`), Retina displays, desktop viewports, or mobile devices (e.g. `iPhone 13 Pro Max`).
- **🧹 Cookie Banner & Ad Blocking**: Remove popups, cookie consent banners, and tracking scripts before capture using `hideSelectors` and `blockAds`.
- **📄 HTML-to-Image & PDF**: Directly render HTML strings to `.png`, `.jpg`, `.webp`, or `.pdf` files.
- **💻 Powerful CLI**: Run screenshots directly from your terminal or CI/CD pipelines via `npx link-to-screenshot`.
- **📦 TypeScript Ready**: Fully typed with JSDoc documentation (`index.d.ts`).

---

## 📦 Installation

```bash
npm install link-to-screenshot
```

> **Note**: This package installs Puppeteer automatically. If Chrome/Chromium is not already installed on your machine, run:
> ```bash
> npx puppeteer browsers install chrome
> ```

---

## 🚀 Quickstart

### 1. Capture to Buffer
```javascript
const screenshot = require('link-to-screenshot');

async function main() {
  // Returns an image Buffer (default PNG)
  const buffer = await screenshot('https://example.com');
  console.log('Captured screenshot buffer:', buffer.length, 'bytes');

  // Remember to close the managed browser when your script shuts down
  await screenshot.close();
}

main();
```

### 2. Capture and Save Directly to Disk
```javascript
const screenshot = require('link-to-screenshot');

async function main() {
  // Format is automatically inferred from file extension (.png, .jpg, .webp, .pdf)
  const result = await screenshot.file('https://example.com', './output/example.png', {
    fullPage: true,
    darkMode: true
  });

  console.log(`Saved "${result.title}" (${result.url}) to ${result.filePath}`);
  await screenshot.close();
}

main();
```

---

## 💡 Advanced Usage & Cookbook

### Emulating Mobile Devices & Dark Mode
```javascript
await screenshot.file('https://example.com', './mobile-dark.webp', {
  mobile: 'iPhone 13 Pro Max',
  darkMode: true,
  fullPage: true,
  quality: 90
});
```

### Hiding Cookie Banners, Ads & Chat Widgets
Use `hideSelectors` to inject CSS rules (`display: none !important`) before taking the screenshot:
```javascript
await screenshot.file('https://example.com', './clean-screenshot.png', {
  hideSelectors: [
    '#cookie-banner',
    '.optanon-alert-box-wrapper',
    '#intercom-frame',
    'header.fixed'
  ],
  blockAds: true // Aborts requests to Google Analytics, DoubleClick, etc.
});
```

### Rendering Raw HTML Strings to Image or PDF
Great for generating invoices, email templates, or dynamic social share cards:
```javascript
const html = `
  <div style="font-family: sans-serif; padding: 40px; background: #0f172a; color: white;">
    <h1>Invoice #2049</h1>
    <p>Total Due: <strong>$150.00</strong></p>
  </div>
`;

// Save directly to PDF
await screenshot.htmlToFile(html, './invoice.pdf', {
  width: 800,
  height: 600
});
```

### Getting a Base64 / Data URL
```javascript
const dataUrl = await screenshot.base64('https://example.com', {
  format: 'png',
  dataUrl: true // Returns "data:image/png;base64,iVBORw0KGgo..."
});
```

---

## 🖥️ CLI Reference

You can use the built-in `link-to-screenshot` command line tool directly:

```bash
# Basic desktop screenshot
npx link-to-screenshot https://example.com -o example.png

# Full-page mobile screenshot in dark mode
npx link-to-screenshot https://example.com -o mobile.webp --mobile --full-page --dark-mode

# Hide selectors and block ads
npx link-to-screenshot https://example.com -o clean.png --hide "#cookies, .banner" --block-ads

# Render an HTML string
npx link-to-screenshot --html "<h1>Hello CLI</h1>" -o hello.png
```

### CLI Flags

| Flag | Description | Default |
| :--- | :--- | :--- |
| `-o, --output <path>` | Output image path (`.png`, `.jpg`, `.webp`, `.pdf`) | `screenshot.png` |
| `--full-page` | Capture full scrollable document | `false` |
| `--mobile [device]` | Emulate mobile device | `iPhone 13 Pro Max` |
| `--width <n>` | Viewport width in pixels | `1920` |
| `--height <n>` | Viewport height in pixels | `1080` |
| `--scale <n>` | Device scale factor (Retina display resolution) | `1` |
| `--dark-mode` | Emulate `prefers-color-scheme: dark` | `false` |
| `--delay <ms>` | Wait N milliseconds before capture | `0` |
| `--wait-for <sel>` | Wait for CSS selector to appear in DOM | `null` |
| `--click <sel>` | Click a CSS selector before capture | `null` |
| `--hide <selectors>` | Comma-separated CSS selectors to hide | `[]` |
| `--block-ads` | Block ad & tracking scripts | `false` |
| `--html <code>` | Render an HTML string directly | `null` |
| `--quiet` | Suppress progress logs | `false` |

---

## 📚 Library API Reference

### `screenshot(url, [options])`
Returns a `Promise<Buffer>` (or `Promise<{ buffer, title, url }>` if `returnDetails: true`).

### `screenshot.file(url, outputPath, [options])`
Captures screenshot and writes directly to disk. Returns `Promise<{ filePath, buffer, title, url }>`.

### `screenshot.base64(url, [options])`
Returns a Base64 string (or Data URL if `{ dataUrl: true }`).

### `screenshot.html(htmlString, [options])`
Captures an HTML string and returns a `Promise<Buffer>`.

### `screenshot.htmlToFile(htmlString, outputPath, [options])`
Captures an HTML string and saves it directly to disk.

### `screenshot.close()`
Gracefully shuts down any open Puppeteer browser managed by the library.

### `screenshot.getStatus()`
Returns `{ isConnected: boolean, screenshotCount: number, restartThreshold: number }`.

---

## 📄 License

MIT © Dipak