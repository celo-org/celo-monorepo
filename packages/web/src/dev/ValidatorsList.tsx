import * as React from 'react'
import { Text, View } from 'react-native'
import ValidatorsListRow, { CeloGroup } from 'src/dev/ValidatorsListRow'
import { styles } from 'src/dev/ValidatorsListStyles'
import { I18nProps, withNamespaces } from 'src/i18n'
import Chevron, { Direction } from 'src/icons/chevron'
import Hoverable from 'src/shared/Hoverable'
import { colors } from 'src/styles'
import { cleanData, isPinned, ValidatorsListProps } from 'src/utils/validators'

interface HeaderCellProps {
  style: any[]
  name: string
  order: boolean | null
  tooltip?: string
  onClick: () => void
}

class HeaderCell extends React.PureComponent<HeaderCellProps, { hover: boolean }> {
  state = {
    hover: false,
  }

  onHoverIn = () => this.setState({ hover: true })
  onHoverOut = () => this.setState({ hover: false })

  render() {
    const { style, name, order, onClick, tooltip } = this.props
    const { hover } = this.state
    return (
      <Hoverable onHoverIn={this.onHoverIn} onHoverOut={this.onHoverOut}>
        <View onClick={onClick} style={[styles.tableHeaderCell, ...((style || []) as any)]}>
          <Text style={styles.defaultText}>{name}</Text>
          <Text
            style={[
              styles.defaultText,
              styles.tableHeaderCellArrow,
              ...(order !== null ? [styles.tableHeaderCellArrowVisible] : []),
            ]}
          >
            <Chevron
              direction={order ? Direction.up : Direction.down}
              color={colors.white}
              size={10}
            />
          </Text>

          {tooltip && hover && (
            <Text style={[styles.defaultText, styles.tooltip, styles.tooltipHeader]}>
              {tooltip}
            </Text>
          )}
        </View>
      </Hoverable>
    )
  }
}

type Props = ValidatorsListProps & I18nProps

type orderByTypes =
  | 'name'
  | 'total'
  | 'votes'
  | 'rawVotes'
  | 'votesAvailables'
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

// tslint:disable-next-line
class ValidatorsList extends React.PureComponent<Props, State> {
  state = {
    expanded: undefined,
    orderBy: undefined,
    orderAsc: true,
  }
  private orderAccessors = {
    order: (_) => _.order,
    name: (_) => (_.name || '').toLowerCase() || null,
    total: (_) => _.numMembers * 1000 + _.elected,
    votes: (_) => +_.votesAbsolute || 0,
    rawVotes: (_) => _.votesRaw || 0,
    votesAvailables: (_) => _.receivableRaw || 0,
    gold: (_) => _.gold || 0,
    commision: (_) => _.commission || 0,
    rewards: (_) => _.rewards || 0,
    uptime: (_) => _.uptime || 0,
    attestation: (_) => _.attestation || 0,
  }
  private defaultOrderAccessor = 'order'
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

  sortData({ celoValidatorGroups, latestBlock }: ValidatorsListProps['data']): CeloGroup[] {
    // Clean data if not already cached
    const data = this.cachedCleanData
      ? this.cachedCleanData
      : cleanData({ celoValidatorGroups, latestBlock })
    this.cachedCleanData = data

    const { orderBy, orderAsc } = this.state
    const accessor = this.orderAccessors[orderBy] || (() => 0)
    const dAccessor = this.orderAccessors[this.defaultOrderAccessor]
    const dir = orderAsc ? 1 : -1

    const compare = (a, b): number => {
      if (a === null) {
        return 1
      }
      if (b === null) {
        return -1
      }
      return a > b ? 1 : -1
    }

    return (data || [])
      .sort((a, b) => compare(dAccessor(a), dAccessor(b)))
      .sort((a, b) => dir * compare(accessor(a), accessor(b)))
      .sort((a, b) => isPinned(b) - isPinned(a))
  }

  onPinned() {
    this.setState({ update: Math.random() } as any)
  }

  render() {
    const { expanded, orderBy, orderAsc } = this.state
    const { data } = this.props
    const validatorGroups = !data ? ([] as CeloGroup[]) : this.sortData(data)
    const onPinned = () => this.onPinned()
    return (
      <View style={styles.pStatic}>
        <View style={[styles.table, styles.pStatic]}>
          <View style={[styles.tableRow, styles.tableHeaderRow]}>
            <View style={[styles.tableHeaderCell, styles.sizeXXS]}>
              <Text style={styles.defaultText}>Pin</Text>
            </View>
            <HeaderCell
              onClick={this.orderByFn.name}
              style={[styles.tableHeaderCellPadding]}
              name="Name"
              order={orderBy === 'name' ? orderAsc : null}
              tooltip="Name of validator group and validators in it"
            />
            <HeaderCell
              onClick={this.orderByFn.total}
              style={[styles.sizeM]}
              name="Elected/ Total"
              order={orderBy === 'total' ? orderAsc : null}
              tooltip="Number of validators in the group"
            />
            <HeaderCell
              onClick={this.orderByFn.votes}
              style={[styles.sizeXL]}
              name="Votes Available"
              order={orderBy === 'votes' ? orderAsc : null}
              tooltip="% of total locked CELO votes received"
            />
            <HeaderCell
              onClick={this.orderByFn.rawVotes}
              style={[styles.sizeM]}
              name="Votes"
              order={orderBy === 'rawVotes' ? orderAsc : null}
              tooltip="Votes received as a percentage of capacity"
            />
            <HeaderCell
              onClick={this.orderByFn.votesAvailables}
              style={[styles.sizeM]}
              name="Votes Available"
              order={orderBy === 'votesAvailables' ? orderAsc : null}
              tooltip="Vote capacity as a percentage of total locked CELO"
            />
            <HeaderCell
              onClick={this.orderByFn.gold}
              style={[styles.sizeM]}
              name="Locked CELO"
              order={orderBy === 'gold' ? orderAsc : null}
            />
            <HeaderCell
              onClick={this.orderByFn.commision}
              style={[styles.sizeM]}
              name="Group Share"
              order={orderBy === 'commision' ? orderAsc : null}
              tooltip="Amount of CELO locked by group/validator"
            />
            <HeaderCell
              onClick={this.orderByFn.rewards}
              style={[styles.sizeM]}
              name="Voter Rewards"
              order={orderBy === 'rewards' ? orderAsc : null}
              tooltip="% of max possible rewards received"
            />
            {/* <HeaderCell
              onClick={this.orderByFn.uptime}
              style={[styles.sizeS]}
              name="Uptime"
              order={orderBy === 'uptime' ? orderAsc : null}
              tooltip="Validator performance score"
            /> */}
            <HeaderCell
              onClick={this.orderByFn.attestation}
              style={[styles.sizeS]}
              name="Attestation"
              order={orderBy === 'attestation' ? orderAsc : null}
            />
          </View>
          {validatorGroups.map((group, i) => (
            <div key={i} onClick={this.expand.bind(this, i)}>
              <ValidatorsListRow onPinned={onPinned} group={group} expanded={expanded === i} />
            </div>
          ))}
        </View>
      </View>
    )
  }
}

export default withNamespaces('dev')(ValidatorsList)
