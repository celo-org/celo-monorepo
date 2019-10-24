import { CURRENCY_ENUM } from '@celo/utils/src/currencies'
import BigNumber from 'bignumber.js'
import { expectSaga } from 'redux-saga-test-plan'
import { call } from 'redux-saga/effects'
import { waitWeb3LastBlock } from 'src/networkInfo/saga'
import { fetchDollarBalance, setBalance, transferStableToken } from 'src/stableToken/actions'
import { stableTokenFetch, stableTokenTransfer } from 'src/stableToken/saga'
import { addStandbyTransaction, removeStandbyTransaction } from 'src/transactions/actions'
import { TransactionStatus, TransactionTypes } from 'src/transactions/reducer'
import {
  createMockContract,
  createMockStore,
  mockContractKitBalance,
  mockContractKitContract,
} from 'test/utils'
import { mockAccount } from 'test/values'

const now = Date.now()
Date.now = jest.fn(() => now)

const BALANCE = '45'
const BALANCE_IN_WEI = '450000000000'
const TX_ID = '1234'
const COMMENT = 'a comment'

jest.mock('@celo/walletkit', () => ({
  getStableTokenContract: jest.fn(async () =>
    createMockContract({ decimals: () => '10', transferWithComment: () => true })
  ),
  getErc20Balance: jest.fn(() => BALANCE),
}))

jest.mock('src/web3/contracts', () => ({
  contractKit: {
    contracts: {
      getStableToken: () => mockContractKitContract,
    },
  },
}))

jest.mock('src/web3/actions', () => ({
  ...jest.requireActual('src/web3/actions'),
  unlockAccount: jest.fn(async () => true),
}))

const { unlockAccount } = require('src/web3/actions')

const state = createMockStore().getState()

const TRANSFER_ACTION = transferStableToken({
  recipientAddress: mockAccount,
  amount: BALANCE,
  txId: TX_ID,
  comment: COMMENT,
})

describe('stableToken saga', () => {
  jest.useRealTimers()

  it('should fetch the balance and put the new balance', async () => {
    mockContractKitBalance.mockReturnValueOnce(new BigNumber(BALANCE_IN_WEI))

    await expectSaga(stableTokenFetch)
      .provide([[call(waitWeb3LastBlock), true]])
      .withState(state)
      .dispatch(fetchDollarBalance())
      .put(setBalance(BALANCE))
      .run()
  })

  it('should add a standby transaction and dispatch a sendAndMonitorTransaction', async () => {
    await expectSaga(stableTokenTransfer)
      .provide([[call(waitWeb3LastBlock), true]])
      .withState(state)
      .dispatch(TRANSFER_ACTION)
      .put(
        addStandbyTransaction({
          id: TX_ID,
          type: TransactionTypes.SENT,
          comment: COMMENT,
          status: TransactionStatus.Pending,
          value: BALANCE,
          symbol: CURRENCY_ENUM.DOLLAR,
          timestamp: Math.floor(Date.now() / 1000),
          address: mockAccount,
        })
      )
      .run()
  })

  it('should add a standby transaction', async () => {
    await expectSaga(stableTokenTransfer)
      .provide([[call(waitWeb3LastBlock), true]])
      .withState(state)
      .dispatch(TRANSFER_ACTION)
      .put(
        addStandbyTransaction({
          id: TX_ID,
          type: TransactionTypes.SENT,
          comment: COMMENT,
          status: TransactionStatus.Pending,
          value: BALANCE,
          symbol: CURRENCY_ENUM.DOLLAR,
          timestamp: Math.floor(Date.now() / 1000),
          address: mockAccount,
        })
      )
      .run()
  })

  it('should remove standby transaction when pin unlock fails', async () => {
    unlockAccount.mockImplementationOnce(async () => false)

    await expectSaga(stableTokenTransfer)
      .provide([[call(waitWeb3LastBlock), true]])
      .withState(state)
      .dispatch(TRANSFER_ACTION)
      .put(removeStandbyTransaction(TX_ID))
      .run()
  })
})
