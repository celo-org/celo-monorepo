/**
 * Sagas and utils for handling DEK related tasks
 * Ideally all this code and the DEK state and logic would be moved out of the web3 dir
 * but keeping it here for now since that's where other account state is
 */

import { OdisUtils } from '@celo/contractkit'
import { AuthSigner } from '@celo/contractkit/lib/identity/odis/query'
import { AccountsWrapper } from '@celo/contractkit/lib/wrappers/Accounts'
import { ensureLeading0x, eqAddress, hexToBuffer } from '@celo/utils/src/address'
import { CURRENCY_ENUM } from '@celo/utils/src/currencies'
import { compressedPubKey, deriveDek } from '@celo/utils/src/dataEncryptionKey'
import * as bip39 from 'react-native-bip39'
import { call, put, select } from 'redux-saga/effects'
import { OnboardingEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { getStoredMnemonic } from 'src/backup/utils'
import { features } from 'src/flags'
import { FetchDataEncryptionKeyAction, updateAddressDekMap } from 'src/identity/actions'
import { getCurrencyAddress } from 'src/tokens/saga'
import { sendTransaction } from 'src/transactions/send'
import Logger from 'src/utils/Logger'
import { registerDataEncryptionKey, setDataEncryptionKey } from 'src/web3/actions'
import { getContractKit, getContractKitAsync } from 'src/web3/contracts'
import { getConnectedUnlockedAccount } from 'src/web3/saga'
import { dataEncryptionKeySelector, isDekRegisteredSelector } from 'src/web3/selectors'
import { estimateGas } from 'src/web3/utils'

const TAG = 'web3/dataEncryptionKey'
const PLACEHOLDER_DEK = '0x02c9cacca8c5c5ebb24dc6080a933f6d52a072136a069083438293d71da36049dc'

export function* fetchDataEncryptionKeyWrapper({ address }: FetchDataEncryptionKeyAction) {
  yield call(doFetchDataEncryptionKey, address)
}

export function* doFetchDataEncryptionKey(address: string) {
  // TODO consider caching here
  // We could use the values in the DekMap instead of looking up each time
  // But Deks can change, how should we invalidate the cache?

  const contractKit = yield call(getContractKit)
  const accountsWrapper: AccountsWrapper = yield call([
    contractKit.contracts,
    contractKit.contracts.getAccounts,
  ])
  const dek: string = yield call(accountsWrapper.getDataEncryptionKey, address)
  yield put(updateAddressDekMap(address, dek || null))
  return !dek ? null : hexToBuffer(dek)
}

export function* createAccountDek(mnemonic: string) {
  if (!mnemonic) {
    throw new Error('Cannot generate DEK with empty mnemonic')
  }
  const { privateKey } = yield call(deriveDek, mnemonic, bip39)
  const newDek = ensureLeading0x(privateKey)
  yield put(setDataEncryptionKey(newDek))
  return newDek
}

// Register the address and DEK with the Accounts contract
// A no-op if registration has already been done
export function* registerAccountDek(account: string) {
  try {
    const isAlreadyRegistered = yield select(isDekRegisteredSelector)
    if (isAlreadyRegistered) {
      return
    }

    Logger.debug(
      `${TAG}@registerAccountDEK`,
      'Setting wallet address and public data encryption key'
    )

    yield call(getConnectedUnlockedAccount)
    let privateDataKey: string | null = yield select(dataEncryptionKeySelector)
    if (!privateDataKey) {
      throw new Error('No data key in store. Should never happen.')
    }

    /**
     * BEGIN MIGRATION HACK
     * This code can be safely removed once existing Valora users have all run it
     * It's needed because we need to regenerate their DEKs now that the scheme has changed
     * If it's still here by 2020/08/23 please remove it.
     */
    const mnemonic = yield call(getStoredMnemonic, account)
    privateDataKey = yield call(createAccountDek, mnemonic)
    if (!privateDataKey) {
      throw new Error('Failed to create new DEK in migration hack')
    }
    /**
     * END MIGRATION HACK
     */

    const publicDataKey = compressedPubKey(hexToBuffer(privateDataKey))

    const contractKit = yield call(getContractKit)
    const accountsWrapper: AccountsWrapper = yield call([
      contractKit.contracts,
      contractKit.contracts.getAccounts,
    ])

    const upToDate: boolean = yield call(isAccountUpToDate, accountsWrapper, account, publicDataKey)
    if (upToDate) {
      Logger.debug(`${TAG}@registerAccountDEK`, 'Address and DEK up to date, skipping.')
      yield put(registerDataEncryptionKey())
      return
    }

    const setAccountTx = accountsWrapper.setAccount('', publicDataKey, account)
    yield call(sendTransaction, setAccountTx.txo, account, TAG, 'Set Wallet Address & DEK')
    yield put(registerDataEncryptionKey())
    ValoraAnalytics.track(OnboardingEvents.account_dek_set)
  } catch (error) {
    // DEK registration failures are not considered fatal. Swallow the error and allow calling saga to proceed.
    // Registration will be re-attempted on next payment send
    Logger.error(`${TAG}@registerAccountDEK`, 'Failure registering DEK', error)
  }
}

// Check if account address and DEK match what's in
// the Accounts contract
export async function isAccountUpToDate(
  accountsWrapper: AccountsWrapper,
  address: string,
  dataKey: string
) {
  if (!address || !dataKey) {
    return false
  }

  const [currentWalletAddress, currentDEK] = await Promise.all([
    accountsWrapper.getWalletAddress(address),
    accountsWrapper.getDataEncryptionKey(address),
  ])
  Logger.debug(`${TAG}/isAccountUpToDate`, `DEK associated with account ${currentDEK}`)
  return eqAddress(currentWalletAddress, address) && currentDEK && eqAddress(currentDEK, dataKey)
}

export async function getRegisterDekTxGas(account: string, currency: CURRENCY_ENUM) {
  try {
    Logger.debug(`${TAG}/getRegisterDekTxGas`, 'Getting gas estimate for tx')
    const contractKit = await getContractKitAsync()
    const Accounts = await contractKit.contracts.getAccounts()
    const tx = Accounts.setAccount('', PLACEHOLDER_DEK, account)
    const txParams = { from: account, feeCurrency: await getCurrencyAddress(currency) }
    const gas = await estimateGas(tx.txo, txParams)
    Logger.debug(`${TAG}/getRegisterDekTxGas`, `Estimated gas of ${gas.toString()}`)
    return gas
  } catch (error) {
    Logger.warn(`${TAG}/getRegisterDekTxGas`, 'Failed to estimate DEK tx gas', error)
    throw Error(ErrorMessages.INSUFFICIENT_BALANCE)
  }
}

export function* getAuthSignerForAccount(account: string) {
  const contractKit = yield call(getContractKit)

  if (features.PNP_USE_DEK_FOR_AUTH) {
    // Use the DEK for authentication if the current DEK is registered with this account
    const accountsWrapper: AccountsWrapper = yield call([
      contractKit.contracts,
      contractKit.contracts.getAccounts,
    ])
    const privateDataKey: string | null = yield select(dataEncryptionKeySelector)
    if (!privateDataKey) {
      Logger.error(TAG + '/getAuthSignerForAccount', 'Missing comment key, should never happen.')
    } else {
      const publicDataKey = compressedPubKey(hexToBuffer(privateDataKey))
      const upToDate: boolean = yield call(
        isAccountUpToDate,
        accountsWrapper,
        account,
        publicDataKey
      )
      if (!upToDate) {
        Logger.error(TAG + '/getAuthSignerForAccount', `DEK mismatch.`)
      } else {
        Logger.info(TAG + '/getAuthSignerForAccount', 'Using DEK for authentication')
        const encyptionKeySigner: AuthSigner = {
          authenticationMethod: OdisUtils.Query.AuthenticationMethod.ENCRYPTION_KEY,
          rawKey: privateDataKey,
        }
        return encyptionKeySigner
      }
    }
  }

  // Fallback to using wallet key
  Logger.info(TAG + '/getAuthSignerForAccount', 'Using wallet key for authentication')
  const walletKeySigner: AuthSigner = {
    authenticationMethod: OdisUtils.Query.AuthenticationMethod.WALLET_KEY,
    contractKit,
  }
  return walletKeySigner
}
