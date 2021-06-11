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

export enum ErrorMessages {
  KEYSTORE_ENTRY_EXISTS = 'Existing encrypted keystore for address',
  UNKNOWN_FILE_STRUCTURE = 'Unexpected keystore file structure',
}

export interface KeystoreIO {
  getAddressMap: () => Promise<Record<string, any>>
  // TODO could make all of these either keystoreName OR address
  persistKeystore: (keystoreName: string, keystore: string) => void
  getRawKeystore: (keystoreName: string) => string
  removeKeystore: (keystoreName: string) => void
}

// // TODO
export class KeystoreFileIO implements KeystoreIO {
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

  // getRawKeystoreDir(): string {
  //   return this._keystoreDir
  // }

  /**
   * Map addresses to their respective keystore files
   */
  async getAddressMap(): Promise<Record<string, string>> {
    // Don't store this to minimize race conditions (file is deleted/added manually)
    const addressToFile: Record<string, string> = {}
    ;(await fsPromises.readdir(this._keystoreDir)).map(
      (file) =>
        (addressToFile[
          KeystoreFileIO.getAddressFromFile(path.join(this._keystoreDir, file))
        ] = file)
    )
    return addressToFile
  }

  // TODO --> maybe something like getRawKeystoreNamesContents or getRawKeystoresIterable
  // i.e. something to allow you to iterate through the names, keystores of the IO type?

  // TODO revisit this -- is there a way for the `rawKeystore.address` knowledge to stay within the Keystore?
  // TODO could even extract this piece out --> raw keystore --> address
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

  persistKeystore(keystoreName: string, keystore: string) {
    writeFileSync(path.join(this._keystoreDir, keystoreName), keystore)
  }

  getRawKeystore(keystoreName: string): string {
    return readFileSync(path.join(this._keystoreDir, keystoreName)).toString()
  }

  removeKeystore(keystoreName: string) {
    // TODO
    console.log(keystoreName)
  }
}

export class Keystore {
  /**
   * Takes in a string private key and produces V3Keystore strings
   * This class should contain all knowledge/logic of the V3Keystore strings
   */
  private _keystoreIO: KeystoreIO

  // TODO for now -- later, create an IO interface that this could take in?
  constructor(keystoreIO: KeystoreIO) {
    // TODO Figure out how this is done for celocli files, etc.?
    this._keystoreIO = keystoreIO
  }

  async listKeystoreAddresses(): Promise<string[]> {
    return Object.keys(await this._keystoreIO.getAddressMap())
  }

  // TODO restructure/reorganize this
  async importPrivateKey(privateKey: string, passphrase: string) {
    // Only allow for new private keys to be imported into the keystore
    const address = normalizeAddressWith0x(privateKeyToAddress(privateKey))
    if ((await this.listKeystoreAddresses()).includes(address)) {
      throw new Error(ErrorMessages.KEYSTORE_ENTRY_EXISTS)
    }

    const key = Buffer.from(privateKey, 'hex')
    const wallet = Wallet.fromPrivateKey(key)
    const keystore = await wallet.toV3String(passphrase)
    const keystoreName = wallet.getV3Filename(Date.now())

    this._keystoreIO.persistKeystore(keystoreName, keystore)
  }

  // async getPrivateKeyFromV3String(rawString: string, passphrase: string): Promise<string> {
  //   return (await Wallet.fromV3(rawString, passphrase)).getPrivateKeyString()
  // }
  // // alt-version
  // async getPrivateKeyFromKeystore(keystoreName: string, passphrase: string): Promise<string> {
  //   const rawKeystore = this._keystoreIO.getRawKeystore(keystoreName)
  //   return (await Wallet.fromV3(rawKeystore, passphrase)).getPrivateKeyString()
  // }

  async getKeystoreName(address: string): Promise<string> {
    return (await this._keystoreIO.getAddressMap())[address]
  }

  // TODO: if need be, can make it address OR name passed in
  async getPrivateKey(address: string, passphrase: string): Promise<string> {
    const rawKeystore = this._keystoreIO.getRawKeystore(await this.getKeystoreName(address))
    return (await Wallet.fromV3(rawKeystore, passphrase)).getPrivateKeyString()
  }

  async changeKeystorePassphrase(address: string, oldPassphrase: string, newPassphrase: string) {
    const keystoreName = await this.getKeystoreName(address)
    const rawKeystore = this._keystoreIO.getRawKeystore(keystoreName)
    const newKeystore = await (await Wallet.fromV3(rawKeystore, oldPassphrase)).toV3String(
      newPassphrase
    )
    this._keystoreIO.persistKeystore(keystoreName, newKeystore)
  }

  async removeKeystore(address: string) {
    this._keystoreIO.removeKeystore(await this.getKeystoreName(address))
  }
}

// something like???:
// FileKeystore<FileIO> implements Keystore ???
// TODO --> look at how this is done within Signer

export class KeystoreWalletWrapper {
  // TODO make this more permissive?
  private _keystore: Keystore
  private _localWallet: LocalWallet

  constructor(keystore: Keystore) {
    this._keystore = keystore
    this._localWallet = new LocalWallet()
  }

  async importPrivateKey(privateKey: string, passphrase: string) {
    await this._keystore.importPrivateKey(privateKey, passphrase)
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
    this._localWallet.addAccount(await this._keystore.getPrivateKey(address, passphrase))
  }

  async lockAccount(address: string) {
    this._localWallet.removeAccount(address)
  }
}
