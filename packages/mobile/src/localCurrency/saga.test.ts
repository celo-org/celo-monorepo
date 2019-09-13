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
})
