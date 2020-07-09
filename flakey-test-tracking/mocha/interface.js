const { Test } = require('mocha')
const commonInterface = require('mocha/lib/interfaces/common')
const { saveError } = require('../cache')
const { getTestIDFromSuite } = require('./utils')

/**
 * This interface is adapted from the original bdd interface (default for Mocha),
 * it differs from the original only in that the `it` function is modified to store
 * errors in tmp cache before returning. This change is necessary for flake-tracking
 * because Mocha v5.2.0 (currently used by Truffle) does not emit an event when tests
 * are retried, thereby hiding errors generated during flakey test runs. This solution
 * can be replaced by adding a simple `runner.on('retry', ...)` hook to the reporter
 * once truffle is updated to use Mocha >= v6.0.0.
 *
 * BDD-style interface:
 *
 *      describe('Array', function() {
 *        describe('#indexOf()', function() {
 *          it('should return -1 when not present', function() {
 *            // ...
 *          });
 *
 *          it('should return the index when present', function() {
 *            // ...
 *          });
 *        });
 *      });
 *
 * @param {Suite} suite Root suite.
 */
module.exports = function errTrackingBDDInterface(suite) {
  var suites = [suite]
  suite.on('pre-require', function(context, file, mocha) {
    var common = commonInterface(suites, context, mocha)
    context.before = common.before
    context.after = common.after
    context.beforeEach = common.beforeEach
    context.afterEach = common.afterEach
    context.run = mocha.options.delay && common.runWithSuite(suite)
    /**
     * Describe a "suite" with the given `title`
     * and callback `fn` containing nested suites
     * and/or tests.
     */
    context.describe = context.context = function(title, fn) {
      return common.suite.create({
        title: title,
        file: file,
        fn: fn,
      })
    }
    /**
     * Pending describe.
     */
    context.xdescribe = context.xcontext = context.describe.skip = function(title, fn) {
      return common.suite.skip({
        title: title,
        file: file,
        fn: fn,
      })
    }
    /**
     * Exclusive suite.
     */
    context.describe.only = function(title, fn) {
      return common.suite.only({
        title: title,
        file: file,
        fn: fn,
      })
    }
    /**
     * The following block is the only custom part of this interface.
     *
     * Describe a specification or test-case
     * with the given `title` and callback `fn`
     * acting as a thunk.
     */
    context.it = context.specify = function(title, fn) {
      var suite = suites[0]
      if (suite.isPending()) {
        fn = null
      }

      var test
      if (fn instanceof Function) {
        test = new Test(title, async function() {
          try {
            await fn()
          } catch (err) {
            saveError(getTestIDFromSuite(suite, title), JSON.stringify(err))
            throw err
          }
        })
      } else {
        test = new Test(title, fn)
      }

      test.file = file
      suite.addTest(test)
      return test
    }
    /**
     * Exclusive test-case.
     */
    context.it.only = function(title, fn) {
      return common.test.only(mocha, context.it(title, fn))
    }
    /**
     * Pending test case.
     */
    context.xit = context.xspecify = context.it.skip = function(title) {
      return context.it(title)
    }
    /**
     * Number of attempts to retry.
     */
    context.it.retries = function(n) {
      context.retries(n)
    }
  })
}
