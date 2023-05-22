export const ignoredContractsV9 = [
  // These are Mento contracts which we are no longer maintaining
  'Exchange',
  'ExchangeBRL',
  'ExchangeEUR',
  'GrandaMento',
  'Reserve',
  'ReserveSpenderMultiSig',
  'SortedOracles',
  'StableToken',
  'StableTokenBRL',
  'StableTokenEUR',
  'StableTokenRegistry',
]

export function getReleaseVersion(branch: string) {
  const regexp = /core-contracts.v(?<version>.*[0-9])/gm
  const matches = regexp.exec(branch)
  const version = parseInt(matches?.groups?.version ?? '0', 10)
  return version
}
