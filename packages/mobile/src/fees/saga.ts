import { getStableTokenContract } from '@celo/walletkit'
import BigNumber from 'bignumber.js'
import { call, put, select, takeLatest } from 'redux-saga/effects'
import { showError } from 'src/alert/actions'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { getReclaimEscrowGas } from 'src/escrow/saga'
import { Actions, EstimateFeeAction, feeEstimated, FeeType } from 'src/fees/actions'
import { getInvitationVerificationFee } from 'src/invite/saga'
import { getSendTxGas } from 'src/send/saga'
import { CeloDefaultRecipient } from 'src/send/Send'
import Logger from 'src/utils/Logger'
import { web3 } from 'src/web3/contracts'
import { getGasPrice } from 'src/web3/gas'
import { currentAccountSelector } from 'src/web3/selectors'

const TAG = 'fees/saga'
// Cache of the gas estimates for common tx types
// Prevents us from having to recreate txs and estimate their gas each time
const feeGasCache = new Map<FeeType, BigNumber>()

export function* estimateFeeSaga({ feeType }: EstimateFeeAction) {
  Logger.debug(`${TAG}/estimateFeeSaga`, `updating for ${feeType}`)
  try {
    const account = yield select(currentAccountSelector)

    let feeInWei: BigNumber | null = null

    switch (feeType) {
      case FeeType.INVITE:
        // TODO(Rossy) Once we stop using a flat fee for this
        // then we should cache it like we do for send
        feeInWei = yield call(getInvitationVerificationFee)
        break
      case FeeType.SEND:
        if (!feeGasCache.get(FeeType.SEND)) {
          // Just use default values here since it doesn't matter for fee estimation
          const gas: BigNumber = yield call(getSendTxGas, account, getStableTokenContract, {
            recipientAddress: CeloDefaultRecipient.address,
            amount: web3.utils.fromWei('1'),
            comment: 'Coffee or Tea?',
          })
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
