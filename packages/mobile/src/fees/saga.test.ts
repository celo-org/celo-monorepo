import BigNumber from 'bignumber.js'
import { expectSaga } from 'redux-saga-test-plan'
import * as matchers from 'redux-saga-test-plan/matchers'
import { call } from 'redux-saga/effects'
import { getReclaimEscrowGas } from 'src/escrow/saga'
import { feeEstimated, FeeType } from 'src/fees/actions'
import { estimateFeeSaga } from 'src/fees/saga'
import { getInvitationVerificationFeeInWei, getInviteTxGas } from 'src/invite/saga'
import { getSendTxGas } from 'src/send/saga'
import { getConnectedAccount } from 'src/web3/saga'
import { mockAccount } from 'test/values'

const GAS_AMOUNT = 500000

jest.mock('@celo/walletkit', () => ({
  ContractUtils: {
    getGasPrice: jest.fn(() => 10000),
  },
}))

jest.mock('src/web3/contracts', () => ({
  web3: {
    utils: {
      fromWei: jest.fn((x: any) => x / 1e18),
      toWei: jest.fn((x: any) => x * 1e18),
    },
  },
  isZeroSyncMode: jest.fn().mockReturnValueOnce(false),
}))

describe(estimateFeeSaga, () => {
  beforeAll(() => {
    jest.useRealTimers()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('updates the default invite fee', async () => {
    await expectSaga(estimateFeeSaga, { feeType: FeeType.INVITE })
      .provide([
        [call(getConnectedAccount), mockAccount],
        [matchers.call.fn(getInviteTxGas), new BigNumber(GAS_AMOUNT)],
      ])
      .put(
        feeEstimated(
          FeeType.INVITE,
          new BigNumber(10000)
            .times(GAS_AMOUNT)
            .plus(getInvitationVerificationFeeInWei())
            .toString()
        )
      )
      .run()
  })

  it('updates the default send fee', async () => {
    await expectSaga(estimateFeeSaga, { feeType: FeeType.SEND })
      .provide([
        [call(getConnectedAccount), mockAccount],
        [matchers.call.fn(getSendTxGas), new BigNumber(GAS_AMOUNT)],
      ])
      .put(feeEstimated(FeeType.SEND, new BigNumber(10000).times(GAS_AMOUNT).toString()))
      .run()
  })

  it('updates the default escrow reclaim fee', async () => {
    await expectSaga(estimateFeeSaga, { feeType: FeeType.SEND })
      .provide([
        [call(getConnectedAccount), mockAccount],
        [matchers.call.fn(getReclaimEscrowGas), new BigNumber(GAS_AMOUNT)],
      ])
      .put(feeEstimated(FeeType.SEND, new BigNumber(10000).times(GAS_AMOUNT).toString()))
      .run()
  })
})
