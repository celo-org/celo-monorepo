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

// TODO(victor): Should this be OdisHardeningConfig instead?
export interface HardeningConfig {
  // TODO(victor): Support domain types in a more generalized way?
  rateLimit: SequentialDelayStage[]
}

export const PIN_HARDENING_CONFIG = {
  rateLimit: PIN_HARDENING_RATE_LIMIT,
}
