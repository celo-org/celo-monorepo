import { CeloTransactionObject } from '@celo/connect'
import { ContractKit } from '@celo/contractkit'
import { AttestationsWrapper } from '@celo/contractkit/lib/wrappers/Attestations'
import { MetaTransactionWalletWrapper } from '@celo/contractkit/lib/wrappers/MetaTransactionWallet'
import { eqAddress } from '@celo/utils/src/address'
import { all, call, put, select } from 'redux-saga/effects'
import { e164NumberSelector } from 'src/account/selectors'
import { VerificationEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { setNumberVerified } from 'src/app/actions'
import { revokeVerificationState } from 'src/identity/actions'
import { fetchPhoneHashPrivate } from 'src/identity/privateHashing'
import { sendTransaction } from 'src/transactions/send'
import { newTransactionContext } from 'src/transactions/types'
import Logger from 'src/utils/Logger'
import { setMtwAddress } from 'src/web3/actions'
import { getContractKit } from 'src/web3/contracts'
import { getAccountAddress, getConnectedUnlockedAccount } from 'src/web3/saga'
import { mtwAddressSelector } from 'src/web3/selectors'

const TAG = 'identity/revoke'

// TODO add support for revoking partially verified accounts
// i.e. accounts with 1-2 attestations but not 3+
export function* revokeVerificationSaga() {
  Logger.debug(TAG + '@revokeVerification', 'Revoking previous verification')
  let mtwAddress: string | null = null
  try {
    mtwAddress = yield select(mtwAddressSelector)
    ValoraAnalytics.track(VerificationEvents.verification_revoke_start, { feeless: !!mtwAddress })
    const walletAddress: string | null = yield call(getConnectedUnlockedAccount)
    const e164Number: string | null = yield select(e164NumberSelector)

    if (!walletAddress) {
      throw new Error('walletAddress not set')
    }
    if (!e164Number) {
      throw new Error('e164 number not set')
    }

    const accountAddress: string = yield call(getAccountAddress)
    Logger.debug(
      TAG + '@revokeVerification',
      `Checking for attestations on ${mtwAddress ? 'MTW' : 'EOA'} account address ${accountAddress}`
    )

    const contractKit: ContractKit = yield call(getContractKit)
    const attestationsWrapper: AttestationsWrapper = yield call([
      contractKit.contracts,
      contractKit.contracts.getAttestations,
    ])
    const phoneHashDetails = yield call(fetchPhoneHashPrivate, e164Number)
    const phoneHash = phoneHashDetails.phoneHash

    // Check that the account is currently associated with the identifier.
    const accounts: string[] = yield call(
      [attestationsWrapper, attestationsWrapper.lookupAccountsForIdentifier],
      phoneHash
    )
    const associated = accounts.some((acc) => eqAddress(acc, accountAddress))

    if (associated) {
      const tx: CeloTransactionObject<void> = mtwAddress
        ? yield call(createRevokeTxForMTW, contractKit, attestationsWrapper, phoneHash, mtwAddress)
        : yield call(createRevokeTxForEOA, attestationsWrapper, phoneHash, walletAddress)

      Logger.debug(
        TAG + '@revokeVerification',
        'Account associated with our phone identifier, sending revoke trasaction'
      )
      yield call(
        sendTransaction,
        tx.txo,
        walletAddress,
        newTransactionContext(TAG, 'Revoke verification')
      )

      // TODO clear old mapping from the contact maps (e164ToAddress, etc.) to prevent stale values there
    } else {
      Logger.debug(
        TAG + '@revokeVerification',
        'Account is not associated with our phone identifier, skipping revoke transaction'
      )
    }

    yield all([
      put(revokeVerificationState(walletAddress)),
      put(setNumberVerified(false)),
      put(setMtwAddress(null)),
    ])
    ValoraAnalytics.track(VerificationEvents.verification_revoke_finish, { feeless: !!mtwAddress })
    Logger.showMessage('Address revoke was successful')
  } catch (err) {
    Logger.error(TAG + '@revokeVerification', 'Error revoking verification', err)
    ValoraAnalytics.track(VerificationEvents.verification_revoke_error, {
      error: err.message,
      feeless: !!mtwAddress,
    })

    // TODO i18n and use showError banner
    Logger.showError('Failed to revoke verification')
  }
}

function* createRevokeTxForEOA(
  attestationsWrapper: AttestationsWrapper,
  phoneHash: string,
  accountAddress: string
) {
  const tx: CeloTransactionObject<void> = yield call(
    [attestationsWrapper, attestationsWrapper.revoke],
    phoneHash,
    accountAddress
  )

  return tx
}

function* createRevokeTxForMTW(
  contractKit: ContractKit,
  attestationsWrapper: AttestationsWrapper,
  phoneHash: string,
  mtwAddress: string
) {
  const mtwWrapper: MetaTransactionWalletWrapper = yield call(
    [contractKit.contracts, contractKit.contracts.getMetaTransactionWallet],
    mtwAddress
  )

  const revokeTx: CeloTransactionObject<void> = yield call(
    [attestationsWrapper, attestationsWrapper.revoke],
    phoneHash,
    mtwAddress
  )

  const revokeTxViaMTW: CeloTransactionObject<string> = yield call(
    [mtwWrapper, mtwWrapper.signAndExecuteMetaTransaction],
    revokeTx.txo
  )

  return revokeTxViaMTW
}
