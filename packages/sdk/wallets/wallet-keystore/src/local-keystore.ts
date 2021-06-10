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
// TODO convert into an interface (then have filesystem keystore, browser keystore, etc.)
export class LocalKeystore {
  /**
   * Takes in a string private key and saves this as an encrypted keystore file
   */

  private _keystoreDir: string

  makeDefaultKeystoreDir(): string {
    // TODO Figure out how this is done for celocli files, etc.?

    const defaultDir = path.join(
      '/Users/eelanagaraj/celo/celo-monorepo/packages/sdk/wallets/wallet-keystore/test-keystore-dir',
      'keystore'
    )
    mkdirSync(defaultDir, { recursive: true })
    return defaultDir
  }

  constructor(keystoreDir?: string) {
    this._keystoreDir = keystoreDir ? keystoreDir : this.makeDefaultKeystoreDir()
  }

  // TODO restructure/reorganize this
  static async importPrivateKey(
    privateKey: string,
    password: string,
    keystoreDir = '/Users/eelanagaraj/celo/celo-monorepo/packages/sdk/wallets/wallet-keystore/test-keystore-dir'
  ) {
    const key = Buffer.from(privateKey, 'hex')
    const wallet = Wallet.fromPrivateKey(key)
    const keystore = await wallet.toV3String(password)
    const fileName = wallet.getV3Filename(Date.now())
    // TODO handle if we add the same account twice -- don't overwrite and only allow one?
    writeFileSync(path.join(keystoreDir, fileName), keystore)
    // TODO take in an interface for writing to file storage?
    // That could then in theory be switched out for browser/file system/mock test writer/etc.
  }

  static async getPrivateKeyFromFile(keystoreFile: string, password: string): Promise<string> {
    const keystore = readFileSync(keystoreFile).toString()
    const pkTest = (await Wallet.fromV3(keystore, password)).getPrivateKeyString()
    console.log(pkTest)
    return pkTest
  }

  static getAddressFromFile(keystoreFile: string): string {
    // TODO is this possible without actually decrypting the file?
    const rawKeystore = readFileSync(keystoreFile).toString()
    try {
      const address = JSON.parse(rawKeystore).address
      // console.log(JSON.parse(rawKeystore))
      // console.log(address)
      return ensureLeading0x(address)
    } catch (e) {
      console.log(e)
      throw new Error('Unexpected keystore file structure')
    }
  }

  // async getPrivateKey(account: string, keystoreDir: string): Promise<string> {
  //   // Should check keystore file and try to find respective account
  //   // just to not delete this import for now
  //   console.log(keystoreDir)
  //   // console.log(scrypt)
  //   console.log(account)
  //   const key = Buffer.from(
  //     '477651e4d34628765680270958b2e4f4724c505ce2443939ac5363b8a2b129ba',
  //     'hex'
  //   )
  //   const testPassword = 'asdf08-io;k/mü idfu909!p890A*&8'
  //   const wallet = Wallet.fromPrivateKey(key)
  //   const v3 = await wallet.toV3String(testPassword)
  //   // const v3Obj = await wallet.toV3(testPassword)
  //   const timestamp = Date.now()
  //   console.log(timestamp)
  //   console.log(wallet.getV3Filename(timestamp))
  //   // TODO check whether it's critical that these don't have the BLS signature stuff stored as well or if this is a security (or other) risk
  //   console.log(v3)
  //   const pkTest = (await Wallet.fromV3(v3, testPassword)).getPrivateKeyString()
  //   console.log(pkTest)
  //   return v3
  // }
}

export class KeystoreWalletWrapper {
  private _keystoreDir: string
  // TODO make this more permissive?
  private _localWallet: LocalWallet

  makeDefaultKeystoreDir(): string {
    // TODO Figure out how this is done for celocli files, etc.?

    const defaultDir = path.join(
      '/Users/eelanagaraj/celo/celo-monorepo/packages/sdk/wallets/wallet-keystore/test-keystore-dir',
      'keystore'
    )
    mkdirSync(defaultDir, { recursive: true })
    return defaultDir
  }

  constructor(keystoreDir?: string) {
    this._keystoreDir = keystoreDir ? keystoreDir : this.makeDefaultKeystoreDir()
    this._localWallet = new LocalWallet()
  }

  async importPrivateKey(privateKey: string, password: string) {
    await LocalKeystore.importPrivateKey(privateKey, password, this._keystoreDir)
    // // TODO do we also want to add the pk signer right here?
    // this._localWallet.addAccount(privateKey)
  }

  // TODO: distinction between keystore accounts and unlocked wallet accounts?
  async listKeystoreAccounts(): Promise<string[]> {
    // TODO fix error handling
    return (await fsPromises.readdir(this._keystoreDir)).map((file) =>
      LocalKeystore.getAddressFromFile(path.join(this._keystoreDir, file))
    )
  }

  // TODO password default just for initial dev/testing
  async addAccountFromKeystore(account: string, password: string = 'c#gc6s&UTBO6@nXzx1!U') {
    // TODO get the available accounts in the keystore
    // if keystore account does not match (what about duplicated??) --> how does geth manage this?
    const testKeystoreFile = 'eth-keystore-test'

    // FOR now just for compiler issues
    console.log(account)
    // TODO unlock the actual
    const privateKey = await LocalKeystore.getPrivateKeyFromFile(
      path.join(this._keystoreDir, testKeystoreFile),
      password
    )
    this._localWallet.addAccount(privateKey)
  }
}
