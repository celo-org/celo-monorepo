import { getStableTokenContract } from '@celo/contractkit'
import { call, put, spawn, takeLeading } from 'redux-saga/effects'
import { Actions, defaultFeeUpdated, FeeType, UpdateDefaultFeeAction } from 'src/fees/actions'
import { getInvitationVerificationFee } from 'src/invite/saga'
import { getSendFee } from 'src/send/saga'
import { CeloDefaultRecipient } from 'src/send/Send'
import Logger from 'src/utils/Logger'

const TAG = 'fees/saga'

export function* updateDefaultFeeSaga({ feeType }: UpdateDefaultFeeAction) {
  Logger.debug(TAG + '@updateDefaultFeeSaga', 'updating for ', feeType)

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
    case FeeType.ESCROW:
      // TODO
      break
  }

  if (feeInWei) {
    Logger.debug(`${TAG}/updateDefaultFeeSaga`, `New fee is: ${feeInWei}`)
    yield put(defaultFeeUpdated(feeType, feeInWei))
  }
}

export function* watchUpdateDefaultFee() {
  yield takeLeading(Actions.UPDATE_DEFAULT_FEE, updateDefaultFeeSaga)
}

export function* feesSaga() {
  yield spawn(watchUpdateDefaultFee)
}
