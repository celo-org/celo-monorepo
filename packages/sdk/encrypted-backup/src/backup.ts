import {
  Domain,
  domainHash,
  isKnownDomain,
  SequentialDelayDomain,
} from '@celo/phone-number-privacy-common/lib/domains'
import { Err, Ok, Result } from '@celo/base/lib/result'
import * as crypto from 'crypto'
import { BackupError, InvalidBackupError } from './errors'
import { deriveKey, decrypt, encrypt, KDFInfo } from './utils'

export interface Backup {
  /** AES-128-GCM encryption of the user's secret backup data. */
  encryptedData: Buffer

  /**
   * A randomly chosen 128-bit value. Ensures uniqueness of the password derived encryption key.
   * The nonce value is appended to the password for local key derivation. It is also used to derive
   * an authentication key to include in the ODIS Domain for domain seperation and to ensure quota
   * cannot be consumed by parties without access to the backup.
   */
  nonce: Buffer

  /**
   * ODIS Domain instance to be included in the query to ODIS for password hardening,
   *
   * @remarks Currently only SequentialDelayDomain is supported. Other ODIS domains intended for key
   * hardening may be supported in the future.
   */
  odisDomain?: SequentialDelayDomain

  /** RSA-OAEP-256 encryption of a randomly chosen 128-bit value, the fuse key.
   * The fuse key, if provided, is combined with the password in local key derivation. Encryption is
   * under the public key of the circuit breaker service. In order to get the fuseKey the client
   * will send this ciphertext to the circuit breaker service for decryption.
   */
  encryptedFuseKey?: Buffer

  /**
   * Version number for the backup feature. Used to facilitate backwards
   * compatibility in future backup feature upgrades.
   */
  version: string

  // TODO(victor): Fill in metadata.
  metadata: {}

  // TODO(victor): Fill in environment.
  environment: {}
}

export function createBackup(
  data: Buffer,
  password: Buffer,
  domain?: SequentialDelayDomain
): Backup<SequentialDelayDomain> {
  const nonce = crypto.randomBytes(16)
  let key = deriveKey(KDFInfo.PASSWORD, [password, nonce])

  // Generate a fuse key and mix it into the entropy of the key
  // TODO: Replace this with a proper circuit breaker impl.
  const fuseKey = crypto.randomBytes(16)
  key = deriveKey(KDFInfo.FUSE_KEY, [key, fuseKey])

  // TODO: Replace this with ODIS.
  if (domain !== undefined) {
    key = deriveKey(KDFInfo.ODIS_KEY_HARDENING, [key, domainHash(domain)])
  }

  // Encrypted and wrap the data in a Backup structure.
  return {
    encryptedData: encrypt(key, data),
    nonce,
    odisDomain: domain,
    encryptedFuseKey: fuseKey,
    version: '0.0.1',
    metadata: {},
    environment: {},
  }
}

export function openBackup(
  backup: Backup<SequentialDelayDomain>,
  password: Buffer
): Result<Buffer, BackupError> {
  let key = deriveKey(KDFInfo.PASSWORD, [password, backup.nonce])

  // TODO: Replace this with a proper circuit breaker impl.
  if (backup.encryptedFuseKey !== undefined) {
    key = deriveKey(KDFInfo.FUSE_KEY, [key, backup.encryptedFuseKey])
  }

  // TODO: Replace this with ODIS.
  if (backup.odisDomain !== undefined) {
    if (!isKnownDomain(backup.odisDomain)) {
      return Err(new InvalidBackupError())
    }

    key = deriveKey(KDFInfo.ODIS_KEY_HARDENING, [key, domainHash(backup.odisDomain)])
  }

  return Ok(decrypt(key, backup.encryptedData))
}
