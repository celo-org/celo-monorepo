import { SequentialDelayDomain, SequentialDelayStage } from '@celo/identity/lib/odis/domains'

export interface SequentialDelayResult {
  accepted: boolean
  state?: SequentialDelayState
}

interface SequentialDelayState {
  // Timestamp used for deciding when the next request will be accepted.
  timer: number
  // Number of queries that have been accepted for the SequentialDelayDomain instance.
  counter: number
}

interface IndexedSequentialDelayStage extends SequentialDelayStage {
  // The attempt number at which the stage begins
  start: number
}

export const checkSequentialDelay = (
  domain: SequentialDelayDomain,
  attemptTime: number,
  state?: SequentialDelayState
): SequentialDelayResult => {
  // If no state is available (i.e. this is the first request against the domain) use the initial state.
  const counter = state?.counter ?? 0
  const timer = state?.timer ?? 0
  const stage = getIndexedStage(domain, counter)

  // If the counter is past the last stage (i.e. the domain is permanently out of quota) return early.
  if (!stage) {
    return { accepted: false, state }
  }

  const resetTimer = stage.resetTimer.defined ? stage.resetTimer.value : true
  const delay = getDelay(stage, counter)
  const notBefore = timer + delay

  if (attemptTime < notBefore) {
    return { accepted: false, state }
  }

  // Request is accepted. Update the state.
  return {
    accepted: true,
    state: {
      counter: counter + 1,
      timer: resetTimer ? attemptTime : notBefore,
    },
  }
}

const getIndexedStage = (
  domain: SequentialDelayDomain,
  counter: number
): IndexedSequentialDelayStage | undefined => {
  let attemptsInStage = 0
  let index = 0
  let start = 0
  while (start <= counter) {
    if (index >= domain.stages.length) {
      return undefined
    }
    const stage = domain.stages[index]
    const repetitions = stage.repetitions.defined ? stage.repetitions.value : 1
    const batchSize = stage.batchSize.defined ? stage.batchSize.value : 1
    attemptsInStage = repetitions * batchSize
    start += attemptsInStage
    index++
  }

  start -= attemptsInStage
  index--

  return { ...domain.stages[index], start }
}

const getDelay = (stage: IndexedSequentialDelayStage, counter: number): number => {
  const batchSize = stage.batchSize.defined ? stage.batchSize.value : 1
  if ((counter - stage.start) % batchSize === 0) {
    return stage.delay
  }
  return 0
}
