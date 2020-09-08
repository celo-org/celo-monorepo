export interface Edges<T> {
  edges: Array<{
    node: T
  }>
}

export interface CeloValidatorGroup {
  account: {
    address: string
    lockedGold: string
    name: string
    usd: string
    claims: Edges<{
      verified: boolean
      element: string
    }>
  }
  accumulatedActive: string
  accumulatedRewards: string
  affiliates: Edges<{
    account: {
      claims: Edges<{
        verified: boolean
        element: string
      }>
    }
    address: string
    attestationsFulfilled: number
    attestationsRequested: number
    lastElected: number
    lastOnline: number
    lockedGold: string
    name: string
    score: string
    usd: string
  }>
  commission: string
  numMembers: number
  receivableVotes: string
  rewardsRatio: string
  votes: string
}
