import { AttestationsWrapper } from '@celo/contractkit/lib/wrappers/Attestations'
import { AttestationsStatus } from '@celo/utils/src/attestations'
import { call, put } from 'redux-saga/effects'
import { VerificationEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { setNumberVerified } from 'src/app/actions'
import { resetVerification } from 'src/identity/actions'
import { fetchPhoneHashPrivate } from 'src/identity/privateHashing'
import { getAttestationsStatus } from 'src/identity/verification'
import Logger from 'src/utils/Logger'
import { getContractKit } from 'src/web3/contracts'

const TAG = 'identity/revoke'

export function* revokePhoneMapping(e164Number: string, account: string) {
  Logger.debug(TAG + '@revokeVerification', 'Revoking previous verification')
  try {
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
      yield call([attestationsWrapper, attestationsWrapper.revoke], phoneHash, account)
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

    throw new Error('Could not revoke mapping')
  }
}
