const fs = require('fs').promises;
const path = require('path');
const screenshot = require('../src/index');
const {
  validateAndNormalizeUrl,
  detectFormatFromPath,
  generateHideCss
} = require('../src/utils');

const TEST_OUT_DIR = path.join(__dirname, '../test_output');

beforeAll(async () => {
  await fs.mkdir(TEST_OUT_DIR, { recursive: true });
});

afterAll(async () => {
  await screenshot.close();
  await fs.rm(TEST_OUT_DIR, { recursive: true, force: true }).catch(() => {});
});

describe('utils module', () => {
  test('validateAndNormalizeUrl should prepend https:// if missing', () => {
    expect(validateAndNormalizeUrl('example.com')).toBe('https://example.com/');
    expect(validateAndNormalizeUrl('http://example.org')).toBe('http://example.org/');
  });

  test('validateAndNormalizeUrl should throw on invalid URLs', () => {
    expect(() => validateAndNormalizeUrl('')).toThrow();
    expect(() => validateAndNormalizeUrl('ftp://example.com')).toThrow();
  });

  test('detectFormatFromPath should detect correct format', () => {
    expect(detectFormatFromPath('image.png')).toBe('png');
    expect(detectFormatFromPath('image.jpg')).toBe('jpeg');
    expect(detectFormatFromPath('image.webp')).toBe('webp');
    expect(detectFormatFromPath('document.pdf')).toBe('pdf');
    expect(detectFormatFromPath('unknown.ext', 'png')).toBe('png');
  });

  test('generateHideCss should format css rules', () => {
    expect(generateHideCss('.cookie-banner')).toContain('.cookie-banner');
    expect(generateHideCss(['#ad', '.modal'])).toContain('#ad, .modal');
  });
});

describe('screenshot library API', () => {
  test('screenshot.html should capture HTML string as PNG Buffer', async () => {
    const html = '<h1 style="color:red;">Hello Jest</h1>';
    const buffer = await screenshot.html(html, { width: 800, height: 600 });
    expect(Buffer.isBuffer(buffer)).toBe(true);
    // PNG signature check (8 bytes)
    const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    expect(buffer.subarray(0, 8).equals(pngSignature)).toBe(true);
  }, 30000);

  test('screenshot.htmlToFile should save screenshot to disk', async () => {
    const html = '<div id="box">Save To File Test</div>';
    const filePath = path.join(TEST_OUT_DIR, 'test-output.png');
    const result = await screenshot.htmlToFile(html, filePath);

    expect(result.filePath).toBe(filePath);
    expect(Buffer.isBuffer(result.buffer)).toBe(true);

    const stat = await fs.stat(filePath);
    expect(stat.size).toBeGreaterThan(0);
  }, 30000);

  test('screenshot.base64 should return base64 data URL', async () => {
    const html = '<p>Base64 Test</p>';
    const dataUrl = await screenshot.base64({
      html,
      dataUrl: true
    });
    expect(typeof dataUrl).toBe('string');
    expect(dataUrl.startsWith('data:image/png;base64,')).toBe(true);
  }, 30000);

  test('getStatus should report browser connection status', () => {
    const status = screenshot.getStatus();
    expect(typeof status.isConnected).toBe('boolean');
    expect(typeof status.screenshotCount).toBe('number');
  });

  test('screenshot.close should cleanly terminate browser', async () => {
    await screenshot.close();
    const status = screenshot.getStatus();
    expect(status.isConnected).toBe(false);
  });
});
