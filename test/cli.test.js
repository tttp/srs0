import test from 'ava';
import { spawn } from 'child_process';

function runCli(args, env = {}) {
    return new Promise((resolve, reject) => {
        const testEnv = { ...process.env };
        delete testEnv.SRS_KEY;
        delete testEnv.SRS_PREFIX;
        delete testEnv.SRS_DOMAIN;

        const cli = spawn('node', ['cli.js', ...args], { env: { ...testEnv, ...env } });
        let stdout = '';
        let stderr = '';

        cli.stdout.on('data', data => {
            stdout += data.toString();
        });

        cli.stderr.on('data', data => {
            stderr += data.toString();
        });

        cli.on('close', code => {
            if (code === 0) {
                resolve({ stdout, stderr });
            } else {
                const err = new Error(`CLI exited with code ${code}`);
                err.stdout = stdout;
                err.stderr = stderr;
                reject(err);
            }
        });
    });
}

test('CLI shows help message', async t => {
    const { stdout } = await runCli(['--help']);
    t.true(stdout.includes('Usage: node srs-cli.js [options] <email>'));
});

test('CLI errors without SRS key', async t => {
    const error = await t.throwsAsync(runCli(['user@example.com']));
    t.true(error.stderr.includes('Error: SRS key is required.'));
});

test('CLI errors without email', async t => {
    const error = await t.throwsAsync(runCli(['-k', 'my-secret-key']));
    t.true(error.stderr.includes('Error: Email address is required.'));
});

test('CLI encodes with command-line key', async t => {
    const { stdout } = await runCli(['-k', 'my-secret-key', 'user@example.com']);
    t.true(stdout.startsWith('SRS0='));
});

test('CLI encodes with env key', async t => {
    const { stdout } = await runCli(['user@example.com'], { SRS_KEY: 'my-secret-key' });
    t.true(stdout.startsWith('SRS0='));
});

test('CLI decodes an SRS address', async t => {
    const { stdout: srsAddress } = await runCli(['-k', 'my-secret-key', 'user@example.com', '-d', '2025-07-29']);
    const { stdout: decoded } = await runCli(['-k', 'my-secret-key', srsAddress.trim()]);
    t.true(decoded.includes('user@example.com'));
});