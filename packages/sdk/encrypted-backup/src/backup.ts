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
import {
  ComputationalHardeningConfig,
  EnvironmentIdentifier,
  HardeningConfig,
  PASSWORD_HARDENING_ALFAJORES_CONFIG,
  PASSWORD_HARDENING_MAINNET_CONFIG,
  PIN_HARDENING_ALFAJORES_CONFIG,
  PIN_HARDENING_MAINNET_CONFIG,
} from './config'
import { BackupError, InvalidBackupError, UsageError } from './errors'
import { buildOdisDomain, odisHardenKey, odisQueryAuthorizer } from './odis'
import { computationalHardenKey, decrypt, deriveKey, encrypt, KDFInfo } from './utils'

const debug = debugFactory('kit:encrypted-backup:backup')

/**
 * Backup structure encoding the information needed to implement the encrypted backup protocol.
 *
 * @remarks The structure below and its related functions implement the encrypted backup protocol
 * designed for wallet account backups. More information about the protocol can be found in the
 * official {@link https://docs.celo.org/celo-codebase/protocol/identity/encrypted-cloud-backup |
 * Celo documentation}
 */
export interface Backup {
  /**
   * AES-128-GCM encryption of the user's secret backup data.
   *
   * @remarks The backup key is derived from the user's password or PIN hardened with input from the
   * ODIS rate-limited hashing service and optionally a circuit breaker service.
   */
  encryptedData: Buffer

