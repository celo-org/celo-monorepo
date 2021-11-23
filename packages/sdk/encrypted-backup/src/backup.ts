import { eqAddress } from '@celo/base/lib/address'
import { Err, Ok, Result } from '@celo/base/lib/result'
import {
  CircuitBreakerClient,
  CircuitBreakerKeyStatus,
  CircuitBreakerServiceContext,
  CircuitBreakerUnavailableError,
} from '@celo/identity/lib/odis/circuit-breaker'
import { ServiceContext as OdisServiceContext } from '@celo/identity/lib/odis/query'
import { SequentialDelayDomain } from '@celo/phone-number-privacy-common/lib/domains'
import * as crypto from 'crypto'
import debugFactory from 'debug'
import { HardeningConfig } from './config'
import { BackupError, DecryptionError, EncryptionError, InvalidBackupError } from './errors'
import { buildOdisDomain, odisQueryAuthorizer, odisHardenKey } from './odis'
import { deriveKey, decrypt, encrypt, KDFInfo } from './utils'

const debug = debugFactory('kit:encrypted-backup:backup')

// DO NOT MERGE(victor): Add links to the docs when that PR is merged. github.com/celo-org/docs/pull/150
export interface Backup {
  /**
   * AES-128-GCM encryption of the user's secret backup data.
   *
   * @remarks The backup key is derived from the user's password or PIN hardened with input from the
   * ODIS rate-limited hashing service and optionally a circuit breaker service.
   */
  encryptedData: Buffer

  /**
   * A randomly chosen 128-bit value. Ensures uniqueness of the password derived encryption key.
   *
   * @remarks The nonce value is appended to the password for local key derivation. It is also used
   * to derive an authentication key to include in the ODIS Domain for domain separation and to
   * ensure quota cannot be consumed by parties without access to the backup.
   */
  nonce: Buffer

  /**
   * ODIS Domain instance to be included in the query to ODIS for password hardening,
   *
   * @remarks Currently only SequentialDelayDomain is supported. Other ODIS domains intended for key
   * hardening may be supported in the future.
   */
  odisDomain?: SequentialDelayDomain

  /**
   * RSA-OAEP-256 encryption of a randomly chosen 128-bit value, the fuse key.
   *
   * @remarks The fuse key, if provided, is combined with the password in local key derivation.
   * Encryption is under the public key of the circuit breaker service. In order to get the fuseKey
   * the client will send this ciphertext to the circuit breaker service for decryption.
   */
  encryptedFuseKey?: Buffer

  /** Version number for the backup feature. Used to facilitate backwards compatibility. */
  version: string

  /**
   * Data provided by the backup creator to identify the backup and its context
   *
   * @remarks Metadata is provided by, and only meaningful to, the SDK user. The intention is for
   * this metadata to be used for identifying the backup and providing any context needed in the
   * application
   *
   * @example
   * ```typescript
   * {
   *   // Address of the primary account stored a backup of an account key. Used to display the
   *   // balance and latest transaction information for a given backup.
   *   accountAddress: string
   *   // Unix timestamp used to indicate when the backup was created.
   *   timestamp: number
   * }
   * ```
   */
  metadata?: { [key: string]: unknown }

  /** Information including the URL and public keys of the ODIS and circuit breaker services. */
  environment?: {
    odis?: OdisServiceContext
    circuitBreaker?: CircuitBreakerServiceContext
  }
}

export async function createPinEncryptedBackup(
  data: Buffer,
  pin: string
): Promise<Result<Backup, BackupError>> {}

export interface CreateBackupArgs {
  data: Buffer
  password: Buffer
  hardening: HardeningConfig
  metadata?: { [key: string]: unknown }
}

/**
 * Create a data backup, encrypting it with a hardened key derived from the given password or PIN.
 *
 * @param data The secret data (e.g. BIP-39 mnemonic phrase) to be included in the encrypted backup.
 * @param password Password, PIN, or other user secret to use in deriving the encryption key.
 * @param hardening Configuration for how the password should be hardened in deriving the key.
 * @param metadata Arbitrary key-value data to include in the backup to identify it.
 */
