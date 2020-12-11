import BigNumber from 'bignumber.js'
import { expectSaga } from 'redux-saga-test-plan'
import * as matchers from 'redux-saga-test-plan/matchers'
import { call, select } from 'redux-saga/effects'
import { showError } from 'src/alert/actions'
import { TokenTransactionType } from 'src/apollo/types'
import { ErrorMessages } from 'src/app/ErrorMessages'
import {
  Actions,
  ExchangeTokensAction,
  setTobinTax,
  WithdrawCeloAction,
  withdrawCeloCanceled,
} from 'src/exchange/actions'
import { exchangeRatePairSelector } from 'src/exchange/reducer'
import { doFetchTobinTax, exchangeGoldAndStableTokens, withdrawCelo } from 'src/exchange/saga'
import { CURRENCY_ENUM } from 'src/geth/consts'
import { sendAndMonitorTransaction } from 'src/transactions/saga'
import { sendTransaction } from 'src/transactions/send'
import {
  getConnectedAccount,
  getConnectedUnlockedAccount,
  unlockAccount,
  UnlockResult,
} from 'src/web3/saga'

const SELL_AMOUNT = 50 // in dollars/gold (not wei)
const account = '0x22c8a9178841ba95a944afd1a1faae517d3f5daa'

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

describe(exchangeGoldAndStableTokens, () => {
  it('makes the exchange', async () => {
    const exchangeGoldAndStableTokensAction: ExchangeTokensAction = {
      type: Actions.EXCHANGE_TOKENS,
      makerToken: CURRENCY_ENUM.GOLD,
      makerAmount: new BigNumber(SELL_AMOUNT),
    }
    await expectSaga(exchangeGoldAndStableTokens, exchangeGoldAndStableTokensAction)
      .provide([
        [call(getConnectedUnlockedAccount), account],
        [
          select(exchangeRatePairSelector),
          {
            goldMaker: '2',
            dollarMaker: '0.5',
          },
        ],
        [matchers.call.fn(sendTransaction), true],
        [matchers.call.fn(sendAndMonitorTransaction), true],
      ])
      .put.like({
        action: {
          transaction: {
            type: TokenTransactionType.Exchange,
            inSymbol: CURRENCY_ENUM.GOLD,
            inValue: SELL_AMOUNT.toString(),
            outSymbol: CURRENCY_ENUM.DOLLAR,
            outValue: (SELL_AMOUNT / 2).toString(),
          },
        },
      })
      .call.like({
        fn: sendTransaction,
        args: [{}, account, {}, undefined, undefined, CURRENCY_ENUM.GOLD],
      })
      .call.like({
        fn: sendAndMonitorTransaction,
        args: [undefined, account, {}, undefined, CURRENCY_ENUM.GOLD],
      })
      .run()
  })

  it('fails if user cancels PIN input', async () => {
    const exchangeGoldAndStableTokensAction: ExchangeTokensAction = {
      type: Actions.EXCHANGE_TOKENS,
      makerToken: CURRENCY_ENUM.GOLD,
      makerAmount: new BigNumber(SELL_AMOUNT),
    }
    await expectSaga(exchangeGoldAndStableTokens, exchangeGoldAndStableTokensAction)
      .provide([
        [call(getConnectedAccount), account],
        [matchers.call.fn(unlockAccount), UnlockResult.CANCELED],
      ])
      .put(showError(ErrorMessages.PIN_INPUT_CANCELED))
      .run()
  })
})

describe(withdrawCelo, () => {
  it('fails if user cancels PIN input', async () => {
    const mockAddress = '0x1234'
    const withdrawCeloAction: WithdrawCeloAction = {
      type: Actions.WITHDRAW_CELO,
      amount: new BigNumber(10),
      recipientAddress: mockAddress,
      isCashOut: false,
    }
    await expectSaga(withdrawCelo, withdrawCeloAction)
      .provide([
        [call(getConnectedAccount), account],
        [matchers.call.fn(unlockAccount), UnlockResult.CANCELED],
      ])
      .put(withdrawCeloCanceled())
      .run()
  })
})
