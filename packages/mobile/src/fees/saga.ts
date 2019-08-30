import { getStableTokenContract } from '@celo/walletkit'
import BigNumber from 'bignumber.js'
import { call, put, takeLatest } from 'redux-saga/effects'
import { showError } from 'src/alert/actions'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { getReclaimEscrowGas } from 'src/escrow/saga'
import { Actions, EstimateFeeAction, feeEstimated, FeeType } from 'src/fees/actions'
import { getInvitationVerificationFee, getInviteTxGas } from 'src/invite/saga'
import { getSendTxGas } from 'src/send/saga'
import { CeloDefaultRecipient } from 'src/send/Send'
import { BasicTokenTransfer } from 'src/tokens/saga'
import Logger from 'src/utils/Logger'
import { web3 } from 'src/web3/contracts'
import { getGasPrice } from 'src/web3/gas'
import { getConnectedAccount } from 'src/web3/saga'

const TAG = 'fees/saga'
// Cache of the gas estimates for common tx types
// Prevents us from having to recreate txs and estimate their gas each time
const feeGasCache = new Map<FeeType, BigNumber>()
// Just use default values here since it doesn't matter for fee estimation
const placeholderSendTx: BasicTokenTransfer = {
  recipientAddress: CeloDefaultRecipient.address,
  amount: web3.utils.fromWei('1'),
  comment: 'Coffee or Tea?',
}

export function* estimateFeeSaga({ feeType }: EstimateFeeAction) {
  Logger.debug(`${TAG}/estimateFeeSaga`, `updating for ${feeType}`)
  try {
    const account = yield call(getConnectedAccount)

    let feeInWei: BigNumber | null = null

    switch (feeType) {
      case FeeType.INVITE:
        if (!feeGasCache.get(FeeType.INVITE)) {
          const gas: BigNumber = yield call(
            getInviteTxGas,
            account,
            getStableTokenContract,
            placeholderSendTx.amount,
            placeholderSendTx.comment
          )
          feeGasCache.set(FeeType.INVITE, gas)
        }
        feeInWei = yield call(calculateFee, feeGasCache.get(FeeType.INVITE)!)
        feeInWei = feeInWei!.plus(getInvitationVerificationFee())
        break
      case FeeType.SEND:
        if (!feeGasCache.get(FeeType.SEND)) {
          const gas: BigNumber = yield call(
            getSendTxGas,
            account,
            getStableTokenContract,
            placeholderSendTx
          )
          feeGasCache.set(FeeType.SEND, gas)
        }
        feeInWei = yield call(calculateFee, feeGasCache.get(FeeType.SEND)!)
        break
      case FeeType.EXCHANGE:
        // TODO
        break
      case FeeType.RECLAIM_ESCROW:
        if (!feeGasCache.get(FeeType.RECLAIM_ESCROW)) {
          const gas: BigNumber = yield call(
            getReclaimEscrowGas,
            account,
            CeloDefaultRecipient.address
          )
          feeGasCache.set(FeeType.RECLAIM_ESCROW, gas)
        }
        feeInWei = yield call(calculateFee, feeGasCache.get(FeeType.RECLAIM_ESCROW)!)
        break
    }

    if (feeInWei) {
      Logger.debug(`${TAG}/estimateFeeSaga`, `New fee is: ${feeInWei}`)
      yield put(feeEstimated(feeType, feeInWei.toString()))
    }
  } catch (error) {
    Logger.error(`${TAG}/estimateFeeSaga`, 'Error estimating fee', error)
    yield put(showError(ErrorMessages.CALCULATE_FEE_FAILED))
  }
}

export async function calculateFee(gas: BigNumber) {
  const gasPrice = await getGasPrice()
  if (!gasPrice) {
    throw new Error('Invalid gas price')
  }

  const feeInWei = gas.multipliedBy(gasPrice)
  Logger.debug(`${TAG}/calculateFee`, `Calculated fee is: ${feeInWei.toString()}`)
  return feeInWei
}

export function* feesSaga() {
  yield takeLatest(Actions.ESTIMATE_FEE, estimateFeeSaga)
}
