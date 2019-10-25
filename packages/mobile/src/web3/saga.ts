import { deriveCEK } from '@celo/utils/src/commentEncryption'
import { getAccountAddressFromPrivateKey } from '@celo/walletkit'
import * as Crypto from 'crypto'
import { generateMnemonic, mnemonicToSeedHex } from 'react-native-bip39'
import * as RNFS from 'react-native-fs'
import { REHYDRATE } from 'redux-persist/es/constants'
import { call, delay, put, race, select, spawn, take, takeLatest } from 'redux-saga/effects'
import { setAccountCreationTime } from 'src/account/actions'
import { getPincode } from 'src/account/saga'
import { showError } from 'src/alert/actions'
import CeloAnalytics from 'src/analytics/CeloAnalytics'
import { CustomEventNames } from 'src/analytics/constants'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { currentLanguageSelector } from 'src/app/reducers'
import { getWordlist } from 'src/backup/utils'
import { UNLOCK_DURATION } from 'src/geth/consts'
import { deleteChainData, stopGethIfInitialized } from 'src/geth/geth'
import { initGethSaga } from 'src/geth/saga'
import { navigateToError } from 'src/navigator/NavigationService'
import { waitWeb3LastBlock } from 'src/networkInfo/saga'
import { setCachedPincode } from 'src/pincode/PincodeCache'
import { setKey } from 'src/utils/keyStore'
import Logger from 'src/utils/Logger'
import {
  Actions,
  getLatestBlock,
  setAccount,
  setAccountInWeb3Keystore,
  SetIsZeroSyncAction,
  setLatestBlockNumber,
  setPrivateCommentKey,
  updateWeb3SyncProgress,
} from 'src/web3/actions'
import { addLocalAccount, switchWeb3ProviderForSyncMode, web3 } from 'src/web3/contracts'
import {
  currentAccountInWeb3KeystoreSelector,
  currentAccountSelector,
  zeroSyncSelector,
} from 'src/web3/selectors'
import { Block } from 'web3/eth/types'

const ETH_PRIVATE_KEY_LENGTH = 64
const MNEMONIC_BIT_LENGTH = (ETH_PRIVATE_KEY_LENGTH * 8) / 2

const TAG = 'web3/saga'
// The timeout for web3 to complete syncing and the latestBlock to be > 0
export const SYNC_TIMEOUT = 60000
const BLOCK_CHAIN_CORRUPTION_ERROR = "Error: CONNECTION ERROR: Couldn't connect to node on IPC."

// checks if web3 claims it is currently syncing and attempts to wait for it to complete
export function* checkWeb3SyncProgress() {
  const zeroSyncMode = yield select(zeroSyncSelector)
  if (zeroSyncMode) {
    // In this mode, the check seems to fail with
    // web3/saga/checking web3 sync progress: Error: Invalid JSON RPC response: "":
    return true
  }
  while (true) {
    try {
      Logger.debug(TAG, 'checkWeb3SyncProgress', 'Checking sync progress')

      // isSyncing returns a syncProgress object when it's still syncing, false otherwise
      const syncProgress = yield web3.eth.isSyncing()

      if (typeof syncProgress === 'boolean' && !syncProgress) {
        Logger.debug(TAG, 'checkWeb3SyncProgress', 'Sync maybe complete, checking')

        const latestBlock: Block = yield call(getLatestBlock)
        if (latestBlock && latestBlock.number > 0) {
          yield put(setLatestBlockNumber(latestBlock.number))
          Logger.debug(TAG, 'checkWeb3SyncProgress', 'Sync is complete')
          return true
        } else {
          Logger.debug(TAG, 'checkWeb3SyncProgress', 'Sync not actually complete, still waiting')
        }
      } else {
        yield put(updateWeb3SyncProgress(syncProgress))
      }

      yield delay(100) // wait 100ms while web3 syncs
    } catch (error) {
      if (error.toString().toLowerCase() === BLOCK_CHAIN_CORRUPTION_ERROR.toLowerCase()) {
        CeloAnalytics.track(CustomEventNames.blockChainCorruption, {}, true)
        const deleted = yield call(deleteChainData)
        if (deleted) {
          navigateToError('corruptedChainDeleted')
        }
      } else {
        Logger.error(TAG, 'Unexpected sync error', error)
      }
      return false
    }
  }
}

