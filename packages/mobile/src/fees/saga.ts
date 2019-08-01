import { getStableTokenContract } from '@celo/contractkit'
import { call, put, spawn, takeLeading } from 'redux-saga/effects'
import { Actions, EstimateFeeAction, feeEstimated, FeeType } from 'src/fees/actions'
import { getInvitationVerificationFee } from 'src/invite/saga'
import { getSendFee } from 'src/send/saga'
import { CeloDefaultRecipient } from 'src/send/Send'
import Logger from 'src/utils/Logger'

const TAG = 'fees/saga'

export function* estimateFeeSaga({ feeType }: EstimateFeeAction) {
  Logger.debug(TAG + '@estimateFeeSaga', 'updating for ', feeType)

  // TODO: skip fee update if it was calculated recently

  let feeInWei

  switch (feeType) {
    case FeeType.INVITE:
      feeInWei = yield call(getInvitationVerificationFee)
      break
    case FeeType.SEND:
      // Just use default values here since it doesn't matter for fee estimation
      feeInWei = yield call(getSendFee, CeloDefaultRecipient.address, getStableTokenContract, {
        recipientAddress: CeloDefaultRecipient.address,
        amount: '1',
        comment: 'Coffee or Tea?',
      })
      break
    case FeeType.EXCHANGE:
      // TODO
      break
    case FeeType.RECLAIM_ESCROW:
      // TODO
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
