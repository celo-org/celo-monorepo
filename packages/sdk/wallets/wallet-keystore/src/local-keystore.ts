import {
  ensureLeading0x,
  normalizeAddressWith0x,
  privateKeyToAddress,
} from '@celo/utils/lib/address'
import { LocalWallet } from '@celo/wallet-local'
import Wallet from 'ethereumjs-wallet'
import { mkdirSync, promises as fsPromises, readFileSync, unlinkSync, writeFileSync } from 'fs'
import path from 'path'

export enum ErrorMessages {
  KEYSTORE_ENTRY_EXISTS = 'Existing encrypted keystore for address',
  NO_MATCHING_ENTRY = 'Keystore entry not found for address',
  UNKNOWN_FILE_STRUCTURE = 'Unexpected keystore file structure',
}

export abstract class KeystoreBase {
  /**
   * Handles encrytion and transformation between private keys <-> V3Keystore strings
   */

  // TODO docstrings

  // Must be implemented by subclass
  // TODO could make all of these either keystoreName OR address
  abstract persistKeystore(keystoreName: string, keystore: string): void
  abstract getRawKeystore(keystoreName: string): string
  abstract getAllKeystoreNames(): Promise<string[]>
  abstract removeKeystore(keystoreName: string): void

  getAddress(keystoreName: string): string {
    const rawKeystore = this.getRawKeystore(keystoreName)
    try {
      const address = JSON.parse(rawKeystore).address
      return ensureLeading0x(address)
    } catch (e) {
      console.log(e)
      throw new Error(ErrorMessages.UNKNOWN_FILE_STRUCTURE)
    }
  }

  async listKeystoreAddresses(): Promise<string[]> {
    return Object.keys(await this.getAddressMap())
  }

  // Map addresses to their respective keystore entries (names)
  async getAddressMap(): Promise<Record<string, string>> {
    // Don't store this to minimize race conditions (file is deleted/added manually)
    const addressToFile: Record<string, string> = {}
    ;(await this.getAllKeystoreNames()).map((file) => (addressToFile[this.getAddress(file)] = file))
    return addressToFile
  }

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

    this.persistKeystore(keystoreName, keystore)
  }

  async getKeystoreName(address: string): Promise<string> {
    const keystoreName = (await this.getAddressMap())[normalizeAddressWith0x(address)]
    if (keystoreName === undefined) {
      throw new Error(ErrorMessages.NO_MATCHING_ENTRY)
    }
    return keystoreName
  }

  async getPrivateKey(address: string, passphrase: string): Promise<string> {
    const rawKeystore = this.getRawKeystore(await this.getKeystoreName(address))
    // TODO do we want to trim leading 0x here? what is the best practice here?
    return (await Wallet.fromV3(rawKeystore, passphrase)).getPrivateKeyString()
  }

  async changeKeystorePassphrase(address: string, oldPassphrase: string, newPassphrase: string) {
    const keystoreName = await this.getKeystoreName(address)
    const rawKeystore = this.getRawKeystore(keystoreName)
    const newKeystore = await (await Wallet.fromV3(rawKeystore, oldPassphrase)).toV3String(
      newPassphrase
    )
    this.persistKeystore(keystoreName, newKeystore)
  }
}

export class FileKeystore extends KeystoreBase {
  private _keystoreDir: string

  constructor(keystoreDir: string) {
    super()
    this._keystoreDir = path.join(keystoreDir, 'keystore')
    // Does not overwrite existing directories
    const createdDir = mkdirSync(this._keystoreDir, { recursive: true })
    if (createdDir) {
      console.log(`Keystore directory created at ${createdDir}`)
    }
  }

  async getAllKeystoreNames(): Promise<string[]> {
    return fsPromises.readdir(this._keystoreDir)
  }

  persistKeystore(keystoreName: string, keystore: string) {
    writeFileSync(path.join(this._keystoreDir, keystoreName), keystore)
  }

  getRawKeystore(keystoreName: string): string {
    return readFileSync(path.join(this._keystoreDir, keystoreName)).toString()
  }

  removeKeystore(keystoreName: string) {
    // TODO test
    return unlinkSync(path.join(this._keystoreDir, keystoreName))
  }
}

/**
 * Used for mocking keystore operations
 */
export class InMemoryKeystore extends KeystoreBase {
  private _storage: Record<string, string> = {}

  persistKeystore(keystoreName: string, keystore: string) {
    this._storage[keystoreName] = keystore
  }

  getRawKeystore(keystoreName: string): string {
    return this._storage[keystoreName]
  }

  getAllKeystoreNames(): Promise<string[]> {
    return new Promise((resolve) => resolve(Object.keys(this._storage)))
  }

  removeKeystore(keystoreName: string) {
    delete this._storage[keystoreName]
  }
}

/**
 * Convenience wrapper of the LocalWallet to connect to a keystore
 */
export class KeystoreWalletWrapper {
  private _keystore: KeystoreBase
  private _localWallet: LocalWallet

  constructor(keystore: KeystoreBase) {
    this._keystore = keystore
    this._localWallet = new LocalWallet()
  }

  async importPrivateKey(privateKey: string, passphrase: string) {
    await this._keystore.importPrivateKey(privateKey, passphrase)
    this._localWallet.addAccount(privateKey)
  }

  getLocalWallet(): LocalWallet {
    return this._localWallet
  }

  getKeystore(): KeystoreBase {
    return this._keystore
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

// const testKeystoreWalletWrapper = new KeystoreWalletWrapper(new FileKeystore())
