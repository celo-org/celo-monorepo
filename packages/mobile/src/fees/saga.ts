import { CURRENCY_ENUM } from '@celo/utils/src'
import BigNumber from 'bignumber.js'
import { call, CallEffect, put, select, takeLatest } from 'redux-saga/effects'
import { showError } from 'src/alert/actions'
import { FeeEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { getReclaimEscrowGas } from 'src/escrow/saga'
import { Actions, EstimateFeeAction, feeEstimated, FeeType } from 'src/fees/actions'
import { getInvitationVerificationFeeInWei, getInviteTxGas } from 'src/invite/saga'
import { getSendTxGas } from 'src/send/saga'
import { stableTokenBalanceSelector } from 'src/stableToken/reducer'
import { BasicTokenTransfer } from 'src/tokens/saga'
import Logger from 'src/utils/Logger'
import { getGasPrice } from 'src/web3/gas'
import { getConnectedAccount } from 'src/web3/saga'

const TAG = 'fees/saga'
// Cache of the gas estimates for common tx types
// Prevents us from having to recreate txs and estimate their gas each time
const feeGasCache = new Map<FeeType, BigNumber>()
// Just use default values here since it doesn't matter for fee estimation

const placeHolderAddress = `0xce10ce10ce10ce10ce10ce10ce10ce10ce10ce10`
const placeholderSendTx: BasicTokenTransfer = {
  recipientAddress: placeHolderAddress,
  amount: 1e-18, // 1 wei
  comment: 'Coffee or Tea?',
}

export function* estimateFeeSaga({ feeType }: EstimateFeeAction) {
  Logger.debug(`${TAG}/estimateFeeSaga`, `updating for ${feeType}`)

  const balance = yield select(stableTokenBalanceSelector)

  if (!balance) {
    Logger.warn(`${TAG}/estimateFeeSaga`, 'Balance is null or empty string')
    yield put(feeEstimated(feeType, '0'))
    return
  }

  if (balance === '0') {
    Logger.warn(`${TAG}/estimateFeeSaga`, "Can't estimate fee with zero balance")
    yield put(feeEstimated(feeType, '0'))
    return
  }

  Logger.debug(`${TAG}/estimateFeeSaga`, `balance is ${balance}`)

  try {
    const account = yield call(getConnectedAccount)

    let feeInWei: BigNumber | null = null

    switch (feeType) {
      case FeeType.INVITE:
        feeInWei = yield call(
          getOrSetFee,
          FeeType.INVITE,
          call(
            getInviteTxGas,
            account,
            CURRENCY_ENUM.DOLLAR,
            placeholderSendTx.amount,
            placeholderSendTx.comment
          )
        )
        feeInWei = feeInWei!.plus(getInvitationVerificationFeeInWei())
        break
      case FeeType.SEND:
        feeInWei = yield call(
          getOrSetFee,
          FeeType.SEND,
          call(getSendTxGas, account, CURRENCY_ENUM.DOLLAR, placeholderSendTx)
        )
        break
      case FeeType.EXCHANGE:
        // TODO
        break
      case FeeType.RECLAIM_ESCROW:
        feeInWei = yield call(
          getOrSetFee,
          FeeType.RECLAIM_ESCROW,
          call(getReclaimEscrowGas, account, placeHolderAddress)
        )
        break
    }

    if (feeInWei) {
      Logger.debug(`${TAG}/estimateFeeSaga`, `New fee is: ${feeInWei}`)
      yield put(feeEstimated(feeType, feeInWei.toString()))
    }
  } catch (error) {
    Logger.error(`${TAG}/estimateFeeSaga`, 'Error estimating fee', error)
    ValoraAnalytics.track(FeeEvents.estimate_fee_failed, { error: error.message, feeType })
    yield put(showError(ErrorMessages.CALCULATE_FEE_FAILED))
  }
}

function* getOrSetFee(feeType: FeeType, gasGetter: CallEffect) {
  if (!feeGasCache.get(feeType)) {
    const gas: BigNumber = yield gasGetter
    feeGasCache.set(feeType, gas)
  }
  const feeInWei: BigNumber = yield call(calculateFee, feeGasCache.get(feeType)!)
  return feeInWei
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
