import { SequentialDelayDomain, SequentialDelayStage } from '../interfaces'
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

  const resetTimer = stage.resetTimer ?? true
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
  let stage = 0
  let i = 0
  while (i <= counter) {
    if (stage >= domain.stages.length) {
      return undefined
    }
    const repetitions = domain.stages[stage].repetitions ?? 1
    const batchSize = domain.stages[stage].batchSize ?? 1
    attemptsInStage = repetitions * batchSize
    i += attemptsInStage
    stage++
  }

  i -= attemptsInStage
  stage--

  return { ...domain.stages[stage], start: i }
}

const getDelay = (stage: IndexedSequentialDelayStage, counter: number): number => {
  const batchSize = stage.batchSize ?? 1
  if ((counter - stage.start) % batchSize === 0) {
    return stage.delay
  }
  return 0
}
