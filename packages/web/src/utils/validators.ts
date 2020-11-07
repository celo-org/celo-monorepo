import { BigNumber } from 'bignumber.js'
import { styles } from 'src/dev/ValidatorsListStyles'
import { weiToDecimal } from 'src/utils/utils'

export const localStoragePinnedKey = 'pinnedValidators'

export interface Edges<T> {
  edges: Array<{
    node: T
  }>
}

export type Address = string

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
    neverElected: boolean
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

export interface CeloGroup {
  id: number
  elected: number
  online: number
  total: number
  uptime: number
  attestation: number
  name: string
  address: Address
  usd: number
  celo: number
  receivableRaw: number
  receivableVotes: string
  votesRaw: number
  votes: string
  votesAbsolute: string
  commission: number
  rewards: number
  rewardsStyle: any
  numMembers: number
  claims: string[]
  validators: Array<{
    name: string
    address: Address
    usd: number
    celo: number
    elected: boolean
    neverElected: boolean
    online: boolean
    uptime: number
    attestation: number
    claims: string[]
  }>
}

export interface ValidatorsListData {
  celoValidatorGroups: CeloValidatorGroup[]
  latestBlock: number
}

export const orderAccessors = {
  order: (_) => _.order,
  name: (_) => (_.name || '').toLowerCase() || null,
  total: (_) => _.numMembers * 1000 + _.elected,
  votes: (_) => +_.votesAbsolute || 0,
  rawVotes: (_) => _.votesRaw || 0,
  votesAvailables: (_) => _.receivableRaw || 0,
  celo: (_) => _.celo || 0,
  commission: (_) => _.commission || 0,
  rewards: (_) => _.rewards || 0,
  uptime: (_) => _.uptime || 0,
  attestation: (_) => _.attestation || 0,
}

/**
 * Determines whether a validator is pinned
 * Pinned validators are set to the top of the table, regardless of how the table is sorted
 * @param  {Address}    address The address of a given Validator
 * @return {number}     1 if the address is pinned, 0 if not
 */
export function isPinned(address: Address) {
  const list = (localStorage.getItem(localStoragePinnedKey) || '').split(',') || []
  return +list.includes(address)
}

/**
 * Toggles the pinned status of a validator
 * Pinned validators are set to the top of the table, regardless of how the table is sorted
 * @param {Address}     address The address of a given Validator
 * @return {boolean}    Whether the given validator is pinned
 */
export function togglePin(address: Address) {
  let list = (localStorage.getItem(localStoragePinnedKey) || '').split(',') || []
  const pinned = list.includes(address)
  if (!pinned) {
    list.push(address)
  } else {
    list = list.filter((_) => _ !== address)
  }
  localStorage.setItem(localStoragePinnedKey, list.join(','))
}

/**
 * Formats data into usable data for table
 * @param {ValidatorsListData}   data.celoValidatorGroups The validator groups data
 * @param {ValidatorsListData}   data.latestBlock The height of the latest block
 * @return {CeloGroup[]}           The group of validators with formatted data
 */
export function cleanData({ celoValidatorGroups, latestBlock }: ValidatorsListData) {
  const totalVotes: BigNumber = celoValidatorGroups
    .map(({ receivableVotes }) => new BigNumber(receivableVotes))
    .reduce((acc: BigNumber, _) => acc.plus(_), new BigNumber(0))

  const getClaims = (claims: CeloValidatorGroup['account']['claims'] = {} as any): string[] =>
    (claims.edges || [])
      .map(({ node }) => node)
      .filter(({ verified }) => verified)
      .map(({ element }) => element)

  return celoValidatorGroups
    .map(
      ({ account, affiliates, votes, receivableVotes, commission, numMembers, rewardsRatio }) => {
        const rewards = rewardsRatio === null ? null : Math.round(+rewardsRatio * 100 * 10) / 10
        const rewardsStyle =
          rewards < 70 ? styles.barKo : rewards < 90 ? styles.barWarn : styles.barOk
        const receivableVotesPer = new BigNumber(receivableVotes)
          .dividedBy(totalVotes)
          .multipliedBy(100)
        const votesPer = new BigNumber(votes).dividedBy(receivableVotes).multipliedBy(100)
        const votesAbsolutePer = receivableVotesPer.multipliedBy(votesPer).dividedBy(100)
        const totalFulfilled = affiliates.edges.reduce((acc, obj) => {
          return acc + (obj.node.attestationsFulfilled || 0)
        }, 0)
        const totalRequested = affiliates.edges.reduce((acc, obj) => {
          return acc + (obj.node.attestationsRequested || 0)
        }, 0)
        return {
          attestation: Math.max(0, totalFulfilled / (totalRequested || -1)) * 100,
          // Randomizes the order of validators on every load
          order: Math.random(),
          pinned: isPinned(account.address),
          name: account.name,
          address: account.address,
          usd: weiToDecimal(+account.usd),
          celo: weiToDecimal(+account.lockedGold),
          receivableRaw: weiToDecimal(+receivableVotes),
          receivableVotes: receivableVotesPer.toString(),
          votesRaw: weiToDecimal(+votes),
          votes: votesPer.toString(),
          votesAbsolute: votesAbsolutePer.toString(),
          commission: (+commission * 100) / 10 ** 24,
          rewards,
          rewardsStyle,
          numMembers,
          claims: getClaims(account.claims),
          validators: affiliates.edges.map(({ node: validator }) => {
            const {
              address,
              lastElected,
              lastOnline,
              name,
              usd,
              lockedGold,
              score,
              attestationsFulfilled,
              attestationsRequested,
            } = validator
            return {
              name,
              address,
              usd: weiToDecimal(+usd),
              celo: weiToDecimal(+lockedGold),
              elected: lastElected >= latestBlock,
              online: lastOnline >= latestBlock,
              uptime: (+score * 100) / 10 ** 24,
              attestation: Math.max(0, attestationsFulfilled / (attestationsRequested || -1)) * 100,
              neverElected: !lastElected && !attestationsRequested,
              claims: getClaims(validator.account.claims),
            }
          }),
        }
      }
    )
    .map((group, id) => {
      const data = group.validators.reduce(
        ({ elected, online, total, uptime }, validator) => ({
          elected: elected + +validator.elected,
          online: online + +validator.online,
          total: total + 1,
          uptime: uptime + validator.uptime,
        }),
        { elected: 0, online: 0, total: 0, uptime: 0 }
      )
      data.uptime = data.uptime / group.validators.length
      return {
        id,
        ...group,
        ...data,
      }
    })
}

/**
 * Sorts validator data by specified key, with pinned validators at the beginning
 * @param {CeloGroup[]}   data The validators data
 * @param {boolean}       asc Whether the data should be sorted in ascending or descending order
 * @param {string}        key The key to sort by (e.g. name, votes, lockedCelo, etc)
 * @return {CeloGroup[]}  The group of validators with formatted data
 */
export function sortData(data: CeloGroup[], asc: boolean, key: string) {
  const accessor = orderAccessors[key]
  const dir = asc ? 1 : -1

  const compare = (a, b): number => {
    if (a === null) {
      return 1
    }
    if (b === null) {
      return -1
    }
    return a > b ? 1 : -1
  }

  return data
    .sort((a, b) => dir * compare(accessor(a), accessor(b)))
    .sort((a, b) => isPinned(b.address) - isPinned(a.address))
}