  /**
   * A randomly chosen 256-bit value. Ensures uniqueness of the password derived encryption key.
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

  /**
   * Options for local computational hardening of the encryption key through PBKDF or scrypt.
   *
   * @remarks Adding computational hardening provides a measure of security from password guessing
   * when the password has a moderate amount of entropy (e.g. a password generated under good
   * guidelines). If the user secret has very low entropy, such as with a 6-digit PIN,
   * computational hardening does not add significant security.
   */
  computationalHardening?: ComputationalHardeningConfig

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

export interface CreatePinEncryptedBackupArgs {
  data: Buffer
  pin: string
  environment?: EnvironmentIdentifier
  metadata?: { [key: string]: unknown }
}

/**
 * Create a data backup, encrypting it with a hardened key derived from the given PIN.
 *
 * @remarks Using a 4 or 6 digit PIN for encryption requires an extremely restrictive rate limit for
 * attempts to guess the PIN. This is enforced by ODIS through the SequentialDelayDomain with
 * settings to allow the user (or an attacker) only a fixed number of attempts to guess their PIN.
 *
 * Because PINs have very little entropy, the total number of guesses is very restricted.
 *   * On the first day, the client has 10 attempts. 5 within 10s. 5 more over roughly 45 minutes.
 *   * On the second day, the client has 5 attempts over roughly 2 minutes.
 *   * On the third day, the client has 3 attempts over roughly 40 seconds.
 *   * On the fourth day, the client has 2 attempts over roughly 10 seconds.
 *   * Overall, the client has 25 attempts over 4 days. All further attempts will be denied.
 *
 * It is strongly recommended that the calling application implement a PIN blocklist to prevent the
 * user from selecting a number of the most common PIN codes (e.g. blocking the top 25k PINs by
 * frequency of appearance in the HIBP Passwords dataset). An example implementation can be seen in
 * the Valora wallet. {@link
 *  https://github.com/valora-inc/wallet/blob/3940661c40d08e4c5db952bd0abeaabb0030fc7a/packages/mobile/src/pincode/authentication.ts#L56-L108
 *  | PIN blocklist implementation}
 *
 * In order to handle the event of an ODIS service compromise, this configuration additionally
 * includes a circuit breaker service run by Valora. In the event of an ODIS compromise, the Valora
 * team will take their service offline, preventing backups using the circuit breaker from being
 * opened. This ensures that an attacker who has compromised ODIS cannot leverage their attack to
 * forcibly open backups created with this function.
 *
 * @param data The secret data (e.g. BIP-39 mnemonic phrase) to be included in the encrypted backup.
 * @param pin PIN to use in deriving the encryption key.
 * @param hardening Configuration for how the password should be hardened in deriving the key.
 * @param metadata Arbitrary key-value data to include in the backup to identify it.
 */
export async function createPinEncryptedBackup({
  data,
  pin,
  environment,
  metadata,
}: CreatePinEncryptedBackupArgs): Promise<Result<Backup, BackupError>> {
  // Select the hardening configuration based on the environment selector.
  let hardening: HardeningConfig | undefined
  if (environment === EnvironmentIdentifier.ALFAJORES) {
    hardening = PIN_HARDENING_ALFAJORES_CONFIG
  } else if (environment === EnvironmentIdentifier.MAINNET || environment === undefined) {
    hardening = PIN_HARDENING_MAINNET_CONFIG
  }
  if (hardening === undefined) {
    throw new Error('Implementation error: unhandled environment identifier')
  }

  return createBackup({ data, userSecret: pin, hardening, metadata })
}

export interface CreatePasswordEncryptedBackupArgs {
  data: Buffer
  password: string
  environment?: EnvironmentIdentifier
  metadata?: { [key: string]: unknown }
}

/**
 * Create a data backup, encrypting it with a hardened key derived from the given password.
 *
 * @remarks Because passwords have moderate entropy, the total number of guesses is restricted.
 *   * The user initially gets 5 attempts without delay.
 *   * Then the user gets two attempts every 5 seconds for up to 20 attempts.
 *   * Then the user gets two attempts every 30 seconds for up to 20 attempts.
 *   * Then the user gets two attempts every 5 minutes for up to 20 attempts.
 *   * Then the user gets two attempts every hour for up to 20 attempts.
 *   * Then the user gets two attempts every day for up to 20 attempts.
 *
 * Following guidelines in NIST-800-63-3 it is strongly recommended that the caller apply a password
 * blocklist to the users choice of password.
 *
 * In order to handle the event of an ODIS service compromise, this configuration additionally
 * hardens the password input with a computational hardening function. In particular, scrypt is used
 * with IETF recommended parameters {@link
 * https://tools.ietf.org/id/draft-whited-kitten-password-storage-00.html#name-scrypt | IETF
 * recommended scrypt parameters }
 *
 * @param data The secret data (e.g. BIP-39 mnemonic phrase) to be included in the encrypted backup.
 * @param password Password to use in deriving the encryption key.
 * @param hardening Configuration for how the password should be hardened in deriving the key.
 * @param metadata Arbitrary key-value data to include in the backup to identify it.
 */
export async function createPasswordEncryptedBackup({
  data,
  password,
  environment,
  metadata,
}: CreatePasswordEncryptedBackupArgs): Promise<Result<Backup, BackupError>> {
  // Select the hardening configuration based on the environment selector.
  let hardening: HardeningConfig | undefined
  if (environment === EnvironmentIdentifier.ALFAJORES) {
    hardening = PASSWORD_HARDENING_ALFAJORES_CONFIG
  } else if (environment === EnvironmentIdentifier.MAINNET || environment === undefined) {
    hardening = PASSWORD_HARDENING_MAINNET_CONFIG
  }
  if (hardening === undefined) {
    throw new Error('Implementation error: unhandled environment identifier')
  }

  return createBackup({ data, userSecret: password, hardening, metadata })
}

export interface CreateBackupArgs {
  data: Buffer
  userSecret: Buffer | string
  hardening: HardeningConfig
  metadata?: { [key: string]: unknown }
}

/**
 * Create a data backup, encrypting it with a hardened key derived from the given password or PIN.
 *
 * @param data The secret data (e.g. BIP-39 mnemonic phrase) to be included in the encrypted backup.
 * @param userSecret Password, PIN, or other user secret to use in deriving the encryption key.
 *  If a string is provided, it will be UTF-8 encoded into a Buffer before use.
 * @param hardening Configuration for how the password should be hardened in deriving the key.
 * @param metadata Arbitrary key-value data to include in the backup to identify it.
 *
 * @privateRemarks Most of this functions code is devoted to key generation starting with the input
 * password or PIN and ending up with a hardened encryption key. It is important that the order and
 * inputs to each step in the derivation be well considered and implemented correctly. One important
 * requirement is that no output included in the backup acts as a "commitment" to the password or PIN
 * value, except the final ciphertext. An example of an issue with this would be if a hash of the
 * password and nonce were included in the backup. If a commitment to the password or PIN is
 * included, an attacker can locally brute force that commitment to recover the password, then use
 * that knowledge to complete the derivation.
 */
export async function createBackup({
  data,
  userSecret,
  hardening,
  metadata,
}: CreateBackupArgs): Promise<Result<Backup, BackupError>> {
  // Password and backup data are not included in any logging as they are likely sensitive.
  debug('creating a backup with the following information', hardening, metadata)

  // Safety measure to prevent users from accidentally using this API without any hardening.
  if (hardening.odis === undefined && hardening.computational === undefined) {
    return Err(
      new UsageError(new Error('createBackup cannot be used with a empty hardening config'))
    )
  }

  // Generate a 32-byte random nonce for the backup. Use the first half to salt the user secret
  // input and the second half to derive an authentication key for making queries to ODIS.
  const nonce = crypto.randomBytes(32)
  const passwordSalt = nonce.slice(0, 16)
  const odisAuthKeySeed = nonce.slice(16, 32)
  const userSecretBuffer =
    typeof userSecret === 'string' ? Buffer.from(userSecret, 'utf8') : userSecret
  const initialKey = deriveKey(KDFInfo.PASSWORD, [userSecretBuffer, passwordSalt])

  // Generate a fuse key and mix it into the entropy of the key
  let encryptedFuseKey: Buffer | undefined
  let updatedKey: Buffer
  if (hardening.circuitBreaker !== undefined) {
    debug('generating a fuse key to enabled use of the circuit breaker service')
    const circuitBreakerClient = new CircuitBreakerClient(hardening.circuitBreaker.environment)

    // Check that the circuit breaker is online. Although we do not need to interact with the
    // service to create the backup, we should ensure its keys are not disabled or destroyed,
    // otherwise we may not be able to open the backup that we create.
    // Note that this status check is not strictly necessary and can be removed to all users to
    // proceed when the circuit breaker is temporarily unavailable at the risk of not being able to
    // open their backup later.
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
    updatedKey = deriveKey(KDFInfo.FUSE_KEY, [initialKey, fuseKey])
  } else {
    debug('not using the circuit breaker service')
    updatedKey = initialKey
  }

  // Harden the key with the output of a rate limited ODIS POPRF function.
  let domain: SequentialDelayDomain | undefined
  let odisHardenedKey: Buffer | undefined
  if (hardening.odis !== undefined) {
    debug('hardening the user key with output from ODIS')
    // Derive the query authorizer wallet and address from the nonce, then build the ODIS domain.
    // This domain acts as a binding rate limit configuration for ODIS, enforcing that the client must
    // know the backup nonce, and can only make the given number of queries.
    const authorizer = odisQueryAuthorizer(odisAuthKeySeed)
    domain = buildOdisDomain(hardening.odis, authorizer.address)

    debug('sending request to ODIS to harden the backup encryption key')
    const odisHardening = await odisHardenKey(
      updatedKey,
      domain,
      hardening.odis.environment,
      authorizer.wallet
    )
    if (!odisHardening.ok) {
      return Err(odisHardening.error)
    }
    odisHardenedKey = odisHardening.result
  } else {
    debug('not using ODIS for key hardening')
  }

  let computationalHardenedKey: Buffer | undefined
  if (hardening.computational !== undefined) {
    debug('hardening user key with computational function', hardening.computational)
    const computationalHardening = await computationalHardenKey(updatedKey, hardening.computational)
    if (!computationalHardening.ok) {
      return Err(computationalHardening.error)
    }
    computationalHardenedKey = computationalHardening.result
  } else {
    debug('not using computational key hardening')
  }

  debug('finalizing encryption key')
  const finalKey = deriveKey(KDFInfo.FINALIZE, [
    updatedKey,
    odisHardenedKey ?? Buffer.alloc(0),
    computationalHardenedKey ?? Buffer.alloc(0),
  ])

  debug('encrypting backup data with final encryption key')
  const encryption = encrypt(finalKey, data)
  if (!encryption.ok) {
    return Err(encryption.error)
  }

  // Encrypted and wrap the data in a Backup structure.
  debug('created encrypted backup')
  return Ok({
    encryptedData: encryption.result,
    nonce,
    odisDomain: domain,
    encryptedFuseKey,
    computationalHardening: hardening.computational,
    // TODO(victor): Bump this to 1.0 when the final crypto is added.
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
  userSecret: Buffer | string
}

/**
 * Open an encrypted backup file, using the provided password or PIN to derive the decryption key.
 *
 * @param backup Backup structure including the ciphertext and key derivation information.
 * @param userSecret Password, PIN, or other user secret to use in deriving the encryption key.
 *  If a string is provided, it will be UTF-8 encoded into a Buffer before use.
 */
export async function openBackup({
  backup,
  userSecret,
}: OpenBackupArgs): Promise<Result<Buffer, BackupError>> {
  debug('opening an encrypted backup')

  // Split the nonce into the two halves for password salting and auth key generation respectively.
  const passwordSalt = backup.nonce.slice(0, 16)
  const odisAuthKeySeed = backup.nonce.slice(16, 32)
  const userSecretBuffer =
    typeof userSecret === 'string' ? Buffer.from(userSecret, 'utf8') : userSecret
  const initialKey = deriveKey(KDFInfo.PASSWORD, [userSecretBuffer, passwordSalt])

  // If a circuit breaker is in use, request a decryption of the fuse key and mix it in.
  let updatedKey: Buffer
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
    updatedKey = deriveKey(KDFInfo.FUSE_KEY, [initialKey, unwrap.result])
  } else {
    debug('backup did not specify an encrypted fuse key')
    updatedKey = initialKey
  }

  // If ODIS is in use, harden the key with the output of a rate limited ODIS POPRF function.
  let odisHardenedKey: Buffer | undefined
  if (backup.odisDomain !== undefined) {
    const domain = backup.odisDomain

    // Derive the query authorizer wallet and address from the nonce.
    // If the ODIS domain is authenticated, the authorizer address should match the domain.
    const authorizer = odisQueryAuthorizer(odisAuthKeySeed)
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
    const odisHardening = await odisHardenKey(
      updatedKey,
      domain,
      backup.environment.odis,
      authorizer.wallet
    )
    if (!odisHardening.ok) {
      return Err(odisHardening.error)
    }
    odisHardenedKey = odisHardening.result
  } else {
    debug('not using ODIS for key hardening')
  }

  let computationalHardenedKey: Buffer | undefined
  if (backup.computationalHardening !== undefined) {
    debug('hardening user key with computational function', backup.computationalHardening)
    const computationalHardening = await computationalHardenKey(
      updatedKey,
      backup.computationalHardening
    )
    if (!computationalHardening.ok) {
      return Err(computationalHardening.error)
    }
    computationalHardenedKey = computationalHardening.result
  } else {
    debug('not using computational key hardening')
  }

  debug('finalizing decryption key')
  const finalKey = deriveKey(KDFInfo.FINALIZE, [
    updatedKey,
    odisHardenedKey ?? Buffer.alloc(0),
    computationalHardenedKey ?? Buffer.alloc(0),
  ])

  debug('decrypting backup with finalized decryption key')
  const decryption = decrypt(finalKey, backup.encryptedData)
  if (!decryption.ok) {
    return Err(decryption.error)
  }

  debug('decrypted backup')
  return Ok(decryption.result)
}