export function* waitForWeb3Sync() {
  try {
    const { syncComplete, timeout } = yield race({
      syncComplete: call(checkWeb3SyncProgress),
      timeout: delay(SYNC_TIMEOUT),
    })

    if (timeout || !syncComplete) {
      Logger.error(TAG, 'Could not complete sync')
      navigateToError('web3FailedToSync')
      return false
    }

    return true
  } catch (error) {
    Logger.error(TAG, 'checkWeb3Sync', error)
    navigateToError('errorDuringSync')
    return false
  }
}

export function* getOrCreateAccount() {
  const account = yield select(currentAccountSelector)
  if (account) {
    Logger.debug(
      TAG + '@getOrCreateAccount',
      'Tried to create account twice, returning the existing one'
    )
    return account
  }
  Logger.debug(TAG + '@getOrCreateAccount', 'Creating a new account')
  const wordlist = getWordlist(yield select(currentLanguageSelector))
  const mnemonic = String(yield call(generateMnemonic, MNEMONIC_BIT_LENGTH, null, wordlist))
  const privateKey = yield call(mnemonicToSeedHex, mnemonic)
  const accountAddress = yield call(assignAccountFromPrivateKey, privateKey)

  if (accountAddress) {
    try {
      yield call(setKey, 'mnemonic', mnemonic)
    } catch (e) {
      Logger.error(TAG + '@getOrCreateAccount', 'Failed to set mnemonic', e)
    }
    return accountAddress
  } else {
    return null
  }
}

export function* assignAccountFromPrivateKey(key: string) {
  const currentAccount = yield select(currentAccountSelector)

  try {
    const pincode = yield call(getPincode)
    if (!pincode) {
      Logger.error(TAG + '@assignAccountFromPrivateKey', 'Got falsy pin')
      throw Error('Cannot create account without having the pin set')
    }

    let account: string

    // Save the account to a local file on the disk.
    // This is done for all sync modes, to allow users to switch into zeroSync mode.
    // Note that if geth is running it saves the key using web3.personal.
    const privateKey = String(key)
    account = getAccountAddressFromPrivateKey(privateKey)
    yield savePrivateKeyToLocalDisk(account, privateKey, pincode)

    const zeroSyncMode = yield select(zeroSyncSelector)
    if (zeroSyncMode) {
      Logger.debug(TAG + '@assignAccountFromPrivateKey', 'Init web3 with private key')
      addLocalAccount(web3, privateKey)
    } else {
      try {
        // @ts-ignore
        account = yield call(web3.eth.personal.importRawKey, String(key), pincode)
      } catch (e) {
        if (e.toString().includes('account already exists')) {
          account = currentAccount
          Logger.debug(
            TAG + '@assignAccountFromPrivateKey',
            'Importing same account as current one'
          )
        } else {
          Logger.error(TAG + '@assignAccountFromPrivateKey', 'Error importing raw key')
          throw e
        }
      }
      yield call(web3.eth.personal.unlockAccount, account, pincode, UNLOCK_DURATION)
    }

    Logger.debug(
      TAG + '@assignAccountFromPrivateKey',
      `Created account from mnemonic and added to wallet: ${account}`
    )

    yield put(setAccount(account))
    yield put(setAccountCreationTime())
    yield call(assignDataKeyFromPrivateKey, key)

    if (!zeroSyncMode) {
      web3.eth.defaultAccount = account
    }
    return account
  } catch (e) {
    Logger.error(
      TAG + '@assignAccountFromPrivateKey',
      'Error assigning account from private key',
      e
    )
    return null
  }
}

function* assignDataKeyFromPrivateKey(key: string) {
  const privateCEK = deriveCEK(key).toString('hex')
  yield put(setPrivateCommentKey(privateCEK))
}

function getPrivateKeyFilePath(account: string): string {
  return `${RNFS.DocumentDirectoryPath}/private_key_for_${account.toLowerCase()}.txt`
}

function ensureAddressAndKeyMatch(address: string, privateKey: string) {
  const generatedAddress = getAccountAddressFromPrivateKey(privateKey)
  if (!generatedAddress) {
    throw new Error(`Failed to generate address from private key`)
  }
  if (address.toLowerCase() !== generatedAddress.toLowerCase()) {
    throw new Error(
      `Address from private key: ${generatedAddress}, ` + `address of sender ${address}`
    )
  }
  Logger.debug(TAG + '@ensureAddressAndKeyMatch', `Sender and private key match`)
}

