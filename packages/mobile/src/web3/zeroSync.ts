import { deriveCEK } from '@celo/utils/src/commentEncryption'
import { getAccountAddressFromPrivateKey } from '@celo/walletkit'
import * as Crypto from 'crypto'
import * as RNFS from 'react-native-fs'
import { call, put, select } from 'redux-saga/effects'
import { getPincode } from 'src/account/saga'
import Logger from 'src/utils/Logger'
import { setPrivateCommentKey } from 'src/web3/actions'
import { addAccountToWeb3Keystore } from 'src/web3/saga'
import { currentAccountInWeb3KeystoreSelector, currentAccountSelector } from 'src/web3/selectors'

const TAG = 'web3/zeroSync'

export function* ensureAccountInWeb3Keystore() {
  const currentAccount = yield select(currentAccountSelector)
  if (currentAccount) {
    const accountInWeb3Keystore = yield select(currentAccountInWeb3KeystoreSelector)
    const pincode = yield call(getPincode)
    const privateKey: string = yield readPrivateKeyFromLocalDisk(currentAccount, pincode)

    if (!accountInWeb3Keystore) {
      // If account not in keystore, this is the first time running geth (started in zeroSync)
      Logger.debug(
        TAG + '@ensureAccountInWeb3Keystore',
        'Importing account from private key to web3 keystore'
      )
      yield call(addAccountToWeb3Keystore, privateKey, currentAccount, pincode)
      return true
    } else {
      // If account is in keystore, ensure it matches the private key saved locally
      ensureAddressAndKeyMatch(accountInWeb3Keystore, privateKey)
      return true
    }
  } else {
    throw new Error('Account not yet initialized')
  }
}

export function* ensureAccountSavedLocally(account: string) {
  const filePath = getPrivateKeyFilePath(account)
  Logger.debug('ensureAccountSavedLocally', `Reading encrypted private key from ${filePath}`)
  const fileExists: boolean = yield call(RNFS.exists, filePath)
  if (fileExists) {
    const hexEncodedEncryptedData: string = yield call(RNFS.readFile, filePath)
    Logger.debug(
      'ensureAccountSavedLocally',
      `Found encrypted private key: ${hexEncodedEncryptedData}`
    )
    const pincode = yield call(getPincode)
    yield call(readPrivateKeyFromLocalDisk, account, pincode)
    return true
  } else {
    throw new Error(`Could not find private key on local disk at path ${filePath}`)
  }
}

export function* assignDataKeyFromPrivateKey(key: string) {
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

export async function savePrivateKeyToLocalDisk(
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
