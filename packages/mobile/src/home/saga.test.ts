import { expectSaga } from 'redux-saga-test-plan'
import { call, put } from 'redux-saga/effects'
import { fetchGoldBalance } from 'src/goldToken/actions'
import { refreshAllBalances, setLoading } from 'src/home/actions'
import { refreshBalances, watchRefreshBalances, withLoading } from 'src/home/saga'
import { fetchDollarBalance } from 'src/stableToken/actions'
import { getConnectedAccount } from 'src/web3/saga'

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
    const p = expectSaga(watchRefreshBalances)
      .put(setLoading(true))
      .put(setLoading(false))
      .provide([[call(getConnectedAccount), true]])
      .put(fetchDollarBalance())
      .put(fetchGoldBalance())
      .dispatch(refreshAllBalances())
      .run()
    jest.runAllTimers()
    await p
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