export async function createBackup({
  data,
  password,
  hardening,
  metadata,
}: CreateBackupArgs): Promise<Result<Backup, BackupError>> {
  // Password and backup data are not included in any logging as they are likely sensitive.
  debug('creating a backup with the following information', hardening, metadata)
  const nonce = crypto.randomBytes(16)
  let key = deriveKey(KDFInfo.PASSWORD, [password, nonce])

  // Generate a fuse key and mix it into the entropy of the key
  let encryptedFuseKey: Buffer | undefined
  if (hardening.circuitBreaker !== undefined) {
    debug('generating a fuse key to enabled use of the circuit breaker service')
    const circuitBreakerClient = new CircuitBreakerClient(hardening.circuitBreaker.environment)

    // Check that the circuit breaker is online. Although we do not need to interact with the
    // service to create the backup, we should ensure its keys are not disabled or destroyed,
    // otherwise we may not be able to open the backup that we create.
    const serviceStatus = await circuitBreakerClient.status()
    if (!serviceStatus.ok) {
      return Err(serviceStatus.error)
    }
    if (serviceStatus.result !== CircuitBreakerKeyStatus.ENABLED) {
      return Err(new CircuitBreakerUnavailableError(serviceStatus.result))
    }
    debug('confirmed that the circuit breaker is online')

    // Generate a fuse key and encrypt it against the circuit breaker public key.
    debug('generating and wrapping the fuse key')
    const fuseKey = crypto.randomBytes(16)
    const wrap = circuitBreakerClient.wrapKey(fuseKey)
    if (!wrap.ok) {
      return Err(wrap.error)
    }
    encryptedFuseKey = wrap.result

    // Mix the fuse key into the ongoing key hardening. Note that mixing in the circuit breaker key
    // occurs before the request to ODIS. This means an attacker would need to acquire the fuse key
    // _before_ they can make any attempts to guess the user's secret.
    debug('mixing the fuse key into the keying material')
    key = deriveKey(KDFInfo.FUSE_KEY, [key, fuseKey])
  } else {
    debug('not using the circuit breaker service')
  }

  // Harden the key with the output of a rate limited ODIS POPRF function.
  let domain: SequentialDelayDomain | undefined
  if (hardening.odis !== undefined) {
    debug('hardening the user key with output from ODIS')
    // Derive the query authorizer wallet and address from the nonce, then build the ODIS domain.
    // This domain acts as a binding rate limit configuration for ODIS, enforcing that the client must
    // know the backup nonce, and can only make the given number of queries.
    const authorizer = odisQueryAuthorizer(nonce)
    domain = buildOdisDomain(hardening.odis, authorizer.address)

    debug('sending request to ODIS to harden the backup encryption key')
    const odisHardenedKey = await odisHardenKey(
      key,
      domain,
      hardening.odis.environment,
      authorizer.wallet
    )
    if (!odisHardenedKey.ok) {
      return odisHardenedKey
    }
    key = odisHardenedKey.result
  } else {
    debug('not using ODIS for key hardening')
  }

  debug('encrypting backup data with final encrypted key')
  let encryptedData: Buffer
  try {
    encryptedData = encrypt(key, data)
  } catch (error) {
    return Err(new EncryptionError(error as Error))
  }

  // Encrypted and wrap the data in a Backup structure.
  debug('created encrypted backup')
  return Ok({
    encryptedData,
    nonce,
    odisDomain: domain,
    encryptedFuseKey: encryptedFuseKey,
    version: '0.0.1',
    metadata,
    environment: {
      odis: hardening.odis?.environment,
      circuitBreaker: hardening.circuitBreaker?.environment,
    },
  })
}

export interface OpenBackupArgs {
  backup: Backup
  password: Buffer
}

/**
 * Open an encrypted backup file, using the provided password or PIN to derive the decryption key.
 *
 * @param backup Backup structure including the ciphertext and key derivation information.
 * @param password Password, PIN, or other user secret to use in deriving the encryption key.
 */
export async function openBackup({
  backup,
  password,
}: OpenBackupArgs): Promise<Result<Buffer, BackupError>> {
  debug('opening an encrypted backup')
  let key = deriveKey(KDFInfo.PASSWORD, [password, backup.nonce])

  // If a circuit breaker is in use, request a decryption of the fuse key and mix it in.
  if (backup.encryptedFuseKey !== undefined) {
    if (backup.environment?.circuitBreaker === undefined) {
      return Err(
        new InvalidBackupError(
          new Error('encrypted fuse key is provided but no circuit breaker environment is provided')
        )
      )
    }
    const circuitBreakerClient = new CircuitBreakerClient(backup.environment.circuitBreaker)

    debug(
      'requesting the circuit breaker service unwrap the encrypted circuit breaker key',
      backup.environment.circuitBreaker
    )
    const unwrap = await circuitBreakerClient.unwrapKey(backup.encryptedFuseKey)
    if (!unwrap.ok) {
      return Err(unwrap.error)
    }

    // Mix the fuse key into the ongoing key hardening. Note that mixing in the circuit breaker key
    // occurs before the request to ODIS. This means an attacker would need to aquire the fuse key
    // _before_ they can make any attempts to guess the user's secret.
    key = deriveKey(KDFInfo.FUSE_KEY, [key, unwrap.result])
  } else {
    debug('backup did not specify an encrypted fuse key')
  }

  // If ODIS is in use, harden the key with the output of a rate limited ODIS POPRF function.
  if (backup.odisDomain !== undefined) {
    const domain = backup.odisDomain

    // Derive the query authorizer wallet and address from the nonce.
    // If the ODIS domain is authenticated, the authorizer address should match the domain.
    const authorizer = odisQueryAuthorizer(backup.nonce)
    if (domain.address.defined && !eqAddress(authorizer.address, domain.address.value)) {
      return Err(
        new InvalidBackupError(
          new Error(
            'domain query authorizer address is provided but is not derived from the backup nonce'
          )
        )
      )
    }
    if (backup.environment?.odis === undefined) {
      return Err(
        new InvalidBackupError(
          new Error('ODIS domain is provided by no ODIS environment information')
        )
      )
    }

    debug('requesting a key hardening response from ODIS')
    const odisHardenedKey = await odisHardenKey(
      key,
      domain,
      backup.environment.odis,
      authorizer.wallet
    )
    if (!odisHardenedKey.ok) {
      return odisHardenedKey
    }
    key = odisHardenedKey.result
  }

  let decryptedData: Buffer
  try {
    decryptedData = decrypt(key, backup.encryptedData)
  } catch (error) {
    return Err(new DecryptionError(error as Error))
  }

  debug('requesting a key hardening response from ODIS')
  return Ok(decryptedData)
}
