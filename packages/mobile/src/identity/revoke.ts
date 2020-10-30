import { CeloTransactionObject } from '@celo/contractkit'
import { AttestationsWrapper } from '@celo/contractkit/lib/wrappers/Attestations'
import { AttestationsStatus } from '@celo/utils/src/attestations'
import { call, put, select } from 'redux-saga/effects'
import { e164NumberSelector } from 'src/account/selectors'
import { VerificationEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { setNumberVerified } from 'src/app/actions'
import { resetVerification } from 'src/identity/actions'
import { fetchPhoneHashPrivate } from 'src/identity/privateHashing'
import { getAttestationsStatus } from 'src/identity/verification'
import { sendTransaction } from 'src/transactions/send'
import { newTransactionContext } from 'src/transactions/types'
import Logger from 'src/utils/Logger'
import { getContractKit } from 'src/web3/contracts'
import { currentAccountSelector } from 'src/web3/selectors'

const TAG = 'identity/revoke'

// TODO add support for revoking partially verified accounts
// i.e. accounts with 1-2 attestations but not 3+
export function* revokeVerificationSaga() {
  Logger.debug(TAG + '@revokeVerification', 'Revoking previous verification')
  try {
    const account: string | null = yield select(currentAccountSelector)
    const e164Number: string | null = yield select(e164NumberSelector)
    if (!account) {
      throw new Error('account not set')
    }
    if (!e164Number) {
      throw new Error('e164 number not set')
    }

    ValoraAnalytics.track(VerificationEvents.verification_revoke_start)
    const contractKit = yield call(getContractKit)
    const attestationsWrapper: AttestationsWrapper = yield call([
      contractKit.contracts,
      contractKit.contracts.getAttestations,
    ])
    const phoneHashDetails = yield call(fetchPhoneHashPrivate, e164Number)
    const phoneHash = phoneHashDetails.phoneHash

    const status: AttestationsStatus = yield call(
      getAttestationsStatus,
      attestationsWrapper,
      account,
      phoneHash
    )

    if (status.isVerified) {
      const tx: CeloTransactionObject<void> = yield call(
        [attestationsWrapper, attestationsWrapper.revoke],
        phoneHash,
        account
      )
      yield call(
        sendTransaction,
        tx.txo,
        account,
        newTransactionContext(TAG, 'Revoke verification')
      )

      // TODO clear old mapping from the contact maps (e164ToAddress, etc.) to prevent stale values there
    } else {
      Logger.debug(TAG + '@revokeVerification', 'Account not verified, skipping actual revoke call')
    }
    yield put(resetVerification())
    yield put(setNumberVerified(false))

    ValoraAnalytics.track(VerificationEvents.verification_revoke_finish)
  } catch (err) {
    Logger.error(TAG + '@revokeVerification', 'Error revoking verification', err)
    ValoraAnalytics.track(VerificationEvents.verification_revoke_error, {
      error: err.message,
    })

    // TODO i18n and use showError banner
    Logger.showError('Failed to revoke verification')
  }
}
