export interface HoldingsData {
  updatedDate: string
  unfrozen: number
  frozen: number
  inCustody: number
  BTC: number
  ETH: number
  DAI: number
  cUSD: number
  ratio: number
  unFrozenRatio: number
}

export interface Addresses {
  celoAddress: string
  custodyAddress: string
  btcAddress: string
  ethAddress: string
  daiAddress: string
}
