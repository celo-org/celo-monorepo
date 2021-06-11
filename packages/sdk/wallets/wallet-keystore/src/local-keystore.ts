// import * as ethUtil from 'ethereumjs-util'
// import { scrypt } from 'crypto'
import {
  ensureLeading0x,
  normalizeAddressWith0x,
  privateKeyToAddress,
} from '@celo/utils/lib/address'
import { LocalWallet } from '@celo/wallet-local'
import Wallet from 'ethereumjs-wallet'
import { mkdirSync, promises as fsPromises, readFileSync, writeFileSync } from 'fs'
import path from 'path'

/**
 * Stores and provides access to private keys.
 */

// TODO maybe this is overkill...get rid of it if need be
export enum ErrorMessages {
  ADDRESS_FILE_EXISTS = 'Existing encrypted keystore file for address',
  UNKNOWN_FILE_STRUCTURE = 'Unexpected keystore file structure',
}

// TODO creating an interface for this as well (then have filesystem keystore, browser keystore, etc.)
export class LocalKeystore {
  /**
   * Takes in a string private key and saves this as an encrypted keystore file
   */

  private _keystoreDir: string

  constructor(keystoreDir?: string) {
    // TODO Figure out how this is done for celocli files, etc.?
    this._keystoreDir = keystoreDir
      ? keystoreDir
      : path.join(
          '/Users/eelanagaraj/celo/celo-monorepo/packages/sdk/wallets/wallet-keystore/test-keystore-dir',
          'keystore'
        )
    // TODO revisit if it makes sense to only make the directory if default...
    mkdirSync(this._keystoreDir, { recursive: true })
  }

  getKeystoreDir(): string {
    return this._keystoreDir
  }

  async getAddressToFileMap(): Promise<Record<string, string>> {
    // Don't store this to minimize race conditions (file is deleted/added manually)
    const addressToFile: Record<string, string> = {}
    ;(await fsPromises.readdir(this._keystoreDir)).map(
      (file) =>
        (addressToFile[LocalKeystore.getAddressFromFile(path.join(this._keystoreDir, file))] = file)
    )
    return addressToFile
  }

  async listKeystoreAddresses(): Promise<string[]> {
    return Object.keys(await this.getAddressToFileMap())
  }

  // TODO modify this as needed to not require the user to pass in the entire path --> or make this just a pure helper function
  static getAddressFromFile(keystoreFilePath: string): string {
    const rawKeystore = readFileSync(keystoreFilePath).toString()
    try {
      const address = JSON.parse(rawKeystore).address
      return ensureLeading0x(address)
    } catch (e) {
      console.log(e)
      throw new Error(ErrorMessages.UNKNOWN_FILE_STRUCTURE)
    }
  }

  // TODO restructure/reorganize this
  async importPrivateKey(privateKey: string, passphrase: string) {
    // Only allow for new private keys to be imported into the keystore
    const address = normalizeAddressWith0x(privateKeyToAddress(privateKey))
    if ((await this.listKeystoreAddresses()).includes(address)) {
      throw new Error(ErrorMessages.ADDRESS_FILE_EXISTS)
    }

    const key = Buffer.from(privateKey, 'hex')
    const wallet = Wallet.fromPrivateKey(key)
    const keystore = await wallet.toV3String(passphrase)
    const fileName = wallet.getV3Filename(Date.now())
    writeFileSync(path.join(this._keystoreDir, fileName), keystore)
    // TODO take in an interface for writing to file storage?
    // That could then be switched out for browser/file system/mock test writer/etc.
  }

  async getPrivateKeyFromAddress(address: string, passphrase: string): Promise<string> {
    const addressToFileMap = await this.getAddressToFileMap()
    return LocalKeystore.getPrivateKeyFromFile(
      path.join(this._keystoreDir, addressToFileMap[address]),
      passphrase
    )
  }

  // TODO maybe this is not needed at all, or a helper that is not part of this class
  // TODO !! or change to `getPrivateKeyFromString` and then have the upper file do the file reading and passing in
  static async getPrivateKeyFromFile(
    keystoreFilePath: string,
    passphrase: string
  ): Promise<string> {
    const keystore = readFileSync(keystoreFilePath).toString()
    const pkTest = (await Wallet.fromV3(keystore, passphrase)).getPrivateKeyString()
    return pkTest
  }

  async changeKeystorePassphrase(address: string, oldPassphrase: string, newPassphrase: string) {
    // get proper filename for address
    const addressToFileMap = await this.getAddressToFileMap()
    const filePath = path.join(this._keystoreDir, addressToFileMap[address])
    // TODO modularize this more -- i.e. extract `Wallet` impl details from importPrivateKey + getPrivateKeyFromFile??
    const newKeystore = await (
      await Wallet.fromV3(readFileSync(filePath).toString(), oldPassphrase)
    ).toV3String(newPassphrase)
    writeFileSync(filePath, newKeystore)
  }

  // // TODO do we want to require passphrase to delete? at least confirms that user really wants to delete this? they can ofc always manually delete this...
  // removeKeystoreFile(keystoreFilePath: string, passphrase: string) {
  //   console.log(keystoreFilePath)
  //   console.log(passphrase)
  // }
}

// TODO maybe even separate this out into its own file + tests
// TODO can make this its own wallet as well that uses the LocalWallet...?
// TODO this could then implement the UnlockableWallet interface???
export class KeystoreWalletWrapper {
  // TODO make this more permissive?
  private _localKeystore: LocalKeystore
  private _localWallet: LocalWallet

  constructor(keystoreDir?: string) {
    this._localKeystore = new LocalKeystore(keystoreDir)
    this._localWallet = new LocalWallet()
  }

  async importPrivateKey(privateKey: string, passphrase: string) {
    await this._localKeystore.importPrivateKey(privateKey, passphrase)
    // // TODO do we also want to add the pk signer right here?
    this._localWallet.addAccount(privateKey)
  }

  getLocalWallet(): LocalWallet {
    return this._localWallet
  }

  async unlockAccount(address: string, passphrase: string) {
    // Unlock and add account to internal LocalWallet

    // TODO duration...seems non-trivial; as a default make this manual?
    // OR if this is a wallet itself, have a setting for permanent unlock or require passphrase for each tx
    this._localWallet.addAccount(
      await this._localKeystore.getPrivateKeyFromAddress(address, passphrase)
    )
  }

  async lockAccount(address: string) {
    this._localWallet.removeAccount(address)
  }
}
