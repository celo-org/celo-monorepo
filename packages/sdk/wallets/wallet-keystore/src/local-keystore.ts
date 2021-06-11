// import * as ethUtil from 'ethereumjs-util'
// import { scrypt } from 'crypto'
import { ensureLeading0x } from '@celo/utils/lib/address'
import { LocalWallet } from '@celo/wallet-local'
import Wallet from 'ethereumjs-wallet'
import { mkdirSync, promises as fsPromises, readFileSync, writeFileSync } from 'fs'
import path from 'path'

/**
 * Stores and provides access to private keys.
 */

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

  async listKeystoreAccounts(): Promise<string[]> {
    // TODO fix error handling
    return (await fsPromises.readdir(this._keystoreDir)).map((file) =>
      LocalKeystore.getAddressFromFile(path.join(this._keystoreDir, file))
    )
  }

  // TODO restructure/reorganize this
  async importPrivateKey(privateKey: string, password: string) {
    const key = Buffer.from(privateKey, 'hex')
    const wallet = Wallet.fromPrivateKey(key)
    const keystore = await wallet.toV3String(password)
    const fileName = wallet.getV3Filename(Date.now())
    // TODO handle if we add the same account twice -- don't overwrite and only allow one?
    writeFileSync(path.join(this._keystoreDir, fileName), keystore)
    // TODO take in an interface for writing to file storage?
    // That could then be switched out for browser/file system/mock test writer/etc.
  }

  static async getPrivateKeyFromFile(keystoreFile: string, password: string): Promise<string> {
    const keystore = readFileSync(keystoreFile).toString()
    const pkTest = (await Wallet.fromV3(keystore, password)).getPrivateKeyString()
    return pkTest
  }

  // TODO modify this as needed to not require the user to pass in the entire
  static getAddressFromFile(keystoreFile: string): string {
    // TODO is this possible without actually decrypting the file?
    const rawKeystore = readFileSync(keystoreFile).toString()
    try {
      const address = JSON.parse(rawKeystore).address
      return ensureLeading0x(address)
    } catch (e) {
      console.log(e)
      throw new Error('Unexpected keystore file structure')
    }
  }
}

// TODO maybe even separate this out into its own file + tests
export class KeystoreWalletWrapper {
  // TODO make this more permissive?
  private _localKeystore: LocalKeystore
  private _localWallet: LocalWallet

  constructor(keystoreDir?: string) {
    this._localKeystore = new LocalKeystore(keystoreDir)
    this._localWallet = new LocalWallet()
  }

  async importPrivateKey(privateKey: string, password: string) {
    await this._localKeystore.importPrivateKey(privateKey, password)
    // // TODO do we also want to add the pk signer right here?
    this._localWallet.addAccount(privateKey)
  }

  getLocalWallet(): LocalWallet {
    return this._localWallet
  }
  // DO NOT DELETE YET
  // TODO password default just for initial dev/testing
  // async addAccountFromKeystore(account: string, password: string = 'c#gc6s&UTBO6@nXzx1!U') {
  //   // TODO get the available accounts in the keystore
  //   // if keystore account does not match (what about duplicated??) --> how does geth manage this?
  //   const testKeystoreFile = 'eth-keystore-test'

  //   // FOR now just for compiler issues
  //   console.log(account)
  //   // TODO unlock the actual
  //   // TODO modify -- Wrapper should not interact with the actual File names !!!!
  //   const privateKey = await this._localKeystore.getPrivateKeyFromFile(testKeystoreFile, password)
  //   this._localWallet.addAccount(privateKey)
  // }
}
