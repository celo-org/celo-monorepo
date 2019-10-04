import { expectSaga } from 'redux-saga-test-plan'
import { withTimeout } from 'src/redux/sagas-helpers'
import { sleep } from 'test/utils'

jest.mock('src/web3/contracts', () => ({
  isZeroSyncMode: jest.fn().mockReturnValueOnce(false),
}))

describe('withTimeout Saga', () => {
  test('returns the fn results if no timeout', () =>
    expectSaga(withTimeout(50000, async () => ({ hello: 'world' })))
      .returns({ hello: 'world' })
      .run())

  test('returns undefined when times out', async () => {
    const pro = expectSaga(withTimeout(10, () => sleep(100)))
      .returns(undefined)
      .run()
    jest.runAllTimers()
    await pro
  })
})
