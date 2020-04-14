import { BigNumber } from 'bignumber.js'
import * as React from 'react'
import { Text as RNText, View } from 'react-native'
import ValidatorsListRow, { CeloGroup } from 'src/dev/ValidatorsListRow'
import { styles } from 'src/dev/ValidatorsListStyles'
import { H1 } from 'src/fonts/Fonts'
import { I18nProps, withNamespaces } from 'src/i18n'
import Chevron, { Direction } from 'src/icons/chevron'
import { colors, standardStyles, textStyles } from 'src/styles'
import { weiToDecimal } from 'src/utils/utils'

class Text extends RNText {
  render() {
    return <RNText style={[styles.defaultText, this.props.style]}>{this.props.children}</RNText>
  }
}

interface HeaderCellProps {
  style: any[]
  name: string
  order: boolean | null
  onClick: () => void
}

const HeaderCell = React.memo(function HeaderCellFn({
  style,
  name,
  order,
  onClick,
}: HeaderCellProps) {
  return (
    <View onClick={onClick} style={[styles.tableHeaderCell, ...((style || []) as any)]}>
      <Text>{name}</Text>
      <Text
        style={[
          styles.tableHeaderCellArrow,
          ...(order !== null ? [styles.tableHeaderCellArrowVisible] : []),
        ]}
      >
        <Chevron direction={order ? Direction.up : Direction.down} color={colors.white} size={10} />
      </Text>
    </View>
  )
})

interface CeloValidatorGroup {
  account: {
    address: string
    lockedGold: string
    name: string
    usd: string
    claims: any
  }
  accumulatedActive: string
  accumulatedRewards: string
  affiliates: {
    edges: Array<{
      node: {
        account: {
          claims: any
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
      }
    }>
  }
  commission: string
  numMembers: number
  receivableVotes: string
  rewardsRatio: string
  votes: string
}

interface ValidatorsListProps {
  data: {
    celoValidatorGroups: CeloValidatorGroup[]
    latestBlock: number
  }
  isLoading: boolean
}

type orderByTypes =
  | 'name'
  | 'total'
  | 'votes'
  | 'gold'
  | 'commision'
  | 'rewards'
  | 'uptime'
  | 'attestation'

export interface State {
  expanded: number | undefined
  orderBy: orderByTypes
  orderAsc: boolean
}

class ValidatorsList extends React.PureComponent<ValidatorsListProps & I18nProps, State> {
  state = {
    expanded: undefined,
    orderBy: 'name' as orderByTypes,
    orderAsc: true,
  }
  private orderAccessors = {
    name: (_) => (_.name || '').toLowerCase(),
    total: (_) => _.numMembers * 1000 + _.elected,
    votes: (_) => +_.votesAbsolute || 0,
    gold: (_) => _.gold || 0,
    commision: (_) => _.commission || 0,
    rewards: (_) => _.rewards || 0,
    uptime: (_) => _.uptime || 0,
    attestation: (_) => _.attestation || 0,
  }
  private defaultOrderAccessor = 'name'
  private cachedCleanData: CeloGroup[]
  private orderByFn: { [by: string]: any } = {}

  constructor(...args) {
    super(args[0], args[1])

    Object.keys(this.orderAccessors).forEach(
      (orderType: any) => (this.orderByFn[orderType] = () => this.orderBy(orderType))
    )
  }

  expand(expanded: number) {
    if (this.state.expanded === expanded) {
      this.setState({ expanded: undefined })
    } else {
      this.setState({ expanded })
    }
  }

  orderBy(orderBy: orderByTypes) {
    let orderAsc = true
    if (orderBy === this.state.orderBy) {
      orderAsc = !this.state.orderAsc
    }
    this.setState({ orderBy, orderAsc })
  }