async function savePrivateKeyToLocalDisk(
  account: string,
  privateKey: string,
  encryptionPassword: string
) {
  ensureAddressAndKeyMatch(account, privateKey)
  const filePath = getPrivateKeyFilePath(account)
  const plainTextData = privateKey
  const encryptedData: Buffer = getEncryptedData(plainTextData, encryptionPassword)
  Logger.debug('savePrivateKeyToLocalDisk', `Writing encrypted private key to ${filePath}`)
  await RNFS.writeFile(getPrivateKeyFilePath(account), encryptedData.toString('hex'))
}

// Reads and returns unencrypted private key
export async function readPrivateKeyFromLocalDisk(
  account: string,
  encryptionPassword: string
): Promise<string> {
  const filePath = getPrivateKeyFilePath(account)
  Logger.debug('readPrivateKeyFromLocalDisk', `Reading private key from ${filePath}`)
  const hexEncodedEncryptedData: string = await RNFS.readFile(filePath)
  const encryptedDataBuffer: Buffer = new Buffer(hexEncodedEncryptedData, 'hex')
  const privateKey: string = getDecryptedData(encryptedDataBuffer, encryptionPassword)
  ensureAddressAndKeyMatch(account, privateKey)
  return privateKey
}

// Exported for testing
export function getEncryptedData(plainTextData: string, password: string): Buffer {
  try {
    const cipher = Crypto.createCipher('aes-256-cbc', password)
    return Buffer.concat([cipher.update(new Buffer(plainTextData, 'utf8')), cipher.final()])
  } catch (e) {
    Logger.error(TAG + '@getEncryptedData', 'Failed to write private key', e)
    throw e // Re-throw
  }
}

// Exported for testing
export function getDecryptedData(encryptedData: Buffer, password: string): string {
  try {
    const decipher = Crypto.createDecipher('aes-256-cbc', password)
    const decrypted = Buffer.concat([decipher.update(encryptedData), decipher.final()])
    return decrypted.toString('utf8')
  } catch (e) {
    Logger.error(TAG + '@getDecryptedData', 'Failed to read private key', e)
    throw e // Re-throw
  }
}

// Wait for account to exist and then return it
export function* getAccount() {
  while (true) {
    const account = yield select(currentAccountSelector)
    if (account) {
      return account
    }

    const action = yield take([Actions.SET_ACCOUNT, REHYDRATE])
    if (action.type === REHYDRATE) {
      // Wait for rehydrate and select the state again
      continue
    }
    if (action.address) {
      // account exists
      return action.address
    }
  }
}

async function isLocked(address: string) {
  try {
    // Test account to see if it is unlocked
    await web3.eth.sign('', address)
  } catch (e) {
    return true
  }
  return false
}

let accountAlreadyAddedInZeroSyncMode = false

export function* unlockAccount(account: string) {
  Logger.debug(TAG + '@unlockAccount', `Unlocking account: ${account}`)
  try {
    const isAccountLocked = yield call(isLocked, account)
    if (!isAccountLocked) {
      return true
    }

    const pincode = yield call(getPincode)
    const zeroSyncMode = yield select(zeroSyncSelector)
    if (zeroSyncMode) {
      if (accountAlreadyAddedInZeroSyncMode) {
        Logger.info(TAG + 'unlockAccount', `Account ${account} already added to web3 for signing`)
      } else {
        Logger.info(TAG + '@unlockAccount', `unlockDuration is ignored in Geth free mode`)
        const privateKey: string = yield readPrivateKeyFromLocalDisk(account, pincode)
        addLocalAccount(web3, privateKey)
        accountAlreadyAddedInZeroSyncMode = true
      }
      return true
    } else {
      yield call(web3.eth.personal.unlockAccount, account, pincode, UNLOCK_DURATION)
      Logger.debug(TAG + '@unlockAccount', `Account unlocked: ${account}`)
      return true
    }
  } catch (error) {
    setCachedPincode(null)
    Logger.error(TAG + '@unlockAccount', 'Web3 account unlock failed', error)
    return false
  }
}

// Wait for geth to be connected and account ready
export function* getConnectedAccount() {
  yield call(waitWeb3LastBlock)
  const account: string = yield getAccount()
  return account
}

// Wait for geth to be connected, geth ready, and get unlocked account
export function* getConnectedUnlockedAccount() {
  const account: string = yield call(getConnectedAccount)
  const success: boolean = yield call(unlockAccount, account)
  if (success) {
    return account
  } else {
    throw new Error(ErrorMessages.INCORRECT_PIN)
  }
}

