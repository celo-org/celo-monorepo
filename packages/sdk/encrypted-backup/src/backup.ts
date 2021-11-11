import { eqAddress } from '@celo/base/lib/address'
import { Err, Ok, Result } from '@celo/base/lib/result'
import { ServiceContext as OdisEnvironment } from '@celo/identity/lib/odis/query'
import { SequentialDelayDomain } from '@celo/phone-number-privacy-common/lib/domains'
import * as crypto from 'crypto'
import { HardeningConfig } from './config'
import { BackupError, InvalidBackupError } from './errors'
import { buildOdisDomain, odisQueryAuthorizer, odisHardenKey } from './odis'
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
  environment: OdisEnvironment & {}
}

// TODO(victor): Add io-ts types for these and embed the value in th Backup struct.
export interface CreateBackupArgs {
  data: Buffer
  password: Buffer
  hardening: HardeningConfig
  odisEnvironment: OdisEnvironment
}

// TODO(victor): Add createPinEncryptedBackup function as a helpful wrapper.

export async function createBackup({
  data,
  password,
  hardening,
  odisEnvironment,
}: CreateBackupArgs): Promise<Result<Backup, BackupError>> {
  const nonce = crypto.randomBytes(16)
  let key = deriveKey(KDFInfo.PASSWORD, [password, nonce])

  // Derive the query authorizer wallet and address from the nonce, then build the ODIS domain.
  // This domain acts as a binding rate limit configuration for ODIS, enforcing that the client must
  // know the backup nonce, and can only make the given number of queries.
  const authorizer = odisQueryAuthorizer(nonce)
  const domain = buildOdisDomain(hardening, authorizer.address)

  // Generate a fuse key and mix it into the entropy of the key
  // TODO: Replace this with a proper circuit breaker impl.
  const fuseKey = crypto.randomBytes(16)
  key = deriveKey(KDFInfo.FUSE_KEY, [key, fuseKey])

  // Harden the key with the output of a rate limited ODIS POPRF function.
  if (domain !== undefined) {
    const odisHardenedKey = await odisHardenKey(key, domain, odisEnvironment, authorizer.wallet)
    if (!odisHardenedKey.ok) {
      return odisHardenedKey
    }
    key = odisHardenedKey.result
  }

  // Encrypted and wrap the data in a Backup structure.
  return Ok({
    encryptedData: encrypt(key, data),
    nonce,
    odisDomain: domain,
    encryptedFuseKey: fuseKey,
    version: '0.0.1',
    metadata: {},
    environment: odisEnvironment,
  })
}

export interface OpenBackupArgs {
  backup: Backup
  password: Buffer
}

export async function openBackup({
  backup,
  password,
}: OpenBackupArgs): Promise<Result<Buffer, BackupError>> {
  let key = deriveKey(KDFInfo.PASSWORD, [password, backup.nonce])

  // TODO: Replace this with a proper circuit breaker impl.
  if (backup.encryptedFuseKey !== undefined) {
    key = deriveKey(KDFInfo.FUSE_KEY, [key, backup.encryptedFuseKey])
  }

  // Harden the key with the output of a rate limited ODIS POPRF function.
  if (backup.odisDomain !== undefined) {
    const domain = backup.odisDomain

    // Derive the query authorizer wallet and address from the nonce.
    // If the ODIS domain is authenticated, the authorizer address should match the domain.
    const authorizer = odisQueryAuthorizer(backup.nonce)
    if (domain.address.defined && !eqAddress(authorizer.address, domain.address.value)) {
      return Err(new InvalidBackupError())
    }

    const odisHardenedKey = await odisHardenKey(key, domain, backup.environment, authorizer.wallet)
    if (!odisHardenedKey.ok) {
      return odisHardenedKey
    }
    key = odisHardenedKey.result
  }

  return Ok(decrypt(key, backup.encryptedData))
}
