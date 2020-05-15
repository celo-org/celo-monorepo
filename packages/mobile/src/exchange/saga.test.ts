import BigNumber from 'bignumber.js'
import { expectSaga } from 'redux-saga-test-plan'
import { call } from 'redux-saga/effects'
import { setTobinTax } from 'src/exchange/actions'
import { doFetchTobinTax } from 'src/exchange/saga'
import { CURRENCY_ENUM } from 'src/geth/consts'
import { getConnectedAccount } from 'src/geth/saga'

const SELL_AMOUNT = 50 // in dollars/gold (not wei)

describe(doFetchTobinTax, () => {
  beforeAll(() => {
    jest.useRealTimers()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('if necessary, charges tobin tax when selling gold', async () => {
    const tobinTaxAction = {
      makerToken: CURRENCY_ENUM.GOLD,
      makerAmount: new BigNumber(SELL_AMOUNT),
    }
    await expectSaga(doFetchTobinTax, tobinTaxAction)
      .provide([[call(getConnectedAccount), true]])
      .put(setTobinTax('0.25')) // 50 * 0.005
      .run()
  })

  it('never charges tobin tax when buying gold', async () => {
    const tobinTaxAction = {
      makerToken: CURRENCY_ENUM.DOLLAR,
      makerAmount: new BigNumber(SELL_AMOUNT),
    }
    await expectSaga(doFetchTobinTax, tobinTaxAction)
      .put(setTobinTax('0'))
      .run()
  })
})
