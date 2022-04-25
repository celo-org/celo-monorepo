import {
  ensureLeading0x,
  normalizeAddressWith0x,
  privateKeyToAddress,
} from '@celo/utils/lib/address'
import Wallet from 'ethereumjs-wallet'

export enum ErrorMessages {
  KEYSTORE_ENTRY_EXISTS = 'Existing encrypted keystore for address',
  NO_MATCHING_ENTRY = 'Keystore entry not found for address',
  UNKNOWN_STRUCTURE = 'Unexpected keystore entry structure',
}

// TODO refine language around keystore entry / keystore / keystore container ...?
export abstract class KeystoreBase {
  /**
   * Handles encrytion and transformation between private keys <-> V3Keystore strings
   * See https://github.com/ethereum/wiki/wiki/Web3-Secret-Storage-Definition
   * for more details on conventions around Web3 Secret Storage.
   */

  /**
   * Saves encrypted keystore entry (i.e. to disk, database, ...). Must be implemented by subclass.
   * @param keystoreName Name of keystore entry to be saved
   * @param keystore encrypted V3Keystore string entry
   */
  abstract persistKeystore(keystoreName: string, keystore: string): void

  /**
   * Returns raw encrypted keystore entry string by name
   * @param keystoreName Name of keystore entry to retrieve
   */
  abstract getRawKeystore(keystoreName: string): string

  /**
   * Gets a list of the names of each entry in the keystore
   */
  abstract getAllKeystoreNames(): Promise<string[]>

  /**
   * Removes keystore entry from keystore permanently
   * @param keystoreName Name of keystore entry to remove
   */
  abstract removeKeystore(keystoreName: string): void

  /**
   * Gets the address corresponding to a particular keystore entry
   * @param keystoreName Name of keystore entry belonging to the address
   * @returns Account address
   */
  getAddress(keystoreName: string): string {
    const rawKeystore = this.getRawKeystore(keystoreName)
    try {
      const address = JSON.parse(rawKeystore).address
      return ensureLeading0x(address)
    } catch (e) {
      throw new Error(ErrorMessages.UNKNOWN_STRUCTURE)
    }
  }
  /**
   * Gets a list of all account addresses in the keystore
   * @returns List of account address strings
   */
  async listKeystoreAddresses(): Promise<string[]> {
    return Object.keys(await this.getAddressMap())
  }

  /**
   * Maps account addresses to their respective keystore entries (names)
   * @returns Record with account addresses as keys, keystore entry names as values
   */
  async getAddressMap(): Promise<Record<string, string>> {
    // Don't store this to minimize race conditions (file is deleted/added manually)
    const addressToFile: Record<string, string> = {}
    ;(await this.getAllKeystoreNames()).forEach(
      (file) => (addressToFile[this.getAddress(file)] = file)
    )
    return addressToFile
  }

  /**
   * Encrypts and stores a private key as a new keystore entry
   * @param privateKey Private key to encrypted
   * @param passphrase Secret string to encrypt private key
   */
  async importPrivateKey(privateKey: string, passphrase: string) {
    // Duplicate entries for the same private key are not permitted
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

  /**
   * Gets name of keystore entry corresponding to an address
   * @param address Account address
   * @returns Name of corresponding keystore entry
   */
  async getKeystoreName(address: string): Promise<string> {
    const keystoreName = (await this.getAddressMap())[normalizeAddressWith0x(address)]
    if (keystoreName === undefined) {
      throw new Error(ErrorMessages.NO_MATCHING_ENTRY)
    }
    return keystoreName
  }

  /**
   * Gets decrypted (plaintext) private key for an account address
   * @param address Account address
   * @param passphrase Secret phrase used to encrypt the private key
   * @returns
   */
  async getPrivateKey(address: string, passphrase: string): Promise<string> {
    const rawKeystore = this.getRawKeystore(await this.getKeystoreName(address))
    // TODO do we want to trim leading 0x here? what is the best practice here?
    return (await Wallet.fromV3(rawKeystore, passphrase)).getPrivateKeyString()
  }

  /**
   * Change secret phrase used to encrypt the private key of an address
   * @param address Account address
   * @param oldPassphrase Secret phrase used to encrypt the private key
   * @param newPassphrase New secret phrase to re-encrypt the private key
   */
  async changeKeystorePassphrase(address: string, oldPassphrase: string, newPassphrase: string) {
    const keystoreName = await this.getKeystoreName(address)
    const rawKeystore = this.getRawKeystore(keystoreName)
    const newKeystore = await (
      await Wallet.fromV3(rawKeystore, oldPassphrase)
    ).toV3String(newPassphrase)
    this.persistKeystore(keystoreName, newKeystore)
  }

  /**
   * Permanently removes keystore entry from keystore
   * @param address Account address of keystore to be deleted
   */
  async deleteKeystore(address: string) {
    this.removeKeystore(await this.getKeystoreName(address))
  }
}