// Stores account and private key in web3 keystore using web3.eth.personal
export function* addAccountToWeb3Keystore(key: string, currentAccount: string, pincode: string) {
  let account: string
  Logger.debug(TAG + '@addAccountToWeb3Keystore', `using key ${key} for account ${currentAccount}`)
  const zeroSyncMode = yield select(zeroSyncSelector)
  if (zeroSyncMode) {
    // web3.eth.personal is not accessible in zeroSync mode
    throw new Error('Cannot add account to Web3 keystore while in zeroSync mode')
  }
  try {
    // @ts-ignore
    account = yield call(web3.eth.personal.importRawKey, key, pincode)
    Logger.debug(
      TAG + '@addAccountToWeb3Keystore',
      `Successfully imported raw key for account ${account}`
    )
    yield put(setAccountInWeb3Keystore(account))
  } catch (e) {
    Logger.debug(TAG + '@addAccountToWeb3Keystore', 'Failed to import raw key')
    if (e.toString().includes('account already exists')) {
      account = currentAccount
      Logger.debug(TAG + '@addAccountToWeb3Keystore', 'Importing same account as current one')
    } else {
      Logger.error(TAG + '@addAccountToWeb3Keystore', 'Error importing raw key')
      throw e
    }
  }
  yield call(web3.eth.personal.unlockAccount, account, pincode, UNLOCK_DURATION)
  web3.eth.defaultAccount = account
  return account
}

export function* ensureAccountInWeb3Keystore() {
  const currentAccount: string = yield select(currentAccountSelector)
  if (currentAccount) {
    const accountInWeb3Keystore: string = yield select(currentAccountInWeb3KeystoreSelector)
    if (!accountInWeb3Keystore) {
      Logger.debug(
        TAG + '@ensureAccountInWeb3Keystore',
        'Importing account from private key to web3 keystore'
      )
      const pincode = yield call(getPincode)
      const privateKey: string = yield call(readPrivateKeyFromLocalDisk, currentAccount, pincode)
      const account: string = yield call(
        addAccountToWeb3Keystore,
        privateKey,
        currentAccount,
        pincode
      )
      return account
    } else if (accountInWeb3Keystore.toLowerCase() === currentAccount.toLowerCase()) {
      return accountInWeb3Keystore
    } else {
      throw new Error(
        `Account in web3 keystore (${accountInWeb3Keystore}) does not match current account (${currentAccount})`
      )
    }
  } else {
    throw new Error('Account not yet initialized')
  }
}

export function* switchToGethFromZeroSync() {
  try {
    yield call(initGethSaga)
    switchWeb3ProviderForSyncMode(false)

    // After switching off zeroSync mode, ensure key is stored in web3.personal
    // Note that this must happen after the sync mode is switched
    // as the web3.personal where the key is stored is not available in zeroSync mode
    yield call(ensureAccountInWeb3Keystore)

    // Ensure web3 is fully synced using new provider
    yield call(waitForWeb3Sync)
  } catch (e) {
    Logger.error(TAG + '@switchToGethFromZeroSync', 'Error switching to geth from zeroSync')
    yield put(showError(ErrorMessages.FAILED_TO_SWITCH_SYNC_MODES))
  }
}

export function* switchToZeroSyncFromGeth() {
  Logger.debug(TAG + 'Switching to zeroSync from geth..')
  try {
    yield call(stopGethIfInitialized)
    switchWeb3ProviderForSyncMode(true)
  } catch (e) {
    Logger.error(TAG + '@switchToGethFromZeroSync', 'Error switching to zeroSync from geth')
    yield put(showError(ErrorMessages.FAILED_TO_SWITCH_SYNC_MODES))
  }
}

export function* toggleZeroSyncMode(action: SetIsZeroSyncAction) {
  Logger.debug(TAG + '@toggleZeroSyncMode', ` to: ${action.zeroSyncMode}`)
  if (action.zeroSyncMode) {
    yield call(switchToZeroSyncFromGeth)
  } else {
    yield call(switchToGethFromZeroSync)
  }
  // Unlock account to ensure private keys are accessible in new mode
  const account = yield call(getConnectedUnlockedAccount)
  Logger.debug(
    TAG + '@toggleZeroSyncMode',
    `Switched to ${action.zeroSyncMode} and able to unlock account ${account}`
  )
}
export function* watchZeroSyncMode() {
  yield takeLatest(Actions.SET_IS_ZERO_SYNC, toggleZeroSyncMode)
}

export function* web3Saga() {
  yield spawn(watchZeroSyncMode)
}
