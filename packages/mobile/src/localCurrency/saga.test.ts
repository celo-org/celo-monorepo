import { expectSaga } from 'redux-saga-test-plan'
import * as matchers from 'redux-saga-test-plan/matchers'
import { throwError } from 'redux-saga-test-plan/providers'
import {
  fetchCurrentRate,
  fetchCurrentRateFailure,
  fetchCurrentRateSuccess,
} from 'src/localCurrency/actions'
import { fetchExchangeRate, watchFetchCurrentRate } from 'src/localCurrency/saga'

const now = Date.now()
Date.now = jest.fn(() => now)

describe(watchFetchCurrentRate, () => {
  beforeAll(() => {
    jest.useRealTimers()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('fetches the local currency rate and dispatches the success action', async () => {
    await expectSaga(watchFetchCurrentRate)
      .provide([[matchers.call.fn(fetchExchangeRate), 1.33]])
      .put(fetchCurrentRateSuccess(1.33, now))
      .dispatch(fetchCurrentRate())
      .run()
  })

  it('fetches the local currency rate and dispatches the failure action when it fails', async () => {
    await expectSaga(watchFetchCurrentRate)
      .provide([[matchers.call.fn(fetchExchangeRate), throwError(new Error('test error'))]])
      .put(fetchCurrentRateFailure())
      .dispatch(fetchCurrentRate())
      .run()
  })

  // it("updates the local currency rate when it hasn't been fetched recently", async () => {
  //   const state = createMockStore({}).getState()

  //   await expectSaga(updateLocalCurrencyRate)
  //     .provide([[call(waitForRehydrate), null], [matchers.call.fn(fetchExchangeRate), 1.33]])
  //     .withReducer(rootReducer)
  //     .withState(state)
  //     .put(fetchCurrentRate())
  //     .put(fetchCurrentRateSuccess(1.33, now))
  //     .run()
  // })

  // it('does not update the local currency rate when it has been fetched recently', async () => {
  //   const state = createMockStore({ localCurrency: { lastSuccessfulUpdate: now } }).getState()

  //   await expectSaga(updateLocalCurrencyRate)
  //     .provide([[call(waitForRehydrate), null]])
  //     .withReducer(rootReducer)
  //     .withState(state)
  //     .not.call.fn(fetchExchangeRate)
  //     .run()
  // })

  // it('retries when fetch fails', async () => {
  //   const error = new Error('test error')
  //   const state = createMockStore({}).getState()

  //   let delayCallCount = 0
  //   // Workaround redux-saga-test-plan not supporting the new `yield delay(x)` syntax
  //   // @ts-ignore
  //   const provideDelayOnce = ({ fn }, next) => {
  //     if (fn.name === 'delayP' && delayCallCount < 1) {
  //       delayCallCount += 1
  //       return null
  //     }
  //     return next()
  //   }

  //   await expectSaga(updateLocalCurrencyRate)
  //     .provide([
  //       [call(waitForRehydrate), null],
  //       [matchers.call.fn(fetchExchangeRate), throwError(error)],
  //       { call: provideDelayOnce },
  //     ])
  //     .withReducer(rootReducer)
  //     .withState(state)
  //     .put(fetchCurrentRate())
  //     .put(fetchCurrentRateFailure())
  //     .put(fetchCurrentRate())
  //     .run()

  //   expect(delayCallCount).toEqual(1)
  // })
})
