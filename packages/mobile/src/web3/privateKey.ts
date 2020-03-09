import * as Crypto from 'crypto'
import * as RNFS from 'react-native-fs'
import Logger from 'src/utils/Logger'
import { getAccountAddressFromPrivateKey } from 'src/web3/utils'

const TAG = 'web3/privateKey'

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

export function savePrivateKeyToLocalDisk(
  account: string,
  privateKey: string,
  encryptionPassword: string
) {
  ensureAddressAndKeyMatch(account, privateKey)
  const filePath = getPrivateKeyFilePath(account)
  const plainTextData = privateKey
  const encryptedData: Buffer = getEncryptedData(plainTextData, encryptionPassword)
  Logger.debug('savePrivateKeyToLocalDisk', `Writing encrypted private key to ${filePath}`)
  return RNFS.writeFile(getPrivateKeyFilePath(account), encryptedData.toString('hex'))
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
