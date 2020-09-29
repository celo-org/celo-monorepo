import { BigNumber } from 'bignumber.js'
import { ValidatorsListProps } from 'src/dev/ValidatorsList'
import { styles } from 'src/dev/ValidatorsListStyles'
import { weiToDecimal } from 'src/utils/utils'

export const localStoragePinnedKey = 'pinnedValidators'

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
  address: string
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
    address: string
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

export function isPinned({ address }: any) {
  const list = (localStorage.getItem(localStoragePinnedKey) || '').split(',') || []
  return +list.includes(address)
}

export function cleanData({ celoValidatorGroups, latestBlock }: ValidatorsListProps['data']) {
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
        const group = account
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
          order: Math.random(),
          pinned: isPinned(group.address),
          name: group.name,
          address: group.address,
          usd: weiToDecimal(+group.usd),
          celo: weiToDecimal(+group.lockedGold),
          receivableRaw: weiToDecimal(+receivableVotes),
          receivableVotes: receivableVotesPer.toString(),
          votesRaw: weiToDecimal(+votes),
          votes: votesPer.toString(),
          votesAbsolute: votesAbsolutePer.toString(),
          commission: (+commission * 100) / 10 ** 24,
          rewards,
          rewardsStyle,
          numMembers,
          claims: getClaims(group.claims),
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
