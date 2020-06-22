export interface HoldingsData {
  updatedDate: string
  total: number
  onChain: number
  inCustody: number
  BTC: number
  ETH: number
  DAI: number
  cUSD: number
  ratio: number
}

export interface Addresses {
  celoAddress: string
  custodyAddress: string
  btcAddress: string
  ethAddress: string
  daiAddress: string
}
