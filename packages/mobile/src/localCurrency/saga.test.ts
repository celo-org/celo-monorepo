import { expectSaga } from 'redux-saga-test-plan'
import * as matchers from 'redux-saga-test-plan/matchers'
import { throwError } from 'redux-saga-test-plan/providers'
import { select } from 'redux-saga/effects'
import {
  fetchCurrentRate,
  fetchCurrentRateFailure,
  fetchCurrentRateSuccess,
  selectPreferredCurrency,
} from 'src/localCurrency/actions'
import { LocalCurrencyCode } from 'src/localCurrency/consts'
import {
  fetchExchangeRate,
  watchFetchCurrentRate,
  watchSelectPreferredCurrency,
} from 'src/localCurrency/saga'
import { getLocalCurrencyCode } from 'src/localCurrency/selectors'

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
      .provide([
        [select(getLocalCurrencyCode), LocalCurrencyCode.MXN],
        [matchers.call.fn(fetchExchangeRate), 1.33],
      ])
      .put(fetchCurrentRateSuccess(LocalCurrencyCode.MXN, 1.33, now))
      .dispatch(fetchCurrentRate())
      .run()
  })

  it('fetches the local currency rate and dispatches the failure action when it fails', async () => {
    await expectSaga(watchFetchCurrentRate)
      .provide([
        [select(getLocalCurrencyCode), LocalCurrencyCode.MXN],
        [matchers.call.fn(fetchExchangeRate), throwError(new Error('test error'))],
      ])
      .put(fetchCurrentRateFailure())
      .dispatch(fetchCurrentRate())
      .run()
  })
})

describe(watchSelectPreferredCurrency, () => {
  beforeAll(() => {
    jest.useRealTimers()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('fetches the local currency rate when the preferred currency changes', async () => {
    await expectSaga(watchSelectPreferredCurrency)
      .put(fetchCurrentRate())
      .dispatch(selectPreferredCurrency(LocalCurrencyCode.MXN))
      .run()
  })
})
