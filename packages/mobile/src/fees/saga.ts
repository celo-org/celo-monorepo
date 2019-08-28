import { getStableTokenContract } from '@celo/walletkit'
import BigNumber from 'bignumber.js'
import { call, put, select, spawn, takeLeading } from 'redux-saga/effects'
import { showError } from 'src/alert/actions'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { getReclaimEscrowFee } from 'src/escrow/saga'
import { Actions, EstimateFeeAction, feeEstimated, FeeType } from 'src/fees/actions'
import { getInvitationVerificationFee } from 'src/invite/saga'
import { getSendFee } from 'src/send/saga'
import { CeloDefaultRecipient } from 'src/send/Send'
import Logger from 'src/utils/Logger'
import { web3 } from 'src/web3/contracts'
import { currentAccountSelector } from 'src/web3/selectors'

const TAG = 'fees/saga'
const feeCache = new Map<FeeType, BigNumber>()

// TODO: skip fee update if it was calculated recently
export function* estimateFeeSaga({ feeType }: EstimateFeeAction) {
  Logger.debug(`${TAG}/estimateFeeSaga`, `updating for ${feeType}`)
  try {
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
          amount: web3.utils.fromWei('1'),
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
  } catch (error) {
    Logger.error(`${TAG}/estimateFeeSaga`, 'Error estimating fee', error)
    yield put(showError(ErrorMessages.CALCULATE_FEE_FAILED))
  }
}

export function* watchEstimateFee() {
  yield takeLeading(Actions.ESTIMATE_FEE, estimateFeeSaga)
}

export function* feesSaga() {
  yield spawn(watchEstimateFee)
}
