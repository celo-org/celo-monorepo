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
  // Between CR9 and CR10, a Mento upgrade MU03 also upgraded SortedOracles. For the purposes of our compatibility tests, we use the Mento version of the contract in CR10, so that we're comparing the most recent pre-CR10 contracts with the CR10 versions.
]

export function getReleaseVersion(tag: string) {
  // Support both tag format (core-contracts.vX) and branch format (release/core-contracts/X)
  const tagRegexp = /core-contracts.v(?<version>.*[0-9])/gm
  const branchRegexp = /release\/core-contracts\/(?<version>[0-9]+)/gm

  let matches = tagRegexp.exec(tag)
  if (!matches) {
    matches = branchRegexp.exec(tag)
  }

  const version = parseInt(matches?.groups?.version ?? '0', 10)
  if ((version) == 0) {
    throw `Tag doesn't have the correct format ${tag} instead of core-contracts.vX or release/core-contracts/X`
  }
  return version
}
