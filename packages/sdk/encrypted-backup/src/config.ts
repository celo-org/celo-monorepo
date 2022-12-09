import {
  CircuitBreakerServiceContext,
  VALORA_ALFAJORES_CIRCUIT_BREAKER_ENVIRONMENT,
  VALORA_MAINNET_CIRCUIT_BREAKER_ENVIRONMENT,
} from '@celo/identity/lib/odis/circuit-breaker'
import {
  ODIS_ALFAJORES_CONTEXT_DOMAINS,
  ODIS_MAINNET_CONTEXT_DOMAINS,
  ServiceContext as OdisServiceContext,
} from '@celo/identity/lib/odis/query'
import { SequentialDelayStage } from '@celo/phone-number-privacy-common'
import { defined, noNumber } from '@celo/utils/lib/sign-typed-data-utils'
import { ScryptOptions } from './utils'

export interface HardeningConfig {
  /**
   * If provided, a computational hardening function (e.g. scrypt or PBKDF2) will be applied to
   * locally harden the backup encryption key.
   *
   * @remarks Recommended for password-encrypted backups, especially if a circuit breaker is not in
   * use, as this provides some degree of protection in the event of an ODIS compromise. When
   * generating backups on low-power devices (e.g. budget smart phones) and encrypting with
   * low-entropy secrets (e.g. 6-digit PINs) local hardening cannot offer significant protection.
   */
  computational?: ComputationalHardeningConfig

  /** If provided, ODIS will be used with the given configuration to harden the backup key */
  odis?: OdisHardeningConfig

  /**
   * If provided, a circuit breaker will be used with the given configuration to protect the backup key
   */
  circuitBreaker?: CircuitBreakerConfig
}

/** Configuration for usage of ODIS to harden the encryption keys */
export interface OdisHardeningConfig {
  /**
   * Rate limiting information used to construct the ODIS domain which will be used to harden the
   * encryption key through ODIS' domain password hardening service.
   *
   * @remarks Currently supports the SequentialDelayDomain. In the future, as additional domains are
   * standardized for key hardening, they may be added here to allow a wider range of configuration.
   */
  rateLimit: SequentialDelayStage[]

  /** Environment information including the URL and public key of the ODIS service */
  environment: OdisServiceContext
}

/** Configuration for usage of a circuit breaker to protect the encryption keys */
export interface CircuitBreakerConfig {
  /** Environment information including the URL and public key of the circuit breaker service */
  environment: CircuitBreakerServiceContext
}

export enum ComputationalHardeningFunction {
  PBKDF = 'pbkdf2_sha256',
  SCRYPT = 'scrypt',
}

export interface PbkdfConfig {
  function: ComputationalHardeningFunction.PBKDF
  iterations: number
}

export interface ScryptConfig extends ScryptOptions {
  function: ComputationalHardeningFunction.SCRYPT
}

export type ComputationalHardeningConfig = PbkdfConfig | ScryptConfig

/**
 * ODIS SequentialDelayDomain rate limit configured to be appropriate for hardening a 6-digit PIN.
 *
 * @remarks Because PINs have very little entropy, the total number of guesses is very restricted.
 *   * On the first day, the client has 10 attempts. 5 within 10s. 5 more over roughly 45 minutes.
 *   * On the second day, the client has 5 attempts over roughly 2 minutes.
 *   * On the third day, the client has 3 attempts over roughly 40 seconds.
 *   * On the fourth day, the client has 2 attempts over roughly 10 seconds.
 *   * Overall, the client has 20 attempts over 4 days. All further attempts will be denied.
 */