  cleanData({ celoValidatorGroups, latestBlock }: ValidatorsListProps['data']) {
    if (this.cachedCleanData) {
      return this.cachedCleanData
    }
    const totalVotes: BigNumber = celoValidatorGroups
      .map(({ receivableVotes }) => new BigNumber(receivableVotes))
      .reduce((acc: BigNumber, _) => acc.plus(_), new BigNumber(0))

    const getClaims = (claims: any): string[] =>
      claims.edges
        .map(({ node }) => node)
        .filter(({ verified }) => verified)
        .map(({ element }) => element)

    const cleanData = celoValidatorGroups
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
          return {
            name: group.name,
            address: group.address,
            usd: weiToDecimal(+group.usd),
            gold: weiToDecimal(+group.lockedGold),
            receivableVotes: receivableVotesPer.toString(),
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
                gold: weiToDecimal(+lockedGold),
                elected: lastElected >= latestBlock,
                online: lastOnline >= latestBlock,
                uptime: (+score * 100) / 10 ** 24,
                attestation:
                  Math.max(0, attestationsFulfilled / (attestationsRequested || -1)) * 100,
                claims: getClaims(validator.account.claims),
              }
            }),
          }
        }
      )
      .map((group, id) => {
        const data = group.validators.reduce(
          ({ elected, online, total, uptime, attestation }, validator) => ({
            elected: elected + +validator.elected,
            online: online + +validator.online,
            total: total + 1,
            uptime: uptime + validator.uptime,
            attestation: attestation + validator.attestation,
          }),
          { elected: 0, online: 0, total: 0, uptime: 0, attestation: 0 }
        )
        data.uptime = data.uptime / group.validators.length
        data.attestation = data.attestation / group.validators.length
        return {
          id,
          ...group,
          ...data,
        }
      })
      .filter(({ address }, i, list) => list.findIndex((_) => _.address === address) === i)
    this.cachedCleanData = cleanData
    return cleanData
  }

  sortData<T>(data: T[]): T[] {
    const { orderBy, orderAsc } = this.state
    const accessor = this.orderAccessors[orderBy]
    const dAccessor = this.orderAccessors[this.defaultOrderAccessor]
    const dir = orderAsc ? 1 : -1

    return (data || [])
      .sort((a: any, b: any) => b.id - a.id)
      .sort((a, b) => (dAccessor(a) > dAccessor(b) ? -1 : 1))
      .sort((a, b) => dir * (accessor(a) > accessor(b) ? 1 : -1))
  }

  render() {
    const { expanded, orderBy, orderAsc } = this.state
    const { data } = this.props
    const validatorGroups = !data ? ([] as CeloGroup[]) : this.sortData(this.cleanData(data))
    return (
      <View style={[styles.cover, styles.pStatic]}>
        <View style={[styles.pStatic]}>
          <H1 style={[textStyles.center, standardStyles.sectionMarginTablet, textStyles.invert]}>
            Validator Explorer
          </H1>
          <View style={[styles.table, styles.pStatic]}>
            <View style={[styles.tableRow, styles.tableHeaderRow]}>
              <HeaderCell
                onClick={this.orderByFn.name}
                style={[styles.tableHeaderCellPadding]}
                name="Name"
                order={orderBy === 'name' ? orderAsc : null}
              />
              <HeaderCell
                onClick={this.orderByFn.total}
                style={[styles.sizeM]}
                name="Elected/ Total"
                order={orderBy === 'total' ? orderAsc : null}
              />
              <HeaderCell
                onClick={this.orderByFn.votes}
                style={[styles.sizeXL]}
                name="Votes Available"
                order={orderBy === 'votes' ? orderAsc : null}
              />
              <HeaderCell
                onClick={this.orderByFn.gold}
                style={[styles.sizeM]}
                name="Locked CGLD"
                order={orderBy === 'gold' ? orderAsc : null}
              />
              <HeaderCell
                onClick={this.orderByFn.commision}
                style={[styles.sizeM]}
                name="Group Share"
                order={orderBy === 'commision' ? orderAsc : null}
              />
              <HeaderCell
                onClick={this.orderByFn.rewards}
                style={[styles.sizeM]}
                name="Voter Rewards"
                order={orderBy === 'rewards' ? orderAsc : null}
              />
              <HeaderCell
                onClick={this.orderByFn.uptime}
                style={[styles.sizeS]}
                name="Uptime"
                order={orderBy === 'uptime' ? orderAsc : null}
              />
              <HeaderCell
                onClick={this.orderByFn.attestation}
                style={[styles.sizeS]}
                name="Attestation"
                order={orderBy === 'attestation' ? orderAsc : null}
              />
            </View>
            {validatorGroups.map((group, i) => (
              <div key={group.id} onClick={this.expand.bind(this, i)}>
                <ValidatorsListRow group={group} expanded={expanded === i} />
              </div>
            ))}
          </View>
        </View>
      </View>
    )
  }
}

export default withNamespaces('dev')(ValidatorsList)
