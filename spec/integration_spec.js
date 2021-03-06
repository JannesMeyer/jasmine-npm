const child_process = require('child_process');

describe('Integration', function () {
  it('supports ES modules', async function () {
    let {exitCode, output} = await runJasmine('spec/fixtures/esm');
    expect(exitCode).toEqual(0);
    // Node < 14 outputs a warning when ES modules are used, e.g.:
    // (node:5258) ExperimentalWarning: The ESM module loader is experimental.
    // The position of this warning in the output varies. Sometimes it
    // occurs before the lines we're interested in but sometimes it's in
    // the middle of them.
    output = output.replace(/^.*ExperimentalWarning.*$\n/m, '');
    expect(output).toContain(
      'name_reporter\n' +
      'commonjs_helper\n' +
      'esm_helper\n' +
      'Started\n' +
      'Spec: A spec file ending in .js is required as a commonjs module\n' +
      '.Spec: A spec file ending in .mjs is imported as an es module\n'
    );
  });

  it('handles load-time exceptions from CommonJS specs properly', async function () {
    const {exitCode, output} = await runJasmine('spec/fixtures/cjs-load-exception');
    expect(exitCode).toEqual(1);
    expect(output).toContain('Error: nope');
    expect(output).toMatch(/at .*throws_on_load.js/);
  });

  it('handles load-time exceptions from ESM specs properly', async function () {
    const {exitCode, output} = await runJasmine('spec/fixtures/esm-load-exception');
    expect(exitCode).toEqual(1);
    expect(output).toContain('Error: nope');
    expect(output).toMatch(/at .*throws_on_load.mjs/);
  });

  it('handles syntax errors in CommonJS specs properly', async function () {
    const {exitCode, output} = await runJasmine('spec/fixtures/cjs-syntax-error');
    expect(exitCode).toEqual(1);
    expect(output).toContain('SyntaxError');
    expect(output).toContain('syntax_error.js');
  });

  it('handles syntax errors in ESM specs properly', async function () {
    const {exitCode, output} = await runJasmine('spec/fixtures/esm-syntax-error');
    expect(exitCode).toEqual(1);
    expect(output).toContain('SyntaxError');
    expect(output).toContain('syntax_error.mjs');
  });
});

async function runJasmine(cwd) {
  return new Promise(function(resolve) {
    const child = child_process.spawn(
      'node',
      ['--experimental-modules', '../../../bin/jasmine.js', '--config=jasmine.json'],
      {
        cwd,
        shell: false
      }
    );
    let output = '';
    child.stdout.on('data', function (data) {
      output += data;
    });
    child.stderr.on('data', function (data) {
      output += data;
    });
    child.on('close', function (exitCode) {
      resolve({exitCode, output});
    });
  });
}