const PIN_HARDENING_RATE_LIMIT: SequentialDelayStage[] = [
  // First stage is setup, as the user will need to make a single query to create their backup.
  {
    delay: 0,
    resetTimer: defined(true),
    batchSize: defined(1),
    repetitions: noNumber,
  },
  // On the first day, the client has 10 attempts. 5 within 10s. 5 more over roughly 45 minutes.
  {
    delay: 0,
    resetTimer: defined(true),
    batchSize: defined(3),
    repetitions: noNumber,
  },
  {
    delay: 10,
    resetTimer: defined(true),
    batchSize: defined(2),
    repetitions: noNumber,
  },
  {
    delay: 30,
    resetTimer: defined(false),
    batchSize: defined(1),
    repetitions: noNumber,
  },
  {
    delay: 60,
    resetTimer: defined(false),
    batchSize: defined(1),
    repetitions: noNumber,
  },
  {
    delay: 300,
    resetTimer: defined(false),
    batchSize: defined(1),
    repetitions: noNumber,
  },
  {
    delay: 900,
    resetTimer: defined(false),
    batchSize: defined(1),
    repetitions: noNumber,
  },
  {
    delay: 1800,
    resetTimer: defined(true),
    batchSize: defined(1),
    repetitions: noNumber,
  },
  // On the second day, the client has 5 attempts over roughly 2 minutes.
  {
    delay: 86400,
    resetTimer: defined(true),
    batchSize: defined(2),
    repetitions: noNumber,
  },
  {
    delay: 10,
    resetTimer: defined(false),
    batchSize: defined(1),
    repetitions: noNumber,
  },
  {
    delay: 30,
    resetTimer: defined(false),
    batchSize: defined(1),
    repetitions: noNumber,
  },
  {
    delay: 60,
    resetTimer: defined(true),
    batchSize: defined(1),
    repetitions: noNumber,
  },
  // On the third day, the client has 3 attempts over roughly 40 seconds.
  {
    delay: 86400,
    resetTimer: defined(true),
    batchSize: defined(1),
    repetitions: noNumber,
  },
  {
    delay: 10,
    resetTimer: defined(false),
    batchSize: defined(1),
    repetitions: noNumber,
  },
  {
    delay: 30,
    resetTimer: defined(true),
    batchSize: defined(1),
    repetitions: noNumber,
  },
  // On the fourth day, the client has 2 attempts over roughly 10 seconds.
  {
    delay: 86400,
    resetTimer: defined(true),
    batchSize: defined(1),
    repetitions: noNumber,
  },
  {
    delay: 10,
    resetTimer: defined(false),
    batchSize: defined(1),
    repetitions: noNumber,
  },
]

/**
 * ODIS SequentialDelayDomain rate limit configured to be appropriate for hardening a password.
 *
 * @remarks Because passwords have moderate entropy, the total number of guesses is restricted.
 *   * The user initially gets 5 attempts without delay.
 *   * Then the user gets two attempts every 5 seconds for up to 20 attempts.
 *   * Then the user gets two attempts every 30 seconds for up to 20 attempts.
 *   * Then the user gets two attempts every 5 minutes for up to 20 attempts.
 *   * Then the user gets two attempts every hour for up to 20 attempts.
 *   * Then the user gets two attempts every day for up to 20 attempts.
 */
const PASSWORD_HARDENING_RATE_LIMIT: SequentialDelayStage[] = [
  // First stage is setup, as the user will need to make a single query to create their backup.
  {
    delay: 0,
    resetTimer: defined(true),
    batchSize: defined(1),
    repetitions: noNumber,
  },
  // After the first 5 attempts, the user has 100 attempts with the delays increasing every 20.
  {
    delay: 0,
    resetTimer: defined(true),
    batchSize: defined(5),
    repetitions: noNumber,
  },
  {
    delay: 5,
    resetTimer: defined(true),
    batchSize: defined(2),
    repetitions: defined(10),
  },
  {
    delay: 30,
    resetTimer: defined(true),
    batchSize: defined(2),
    repetitions: defined(10),
  },
  {
    delay: 300,
    resetTimer: defined(true),
    batchSize: defined(2),
    repetitions: defined(10),
  },
  {
    delay: 3600,
    resetTimer: defined(true),
    batchSize: defined(2),
    repetitions: defined(10),
  },
  {
    delay: 86400,
    resetTimer: defined(true),
    batchSize: defined(2),
    repetitions: defined(10),
  },
]

/**
 * ODIS SequentialDelayDomain rate limit configured for e2e testing where no rate limit should be applied.
 *
 * @remarks This should only be used testing purposes
 */
