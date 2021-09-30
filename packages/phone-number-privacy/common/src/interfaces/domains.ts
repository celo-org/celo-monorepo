export interface SequentialDelayDomain {
  name: 'ODIS Sequential Delay Domain'
  version: number
  stages: SequentialDelayStage[]
  // Optional public key of a against which signed requests must be authenticated.
  // In the case of Cloud Backup, this will be a one-time key stored with the ciphertext.
  publicKey?: string
  // Optional string to distinguish the output of this domain instance from
  // other SequentialDelayDomain instances
  salt?: string
}

export interface SequentialDelayStage {
  // How many seconds each batch of attempts in this stage is delayed with
  // respect to the timer.
  delay: number
  // Whether the timer should be reset between attempts during this stage.
  // Defaults to true.
  resetTimer?: boolean
  // The number of continuous attempts a user gets before the next delay
  // in each repetition of this stage. Defaults to 1.
  batchSize?: number
  // The number of times this stage repeats before continuing to the next stage
  // in the RateLimit array. Defaults to 1.
  repetitions?: number
}
