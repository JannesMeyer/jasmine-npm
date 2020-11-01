const Loader = require('../lib/loader');

describe('loader', function() {
  afterEach(function() {
    delete global.require_tester_was_loaded;
  });

  describe('#load', function() {
    describe('When the path ends in .mjs', function () {
      it('loads the file as an es module', async function () {
        const requireShim = jasmine.createSpy('requireShim')
          .and.callFake(requireESM);
        const importShim = jasmine.createSpy('importShim')
          .and.returnValue(Promise.resolve());
        const loader = new Loader({requireShim, importShim});

        await expectAsync(loader.load('./foo/bar/baz.mjs')).toBeResolved();

        expect(requireShim).toHaveBeenCalledWith('./foo/bar/baz.mjs');
        expect(importShim).toHaveBeenCalledWith('file://./foo/bar/baz.mjs');
      });

      it("adds the filename to errors that don't include it", async function() {
        const requireShim = jasmine.createSpy('requireShim')
          .and.callFake(requireESM);
        const underlyingError = new SyntaxError('some details but no filename, not even in the stack trace');
        const importShim = () => Promise.reject(underlyingError);
        const loader = new Loader({requireShim, importShim});

        await expectAsync(loader.load('foo.mjs')).toBeRejectedWithError(
          "While loading foo.mjs: SyntaxError: some details but no filename, not even in the stack trace"
        );
      });

      it('propagates errors that already contain the filename without modifying them', async function () {
        const requireShim = jasmine.createSpy('requireShim')
          .and.callFake(requireESM);
        const underlyingError = new Error('nope');
        underlyingError.stack = underlyingError.stack.replace('loader_spec.js', 'foo.mjs');
        const importShim = jasmine.createSpy('importShim')
          .and.callFake(() => Promise.reject(underlyingError));
        const loader = new Loader({requireShim, importShim});

        await expectAsync(loader.load('foo.mjs')).toBeRejectedWith(underlyingError);
      });

      function requireESM() {
        const e = new Error('[ERR_REQUIRE_ESM]: Must use import to load ES Module');
        e.code = 'ERR_REQUIRE_ESM';
        throw e;
      }
    });

    describe('When the path does not end in .mjs', function () {
      it('loads the file as a commonjs module', async function () {
        const requireShim = jasmine.createSpy('requireShim')
          .and.returnValue(Promise.resolve());
        const importShim = jasmine.createSpy('importShim');
        const loader = new Loader({requireShim, importShim});

        await expectAsync(loader.load('./foo/bar/baz')).toBeResolved();

        expect(requireShim).toHaveBeenCalledWith('./foo/bar/baz');
        expect(importShim).not.toHaveBeenCalled();
      });

      it('propagates the error when import fails', async function () {
        const underlyingError = new Error('nope');
        const requireShim = jasmine.createSpy('requireShim')
          .and.throwError(underlyingError);
        const importShim = jasmine.createSpy('importShim');
        const loader = new Loader({requireShim, importShim});

        await expectAsync(loader.load('foo')).toBeRejectedWith(underlyingError);
      });
    });
  });
});
