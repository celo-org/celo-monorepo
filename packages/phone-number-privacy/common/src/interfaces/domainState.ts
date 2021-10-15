export type SequentialDelayDomainState = {
  domainHash: string
  counter: number
  timer: number
  disabled: boolean
}

/**
 * Union type of domains states which are currently implemented and standardized for use with ODIS.
 */
export type KnownDomainState = SequentialDelayDomainState