const E2E_TESTING_RATE_LIMIT: SequentialDelayStage[] = [
  {
    delay: 0,
    resetTimer: defined(true),
    batchSize: defined(1000000000),
    repetitions: defined(1000000000),
  },
]

/**
 * ODIS SequentialDelayDomain rate limit configured for e2e testing where the user should have no quota.
 *
 * @remarks This should only be used testing purposes
 */
const NO_QUOTA_RATE_LIMIT: SequentialDelayStage[] = [
  {
    delay: 0,
    resetTimer: defined(true),
    batchSize: defined(0),
    repetitions: defined(0),
  },
]

export enum EnvironmentIdentifier {
  MAINNET = 'MAINNET',
  ALFAJORES = 'ALFAJORES',
}

export const PIN_HARDENING_MAINNET_CONFIG: HardeningConfig = {
  odis: {
    rateLimit: PIN_HARDENING_RATE_LIMIT,
    environment: ODIS_MAINNET_CONTEXT_DOMAINS,
  },
  circuitBreaker: {
    environment: VALORA_MAINNET_CIRCUIT_BREAKER_ENVIRONMENT,
  },
}

export const PIN_HARDENING_ALFAJORES_CONFIG: HardeningConfig = {
  odis: {
    rateLimit: PIN_HARDENING_RATE_LIMIT,
    environment: ODIS_ALFAJORES_CONTEXT_DOMAINS,
  },
  circuitBreaker: {
    environment: VALORA_ALFAJORES_CIRCUIT_BREAKER_ENVIRONMENT,
  },
}

export const PASSWORD_HARDENING_MAINNET_CONFIG: HardeningConfig = {
  odis: {
    rateLimit: PASSWORD_HARDENING_RATE_LIMIT,
    environment: ODIS_MAINNET_CONTEXT_DOMAINS,
  },
  computational: {
    function: ComputationalHardeningFunction.SCRYPT,
    cost: 32768,
    blockSize: 8,
    parallelization: 1,
  },
}

export const E2E_TESTING_MAINNET_CONFIG: HardeningConfig = {
  odis: {
    rateLimit: E2E_TESTING_RATE_LIMIT,
    environment: ODIS_MAINNET_CONTEXT_DOMAINS,
  },
  computational: {
    function: ComputationalHardeningFunction.SCRYPT,
    cost: 32768,
    blockSize: 8,
    parallelization: 1,
  },
}

export const NO_QUOTA_MAINNET_CONFIG: HardeningConfig = {
  odis: {
    rateLimit: NO_QUOTA_RATE_LIMIT,
    environment: ODIS_MAINNET_CONTEXT_DOMAINS,
  },
  computational: {
    function: ComputationalHardeningFunction.SCRYPT,
    cost: 32768,
    blockSize: 8,
    parallelization: 1,
  },
}

export const PASSWORD_HARDENING_ALFAJORES_CONFIG: HardeningConfig = {
  odis: {
    rateLimit: PASSWORD_HARDENING_RATE_LIMIT,
    environment: ODIS_ALFAJORES_CONTEXT_DOMAINS,
  },
  computational: {
    function: ComputationalHardeningFunction.SCRYPT,
    cost: 32768,
    blockSize: 8,
    parallelization: 1,
  },
}

export const E2E_TESTING_ALFAJORES_CONFIG: HardeningConfig = {
  odis: {
    rateLimit: E2E_TESTING_RATE_LIMIT,
    environment: ODIS_ALFAJORES_CONTEXT_DOMAINS,
  },
  computational: {
    function: ComputationalHardeningFunction.SCRYPT,
    cost: 32768,
    blockSize: 8,
    parallelization: 1,
  },
}

export const NO_QUOTA_ALFAJORES_CONFIG: HardeningConfig = {
  odis: {
    rateLimit: NO_QUOTA_RATE_LIMIT,
    environment: ODIS_ALFAJORES_CONTEXT_DOMAINS,
  },
  computational: {
    function: ComputationalHardeningFunction.SCRYPT,
    cost: 32768,
    blockSize: 8,
    parallelization: 1,
  },
}
