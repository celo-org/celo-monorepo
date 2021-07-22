import { mkdirSync, promises as fsPromises, readFileSync, unlinkSync, writeFileSync } from 'fs'
import path from 'path'
import { KeystoreBase } from './keystore-base'

export class FileKeystore extends KeystoreBase {
  /**
   * Implements keystore as a directory on disk
   * with files for keystore entries
   */
  private _keystoreDir: string

  /**
   * Creates (but does not overwrite existing) directory
   * for containing keystore entries.
   * @param keystoreDir Path to directory where keystore will be saved
   */
  constructor(keystoreDir: string) {
    super()
    this._keystoreDir = path.join(keystoreDir, 'keystore')
    // Does not overwrite existing directories
    mkdirSync(this._keystoreDir, { recursive: true })
  }

  /**
   * @returns List of file names (keystore entries) in the keystore
   */
  async getAllKeystoreNames(): Promise<string[]> {
    return fsPromises.readdir(this._keystoreDir)
  }

  /**
   * Saves keystore entries as a file in the keystore directory
   * @param keystoreName File name of keystore entry
   * @param keystore V3Keystore string entry
   */
  persistKeystore(keystoreName: string, keystore: string) {
    writeFileSync(path.join(this._keystoreDir, keystoreName), keystore)
  }

  /**
   * Gets contents of keystore entry file
   * @param keystoreName File name of keystore entry
   * @returns V3Keystore string entry
   */
  getRawKeystore(keystoreName: string): string {
    return readFileSync(path.join(this._keystoreDir, keystoreName)).toString()
  }

  /**
   * Deletes file keystore entry from directory
   * @param keystoreName File name of keystore entry to be removed
   */
  removeKeystore(keystoreName: string) {
    return unlinkSync(path.join(this._keystoreDir, keystoreName))
  }
}
