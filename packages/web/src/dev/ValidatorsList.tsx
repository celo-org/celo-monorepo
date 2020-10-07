import * as React from 'react'
import { Text, View } from 'react-native'
import ValidatorsListRow from 'src/dev/ValidatorsListRow'
import { styles } from 'src/dev/ValidatorsListStyles'
import { I18nProps, withNamespaces } from 'src/i18n'
import Chevron, { Direction } from 'src/icons/chevron'
import Hoverable from 'src/shared/Hoverable'
import { colors } from 'src/styles'
import { Address, CeloGroup, orderAccessors, sortData } from 'src/utils/validators'

interface HeaderCellProps {
  style: any[]
  name: string // title of the header cell
  ordered: boolean // is this column determining order of table?
  asc: boolean // is it ordered ascending?
  tooltip?: string // text for the tooltip, no tooltip if left empty
  orderFn: () => void // function executed when header cell is clicked, used to order table
}

class HeaderCell extends React.PureComponent<HeaderCellProps, { hover: boolean }> {
  state = {
    hover: false,
  }

  onHoverIn = () => this.setState({ hover: true })
  onHoverOut = () => this.setState({ hover: false })

  render() {
    const { asc, style, name, ordered, orderFn, tooltip } = this.props
    const { hover } = this.state
    return (
      <Hoverable onHoverIn={this.onHoverIn} onHoverOut={this.onHoverOut} onPress={orderFn}>
        <View style={[styles.tableHeaderCell, style]}>
          <Text style={styles.defaultText}>{name}</Text>
          <Text
            style={[
              styles.defaultText,
              styles.tableHeaderCellArrow,
              ordered && styles.tableHeaderCellArrowVisible,
              ordered && !asc && styles.tableHeaderCellArrowDesc,
            ]}
          >
            <Chevron direction={Direction.up} color={colors.white} size={10} />
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

export interface ValidatorsListProps {
  data: CeloGroup[]
  isLoading: boolean
}

type Props = ValidatorsListProps & I18nProps

type orderByTypes =
  | 'order'
  | 'name'
  | 'total'
  | 'votes'
  | 'rawVotes'
  | 'votesAvailables'
  | 'celo'
  | 'commission'
  | 'rewards'
  | 'uptime'
  | 'attestation'

export interface State {
  expanded: Address | undefined
  orderKey: orderByTypes
  orderAsc: boolean
  sortedData: CeloGroup[]
}

class ValidatorsList extends React.PureComponent<Props, State> {
  state = {
    expanded: undefined,
    orderKey: 'order' as orderByTypes,
    orderAsc: true,
    sortedData: [],
  }
  private orderByFn: { [by: string]: any } = {}

  constructor(...args) {
    super(args[0], args[1])

    Object.keys(orderAccessors).forEach(
      (orderType: any) => (this.orderByFn[orderType] = () => this.orderBy(orderType))
    )

    const { data } = this.props
    const { orderAsc, orderKey } = this.state
    this.state.sortedData = sortData(data, orderAsc, orderKey)
  }

  setData = () => {
    const { orderAsc, orderKey } = this.state
    const sortedData = sortData(this.props.data, orderAsc, orderKey)
    this.setState({ sortedData })
    this.forceUpdate()
  }

  expand(expanded: Address) {
    if (this.state.expanded === expanded) {
      return this.setState({ expanded: undefined })
    }
    this.setState({ expanded })
  }

  orderBy = async (key: orderByTypes) => {
    const { orderAsc, orderKey } = this.state
    const asc = key === orderKey && orderAsc ? false : true
    await this.setState({ orderKey: key, orderAsc: asc, expanded: undefined })
    this.setData()
  }

  render() {
    const { expanded, orderAsc, orderKey, sortedData: validatorGroups } = this.state
    return (
      <View style={styles.pStatic}>
        <View style={[styles.table, styles.pStatic]}>
          <View style={[styles.tableRow, styles.tableHeaderRow]}>
            <View style={[styles.tableHeaderCell, styles.sizeXXS]}>
              <Text style={styles.defaultText}>Pin</Text>
            </View>
            <HeaderCell
              orderFn={this.orderByFn.name}
              style={[styles.tableHeaderCellPadding]}
              name="Name"
              ordered={orderKey === 'name'}
              asc={orderAsc}
              tooltip="Name of validator group and validators in it"
            />
            <HeaderCell
              orderFn={this.orderByFn.total}
              style={[styles.sizeM]}
              name="Elected/ Total"
              ordered={orderKey === 'total'}
              asc={orderAsc}
              tooltip="Number of validators in the group"
            />
            <HeaderCell
              orderFn={this.orderByFn.votes}
              style={[styles.sizeXL]}
              name="Votes Available"
              ordered={orderKey === 'votes'}
              asc={orderAsc}
              tooltip="% of total locked CELO votes received"
            />
            <HeaderCell
              orderFn={this.orderByFn.rawVotes}
              style={[styles.sizeM]}
              name="Votes"
              ordered={orderKey === 'rawVotes'}
              asc={orderAsc}
              tooltip="Votes received as a percentage of capacity"
            />
            <HeaderCell
              orderFn={this.orderByFn.votesAvailables}
              style={[styles.sizeM]}
              name="Votes Available"
              ordered={orderKey === 'votesAvailables'}
              asc={orderAsc}
              tooltip="Vote capacity as a percentage of total locked CELO"
            />
            <HeaderCell
              orderFn={this.orderByFn.celo}
              style={[styles.sizeM]}
              name="Locked CELO"
              ordered={orderKey === 'celo'}
              asc={orderAsc}
            />
            <HeaderCell
              orderFn={this.orderByFn.commission}
              style={[styles.sizeM]}
              name="Group Share"
              ordered={orderKey === 'commission'}
              asc={orderAsc}
              tooltip="Amount of CELO locked by group/validator"
            />
            <HeaderCell
              orderFn={this.orderByFn.rewards}
              style={[styles.sizeM]}
              name="Voter Rewards"
              ordered={orderKey === 'rewards'}
              asc={orderAsc}
              tooltip="% of max possible rewards received"
            />
            {/* <HeaderCell
              onClick={this.orderByFn.uptime}
              style={[styles.sizeS]}
              name="Uptime"
              ordered={orderKey === 'uptime'}
              asc={orderAsc}
              tooltip="Validator performance score"
            /> */}
            <HeaderCell
              orderFn={this.orderByFn.attestation}
              style={[styles.sizeS]}
              name="Attestation"
              ordered={orderKey === 'attestation'}
              asc={orderAsc}
            />
          </View>
          {validatorGroups.map((group, i) => (
            <div key={i} onClick={this.expand.bind(this, group.address)}>
              <ValidatorsListRow
                group={group}
                expanded={expanded === group.address}
                onPinned={this.setData}
              />
            </div>
          ))}
        </View>
      </View>
    )
  }
}

export default withNamespaces('dev')(ValidatorsList)
