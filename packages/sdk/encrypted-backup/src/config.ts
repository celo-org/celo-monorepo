import { ServiceContext as OdisServiceContext } from '@celo/identity/lib/odis/query'
import { CircuitBreakerServiceContext } from '@celo/identity/lib/odis/circuit-breaker'
import { SequentialDelayStage } from '@celo/phone-number-privacy-common'
import { defined, noNumber } from '@celo/utils/lib/sign-typed-data-utils'

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
  // On seconds day, the client has 5 attempts over roughly 2 minutes.
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
  // On third day, the client has 3 attempts over roughly 40 seconds.
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
  // On fourth day, the client has 2 attempts over roughly 10 seconds.
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

export interface HardeningConfig {
  /** If provided, ODIS will be used with the given config to harden the backup key */
  odis?: OdisHardeningConfig

  /** If provided, a circuit breaker will be used with the given config to protect the backup key */
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

export const PIN_HARDENING_CONFIG = {
  rateLimit: PIN_HARDENING_RATE_LIMIT,
}
