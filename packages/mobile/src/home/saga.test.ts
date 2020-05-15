import { expectSaga } from 'redux-saga-test-plan'
import { call, put, select } from 'redux-saga/effects'
import { getConnectedAccount } from 'src/geth/saga'
import { fetchGoldBalance } from 'src/goldToken/actions'
import { refreshAllBalances, setLoading } from 'src/home/actions'
import { autoRefreshSaga, refreshBalances, watchRefreshBalances, withLoading } from 'src/home/saga'
import { fetchCurrentRate } from 'src/localCurrency/actions'
import { shouldFetchCurrentRate } from 'src/localCurrency/selectors'
import { shouldUpdateBalance } from 'src/redux/selectors'
import { fetchDollarBalance } from 'src/stableToken/actions'

jest.useRealTimers()

describe('refreshBalances', () => {
  test('ask for balance when geth and account are ready', () =>
    expectSaga(refreshBalances)
      .provide([[call(getConnectedAccount), true]])
      .put(fetchDollarBalance())
      .put(fetchGoldBalance())
      .run())
})

describe('watchRefreshBalances', () => {
  test('reacts on REFRESH_BALANCES', async () => {
    await expectSaga(watchRefreshBalances)
      .put(setLoading(true))
      .put(setLoading(false))
      .provide([[call(getConnectedAccount), true]])
      .put(fetchDollarBalance())
      .put(fetchGoldBalance())
      .dispatch(refreshAllBalances())
      .run()
  })
})

describe('withLoading Saga', () => {
  test('sets Loading on/off while calling fn', async () => {
    const fn = () => true
    const res = await expectSaga(withLoading(fn)).run()

    expect(res.allEffects).toEqual([put(setLoading(true)), call(fn), put(setLoading(false))])
  })

  test('returns the fn results', () =>
    expectSaga(withLoading(async () => ({ hello: 'world' })))
      .returns({ hello: 'world' })
      .run())

  test('sets Loading off on fn Error', async () => {
    await expect(
      expectSaga(
        withLoading(() => {
          throw new Error()
        })
      )
        .put(setLoading(false))
        .run()
    ).rejects.toEqual(expect.any(Error))
  })
})

describe('autoRefreshSaga', () => {
  it('dispatches the appropriate actions', async () => {
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

    await expectSaga(autoRefreshSaga)
      .provide([
        [select(shouldUpdateBalance), true],
        [select(shouldFetchCurrentRate), true],
        { call: provideDelayOnce },
      ])
      .put(refreshAllBalances())
      .put(fetchCurrentRate())
      .run()
  })
})
