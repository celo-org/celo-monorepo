import { Event, State } from 'jest-circus'
import { makeRunResult } from 'jest-circus/build/utils'
import NodeEnvironment from 'jest-environment-node'
import { FlakeNotifier } from './FlakeNotifier'

export default class JestFlakeTrackingEnvironment extends NodeEnvironment {
  failures: Map<string, string[]> // Stores the errors thrown by flakey tests
  notifier: FlakeNotifier
  retryTimes: number

  constructor(config: any) {
    super(config)
    this.notifier = new FlakeNotifier()
    this.failures = new Map()
    this.retryTimes = config.retryTimes
  }

  async handleTestEvent(event: Event, state: State) {
    if (event.name === 'test_retry') {
      console.log('TEST RETRY: ' + event.test.name)
    }

    if (event.name === 'run_finish') {
      const runResult = makeRunResult(state.rootDescribeBlock, state.unhandledErrors)
      const flakes = runResult.testResults.filter(
        (testResult) => testResult.invocations > 1 && testResult.errors.length === 0
      )
      // Restore all the error messages from retrying the flakey test
      flakes.forEach((flake) => {
        const name = flake.testPath[0]
        if (this.failures.has(name)) {
          flake.errors.unshift(...this.failures.get(name))
        } else {
          // This shouldn't happen
          console.error('Flakey Test Errors Not Tracked')
        }
      })
      await this.notifier.processFlakes(flakes)
    }

    if (event.name === 'test_done') {
      if (event.test.errors.length > 1) {
        if (event.test.invocations < this.retryTimes) {
          // Test will be retried, save failure
          if (this.failures.has(event.test.name)) {
            this.failures.get(event.test.name).push(...event.test.errors)
          } else {
            this.failures.set(event.test.name, event.test.errors)
          }
        } else {
          // Test failed on every retry => not flakey
          this.failures.delete(event.test.name)
        }
      }
    }
  }
}
