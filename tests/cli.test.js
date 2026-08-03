const { execFile } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const util = require('util');
const execFileAsync = util.promisify(execFile);

const CLI_PATH = path.join(__dirname, '../bin/cli.js');
const TEST_OUT_DIR = path.join(__dirname, '../test_output_cli');

beforeAll(async () => {
  await fs.mkdir(TEST_OUT_DIR, { recursive: true });
});

afterAll(async () => {
  await fs.rm(TEST_OUT_DIR, { recursive: true, force: true }).catch(() => {});
});

describe('CLI executable', () => {
  test('should print version with -v flag', async () => {
    const { stdout } = await execFileAsync(process.execPath, [CLI_PATH, '-v']);
    expect(stdout.trim()).toBe('2.0.1');
  });

  test('should print help screen with --help flag', async () => {
    const { stdout } = await execFileAsync(process.execPath, [CLI_PATH, '--help']);
    expect(stdout).toContain('link-to-screenshot');
    expect(stdout).toContain('USAGE:');
    expect(stdout).toContain('OPTIONS:');
  });

  test('should capture screenshot from --html string to file', async () => {
    const outFile = path.join(TEST_OUT_DIR, 'cli-test.png');
    const { stdout } = await execFileAsync(process.execPath, [
      CLI_PATH,
      '--html',
      '<h2>CLI Rendering Test</h2>',
      '-o',
      outFile,
      '--quiet'
    ]);

    const stat = await fs.stat(outFile);
    expect(stat.size).toBeGreaterThan(0);
  }, 30000);
});
