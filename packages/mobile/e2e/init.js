const detox = require('detox')
const config = require('../package.json').detox
//const adapter = require('detox/runners/jest/adapter')
//const specReporter = require('detox/runners/jest/specReporter')
//const assignReporter = require('detox/runners/jest/assignReporter')
const { timeout, TimeoutError } = require('./utils')

//jasmine.getEnv().addReporter(adapter)
// This takes care of generating status logs on a per-spec basis. By default, jest only reports at file-level.
// This is strictly optional.
//jasmine.getEnv().addReporter(specReporter)

// "detox/runners/jest/adapter",
// "detox/runners/jest/specReporter",
// "detox/runners/jest/assignReporter"

// This will post which device has assigned to run a suite, which can be useful in a multiple-worker tests run.
// This is strictly optional.
//jasmine.getEnv().addReporter(assignReporter)

// Increase default jest timeout
//jest.setTimeout(120000)

const INIT_TIMEOUT = 300000

//TODO(Alec): Should this be deleted?

beforeAll(
  async () => {
    // Using our own timeout here as the default implementation simply swallows the error
    // and moves on executing the test suite which of course fails with confusing error messages,
    // hiding the root issue
    // See https://github.com/facebook/jest/issues/8688
    try {
      await timeout(async () => {
        await detox.init(config, { launchApp: false })
        await device.launchApp({
          newInstance: true,
          // Useful for debugging sync issues on iOS, see https://github.com/wix/Detox/blob/master/docs/Troubleshooting.Synchronization.md
          // launchArgs: { detoxPrintBusyIdleResources: 'YES' },
        })
      }, INIT_TIMEOUT)
    } catch (e) {
      // tslint:disable-next-line: no-console
      console.error('Oh nooo... Detox init failed 😭', e)

      if (e instanceof TimeoutError) {
        // tslint:disable-next-line: no-console
        console.error(
          'This is a timeout error, please ensure the following:\n' +
            '- The app was able to install and start\n' +
            "- Verify there's not a synchronization issue:\n" +
            'Check https://github.com/wix/Detox/blob/master/docs/Troubleshooting.Synchronization.md\n' +
            'and make sure there are no running animations or short timers (< 1.5secs) preventing Detox from detecting an idle state.\n' +
            "Note: 'setTimeout', 'setInterval', 'requestAnimationFrame', end up using the JSTimer module\n" +
            'and are tracked by Detox, so check they are not called in a loop somewhere.\n'
        )
      }
      // Detox init failed, there's no point going further
      process.exit(1)
    }
  },
  // timeout for beforeAll, slightly longer so our internal timeout can complete
  INIT_TIMEOUT + 5000
)

// beforeEach(async () => {
//   //await adapter.beforeEach()
// })

// afterAll(async () => {
//   //await adapter.afterAll()
//   await detox.cleanup()
// })
