### `test-ts/` vs `test/`

Both `test-ts/` and `test/` contain TypeScript unit tests based on Mocha.

The original `test/` directory depends on Truffle. These tests are currently run using `yarn
test:truffle` (via `runTests.js`, which uses `truffle test`), and are slated to be deprecated with
the de-Trufflization effort.

`test-ts` currently contains some of the `test/` tests ported to not rely on Truffle. They can be
run via `yarn test:ts`, and use Mocha directly.

### Future

It is expected that once de-Trufflization is finalized that:

* `mocha` should be added to `package.json` (it's currently a dependency of `truffle`).
* This README can be deleted, as it only documents the interim confusion that may arise from the two
  testing directories existing side by side.
* `test-ts` may or may not be renamed to `test`.
