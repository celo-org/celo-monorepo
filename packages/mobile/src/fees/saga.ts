import { getStableTokenContract } from '@celo/walletkit'
import { call, put, select, spawn, takeLeading } from 'redux-saga/effects'
import { getReclaimEscrowFee } from 'src/escrow/saga'
import { Actions, EstimateFeeAction, feeEstimated, FeeType } from 'src/fees/actions'
import { getInvitationVerificationFee } from 'src/invite/saga'
import { getSendFee } from 'src/send/saga'
import { CeloDefaultRecipient } from 'src/send/Send'
import Logger from 'src/utils/Logger'
import { currentAccountSelector } from 'src/web3/selectors'

const TAG = 'fees/saga'

export function* estimateFeeSaga({ feeType }: EstimateFeeAction) {
  Logger.debug(TAG + '@estimateFeeSaga', `updating for ${feeType}`)

  // TODO: skip fee update if it was calculated recently
  const account = yield select(currentAccountSelector)

  let feeInWei

  switch (feeType) {
    case FeeType.INVITE:
      feeInWei = yield call(getInvitationVerificationFee)
      break
    case FeeType.SEND:
      // Just use default values here since it doesn't matter for fee estimation
      feeInWei = yield call(getSendFee, account, getStableTokenContract, {
        recipientAddress: CeloDefaultRecipient.address,
        amount: '1',
        comment: 'Coffee or Tea?',
      })
      break
    case FeeType.EXCHANGE:
      // TODO
      break
    case FeeType.RECLAIM_ESCROW:
      // Just use default values here since it doesn't matter for fee estimation
      feeInWei = yield call(
        getReclaimEscrowFee,
        CeloDefaultRecipient.address,
        CeloDefaultRecipient.address
      )
      break
  }

  if (feeInWei) {
    Logger.debug(`${TAG}/estimateFeeSaga`, `New fee is: ${feeInWei}`)
    yield put(feeEstimated(feeType, feeInWei))
  }
}

export function* watchEstimateFee() {
  yield takeLeading(Actions.ESTIMATE_FEE, estimateFeeSaga)
}

export function* feesSaga() {
  yield spawn(watchEstimateFee)
}
