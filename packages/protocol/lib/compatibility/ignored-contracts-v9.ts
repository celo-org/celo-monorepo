export const ignoredContractsV9 = [
  // These are Mento contracts which we are no longer maintaining
  'Exchange',
  'ExchangeEUR',
  'ExchangeBRL',
  'GrandaMento',
  'StableToken',
  'StableTokenEUR',
  'StableTokenBRL',
  'StableTokenRegistry',
  'Reserve',
  'ReserveSpenderMultiSig',
]

export const ignoredContractsV9Only = [
  'SortedOracles'
  // In CR9 the SortedOracles contract was deployed by Mento team, in CR10 we redeployed it ourselves
]

export function getReleaseVersion(tag: string) {
  const regexp = /core-contracts.v(?<version>.*[0-9])/gm
  const matches = regexp.exec(tag)
  const version = parseInt(matches?.groups?.version ?? '0', 10)
  if ((version) == 0) {
    throw `Tag doesn't have the correct format ${tag}`
  }
  return version
}
