import { expectSaga } from 'redux-saga-test-plan'
import * as matchers from 'redux-saga-test-plan/matchers'
import { throwError } from 'redux-saga-test-plan/providers'
import { call } from 'redux-saga/effects'
import { waitForRehydrate } from 'src/app/saga'
import {
  fetchCurrentRateFailure,
  fetchCurrentRateStart,
  fetchCurrentRateSuccess,
} from 'src/localCurrency/actions'
import { fetchExchangeRate, updateLocalCurrencyRate } from 'src/localCurrency/saga'
import rootReducer from 'src/redux/reducers'
import { createMockStore } from 'test/utils'

const now = Date.now()
Date.now = jest.fn(() => now)

describe(updateLocalCurrencyRate, () => {
  beforeAll(() => {
    jest.useRealTimers()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it("updates the local currency rate when it hasn't been fetched recently", async () => {
    const state = createMockStore({}).getState()

    await expectSaga(updateLocalCurrencyRate)
      .provide([[call(waitForRehydrate), null], [matchers.call.fn(fetchExchangeRate), 1.33]])
      .withReducer(rootReducer)
      .withState(state)
      .put(fetchCurrentRateStart())
      .put(fetchCurrentRateSuccess(1.33, now))
      .run()
  })

  it('does not update the local currency rate when it has been fetched recently', async () => {
    const state = createMockStore({ localCurrency: { lastSuccessfulUpdate: now } }).getState()

    await expectSaga(updateLocalCurrencyRate)
      .provide([[call(waitForRehydrate), null]])
      .withReducer(rootReducer)
      .withState(state)
      .not.call.fn(fetchExchangeRate)
      .run()
  })

  it('retries when fetch fails', async () => {
    const error = new Error('test error')
    const state = createMockStore({}).getState()

    let delayCallCount = 0
    // Workaround redux-saga-test-plan not supporting the new `yield delay(x)` syntax
    // @ts-ignore
    const provideDelayOnce = ({ fn }, next) => {
      if (fn.name === 'delayP' && delayCallCount < 1) {
        delayCallCount += 1
        return null
      }
      return next()
    }

    await expectSaga(updateLocalCurrencyRate)
      .provide([
        [call(waitForRehydrate), null],
        [matchers.call.fn(fetchExchangeRate), throwError(error)],
        { call: provideDelayOnce },
      ])
      .withReducer(rootReducer)
      .withState(state)
      .put(fetchCurrentRateStart())
      .put(fetchCurrentRateFailure())
      .put(fetchCurrentRateStart())
      .run()

    expect(delayCallCount).toEqual(1)
  })
})
