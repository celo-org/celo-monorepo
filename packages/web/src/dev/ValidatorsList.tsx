import { BigNumber } from 'bignumber.js'
import * as React from 'react'
import { StyleSheet, Text as RNText, View } from 'react-native'
import CopyToClipboard from 'src/dev/CopyToClipboard'
import ProgressCutBar from 'src/dev/ProgressCutBar'
import { H1 } from 'src/fonts/Fonts'
import { I18nProps, withNamespaces } from 'src/i18n'
import Chevron, { Direction } from 'src/icons/chevron'
import { HEADER_HEIGHT } from 'src/shared/Styles'
import { colors, standardStyles, textStyles, typeFaces } from 'src/styles'
import { cutAddress, formatNumber, weiToDecimal } from 'src/utils/utils'

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

interface ValidatorsListProps {
  data: any
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

class ValidatorsListApp extends React.PureComponent<ValidatorsListProps & I18nProps, State> {
  state = {
    expanded: undefined,
    orderBy: 'name' as orderByTypes,
    orderAsc: true,
  }
  private orderAccessors = {
    name: (_) => _.name.toLowerCase(),
    total: (_) => _.numMembers * 1000 + _.elected,
    votes: (_) => +_.votesAbsolute,
    gold: (_) => _.gold,
    commision: (_) => _.commission,
    rewards: (_) => _.rewards,
    uptime: (_) => _.uptime,
    attestation: (_) => _.attestation,
  }
  private defaultOrderAccessor = 'name'
  private cachedCleanData

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

  cleanData({ celoValidatorGroups, latestBlock }: any) {
    if (this.cachedCleanData) {
      return this.cachedCleanData
    }
    const totalVotes: BigNumber = celoValidatorGroups
      .map(({ receivableVotes }) => new BigNumber(receivableVotes))
      .reduce((acc: BigNumber, _) => acc.plus(_), new BigNumber(0))

    this.cachedCleanData = celoValidatorGroups
      .map(
        ({ account, affiliates, votes, receivableVotes, commission, numMembers, rewardsRatio }) => {
          const group = account
          const rewards = rewardsRatio === null ? null : Math.round(rewardsRatio * 100 * 10) / 10
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
            usd: weiToDecimal(group.usd),
            gold: weiToDecimal(group.lockedGold),
            receivableVotes: receivableVotesPer.toString(),
            votes: votesPer.toString(),
            votesAbsolute: votesAbsolutePer.toString(),
            commission: (+commission * 100) / 10 ** 24,
            rewards,
            rewardsStyle,
            numMembers,
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
                usd: weiToDecimal(usd),
                gold: weiToDecimal(lockedGold),
                elected: lastElected >= latestBlock,
                online: lastOnline >= latestBlock,
                uptime: (+score * 100) / 10 ** 24,
                attestation:
                  Math.max(0, attestationsFulfilled / (attestationsRequested || -1)) * 100,
              }
            }),
          }
        }
      )
      .map((group) => {
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
          ...group,
          ...data,
        }
      })
    return this.cachedCleanData
  }

  sortData(data: any[]) {
    const { orderBy, orderAsc } = this.state
    const accessor = this.orderAccessors[orderBy]
    const dAccessor = this.orderAccessors[this.defaultOrderAccessor]
    const dir = orderAsc ? 1 : -1

    return data
      .sort((a, b) => (dAccessor(a) > dAccessor(b) ? -1 : 1))
      .sort((a, b) => dir * (accessor(a) > accessor(b) ? 1 : -1))
  }

  render() {
    const { expanded, orderBy, orderAsc } = this.state
    const { data } = this.props
    const validatorGroups = this.sortData(data ? this.cleanData(data) : [])
    return (
      <View style={[styles.cover, styles.pStatic]}>
        <View style={[styles.pStatic]}>
          <H1 style={[textStyles.center, standardStyles.sectionMarginTablet, textStyles.invert]}>
            Validator Explorer
          </H1>
          <View style={[styles.table, styles.pStatic]}>
            <View style={[styles.tableRow, styles.tableHeaderRow]}>
              <HeaderCell
                onClick={this.orderBy.bind(this, 'name')}
                style={[styles.tableHeaderCellPadding]}
                name="Name"
                order={orderBy === 'name' ? orderAsc : null}
              />
              <HeaderCell
                onClick={this.orderBy.bind(this, 'total')}
                style={[styles.sizeM]}
                name="Elected/ Total"
                order={orderBy === 'total' ? orderAsc : null}
              />
              <HeaderCell
                onClick={this.orderBy.bind(this, 'votes')}
                style={[styles.sizeXL]}
                name="Votes Available"
                order={orderBy === 'votes' ? orderAsc : null}
              />
              <HeaderCell
                onClick={this.orderBy.bind(this, 'gold')}
                style={[styles.sizeM]}
                name="Locked CGLD"
                order={orderBy === 'gold' ? orderAsc : null}
              />
              <HeaderCell
                onClick={this.orderBy.bind(this, 'commision')}
                style={[styles.sizeM]}
                name="Group Share"
                order={orderBy === 'commision' ? orderAsc : null}
              />
              <HeaderCell
                onClick={this.orderBy.bind(this, 'rewards')}
                style={[styles.sizeM]}
                name="Voter Rewards"
                order={orderBy === 'rewards' ? orderAsc : null}
              />
              <HeaderCell
                onClick={this.orderBy.bind(this, 'uptime')}
                style={[styles.sizeS]}
                name="Uptime"
                order={orderBy === 'uptime' ? orderAsc : null}
              />
              <HeaderCell
                onClick={this.orderBy.bind(this, 'attestation')}
                style={[styles.sizeS]}
                name="Attestation"
                order={orderBy === 'attestation' ? orderAsc : null}
              />
            </View>
            {validatorGroups.map((group, i) => (
              <View key={group.address}>
                <View style={[styles.tableRow, styles.tableRowCont]}>
                  <View
                    style={[styles.tableCell, styles.tableCellTitle]}
                    onClick={this.expand.bind(this, i)}
                  >
                    <Text style={[styles.tableCell, styles.tableCellTitleArrow]}>
                      <Chevron
                        direction={i === expanded ? Direction.down : Direction.right}
                        opacity={i === expanded ? 1 : 0.4}
                        color={colors.white}
                        size={10}
                      />
                    </Text>
                    <Text style={[styles.tableCellTitleRows]}>
                      <Text
                        style={[styles.tableCellTitleFirstRow]}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                      >
                        {group.name}
                      </Text>
                      <Text style={[styles.tableCellTitleSecRow]}>
                        <Text style={[styles.address]}>{cutAddress(group.address)}</Text>
                        <CopyToClipboard content={group.address} />
                      </Text>
                    </Text>
                  </View>
                  <Text
                    style={[styles.tableCell, styles.tableCellCenter, styles.sizeM]}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    <Text style={[styles.numberBlock, styles.numberBlockFirst]}>
                      {group.elected}
                    </Text>
                    <Text style={[styles.numberBlock]}>{group.numMembers}</Text>
                  </Text>
                  <Text style={[styles.tableCell, styles.sizeXL, styles.tableCellBars]}>
                    <Text style={[styles.tableCellBarsValue]}>
                      {formatNumber(group.votesAbsolute, 1)}%
                    </Text>
                    <Text style={[styles.tableCellBarsRows]}>
                      <Text style={[styles.tableCellBarsRowValues]}>
                        {formatNumber(group.votes, 1)}% of {formatNumber(group.receivableVotes, 1)}%
                      </Text>
                      <ProgressCutBar
                        bars={Math.floor(+group.receivableVotes * 2) || 1}
                        progress={Math.floor(+group.votes)}
                      />
                    </Text>
                  </Text>
                  <Text
                    style={[styles.tableCell, styles.tableCellCenter, styles.sizeM]}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {formatNumber(group.gold, 0)}
                  </Text>
                  <Text
                    style={[styles.tableCell, styles.tableCellCenter, styles.sizeM]}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {formatNumber(group.commission, 0)}%
                  </Text>
                  <Text
                    style={[styles.tableCell, styles.tableCellCenter, styles.sizeM]}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    <Text>
                      {group.rewards === null ? 'n/a' : formatNumber(group.rewards, 1) + '%'}
                    </Text>
                    <Text style={[styles.barContainer]}>
                      <Text
                        style={[styles.bar, group.rewardsStyle, { width: `${group.rewards}%` }]}
                      />
                    </Text>
                  </Text>
                  <Text
                    style={[styles.tableCell, styles.tableCellCenter, styles.sizeS]}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {formatNumber(group.uptime, 1)}%
                  </Text>
                  <Text
                    style={[styles.tableCell, styles.tableCellCenter, styles.sizeS]}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {formatNumber(group.attestation, 1)}%
                  </Text>
                </View>
                {i === expanded && (
                  <View>
                    {group.validators.map((validator, j) => (
                      <View key={`${group.address}.${j}`} style={[styles.tableRow]}>
                        <Text
                          style={[
                            styles.tableCell,
                            styles.tableCellTitle,
                            styles.tableSecondaryCell,
                          ]}
                          numberOfLines={1}
                          ellipsizeMode="tail"
                        >
                          <Text style={[styles.tableCell, styles.tableCellTitleNumber]}>
                            {j + 1}
                          </Text>
                          <Text style={[styles.tableCellTitleRows]}>
                            <Text
                              style={[styles.tableCellTitleFirstRow, styles.tableSecondaryCell]}
                            >
                              {validator.name}
                            </Text>
                            <Text
                              style={[
                                styles.tableCellTitleSecRow,
                                styles.tableCellTitleSecondarySecRow,
                              ]}
                            >
                              <Text style={[styles.address]}>{cutAddress(validator.address)}</Text>
                              <CopyToClipboard content={validator.address} />
                            </Text>
                          </Text>
                        </Text>
                        <Text
                          style={[styles.tableSecondaryCell, styles.sizeM]}
                          numberOfLines={1}
                          ellipsizeMode="tail"
                        >
                          <View
                            style={[
                              styles.circle,
                              styles[validator.elected ? 'circleOk' : 'circleError'],
                            ]}
                          />
                        </Text>
                        <Text style={[styles.tableCell, styles.sizeXL]} />
                        <Text
                          style={[
                            styles.tableCell,
                            styles.tableCellCenter,
                            styles.tableSecondaryCell,
                            styles.sizeM,
                          ]}
                          numberOfLines={1}
                          ellipsizeMode="tail"
                        >
                          {formatNumber(validator.gold, 0)}
                        </Text>
                        <Text style={[styles.tableCell, styles.sizeM]} />
                        <Text style={[styles.tableCell, styles.sizeM]} />
                        <Text
                          style={[
                            styles.tableCell,
                            styles.tableCellCenter,
                            styles.tableSecondaryCell,
                            styles.sizeS,
                          ]}
                          numberOfLines={1}
                          ellipsizeMode="tail"
                        >
                          {formatNumber(validator.uptime, 1)}%
                        </Text>
                        <Text
                          style={[
                            styles.tableCell,
                            styles.tableCellCenter,
                            styles.tableSecondaryCell,
                            styles.sizeS,
                          ]}
                          numberOfLines={1}
                          ellipsizeMode="tail"
                        >
                          {formatNumber(validator.attestation, 1)}%
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </View>
        </View>
      </View>
    )
  }
}

export default withNamespaces('dev')(ValidatorsListApp)

const styles = StyleSheet.create({
  pStatic: {
    position: 'static',
    zIndex: 'initial',
  } as any,
  content: {
    paddingBottom: 10,
  },
  cover: {
    marginTop: HEADER_HEIGHT,
    backgroundColor: colors.dark,
    maxWidth: '100vw',
  },
  defaultText: {
    fontFamily: typeFaces.futura,
    color: colors.white,
  },
  address: {
    color: colors.grayHeavy,
  },

  // Table
  table: {
    width: 1020,
    margin: 'auto',
    marginBottom: 100,
  },
  tableRow: {
    display: 'flex',
    justifyContent: 'space-between',
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  tableRowCont: {
    paddingTop: 10,
  },
  tableHeaderRow: {
    borderBottomWidth: 1,
    borderStyle: 'solid',
    borderColor: 'rgba(255, 255, 255, 0.2)',
    zIndex: 2,
    top: 0,
    backgroundColor: colors.dark,
    ...({
      position: 'sticky',
      boxShadow: `960px 0 ${colors.dark}, -960px 0 ${colors.dark}`,
    } as any),
  },
  tableHeaderCell: {
    fontSize: 16,
    lineHeight: 20,
    paddingHorizontal: 10,
    paddingVertical: 24,
    textAlign: 'center',
    flexGrow: 0,
    cursor: 'pointer',
    flexDirection: 'row',
    alignItems: 'center',
  },
  tableHeaderCellPadding: {
    textAlign: 'left',
    paddingLeft: 20 + 24,
    flexGrow: 1,
  },
  tableHeaderCellLeft: {
    textAlign: 'left',
  },
  tableHeaderCellArrow: {
    opacity: 0,
    paddingLeft: 6,
  },
  tableHeaderCellArrowVisible: {
    opacity: 0.6,
  },
  tableCell: {
    paddingVertical: 12,
    paddingHorizontal: 10,
    fontSize: 16,
    flexGrow: 0,
  },
  tableCellTitle: {
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'row',
    overflow: 'hidden',
    flexGrow: 1,
    width: 226,
  },
  tableCellTitleRows: {
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  tableCellTitleFirstRow: {
    textDecorationLine: 'underline',
    fontWeight: '500',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
  },
  tableCellTitleSecRow: {
    display: 'flex',
    flexDirection: 'row',
    color: colors.grayHeavy,
    fontSize: 14,
    paddingTop: 10,
    fontWeight: 'normal',
  },
  tableCellTitleSecondarySecRow: {
    paddingTop: 2,
  },
  tableCellTitleArrow: {
    marginLeft: 15,
    marginRight: 20,
    width: 20,
    textAlign: 'center',
  },
  tableCellTitleNumber: {
    marginLeft: 20 + 20,
    marginRight: 24,
    width: 10,
    fontSize: 14,
    textAlign: 'center',
  },
  tableCellHighlight: {
    color: colors.primary,
  },
  tableCellHighlightError: {
    color: colors.error,
  },
  tableCellCenter: {
    textAlign: 'center',
  },
  tableSecondaryCell: {
    fontSize: 14,
  },
  tableCellBars: {
    display: 'flex',
    flexDirection: 'row',
  },
  tableCellBarsValue: {
    paddingRight: 8,
    fontWeight: '500',
    fontSize: 14,
  },
  tableCellBarsRows: {},
  tableCellBarsRowValues: {
    fontSize: 14,
    fontWeight: '500',
    paddingBottom: 2,
    display: 'flex',
    color: colors.grayHeavy,
  },

  // Column sizes
  sizeXS: { minWidth: 64 + 6, maxWidth: 64 + 6 },
  sizeS: { minWidth: 74 + 6, maxWidth: 74 + 6 },
  sizeM: { minWidth: 110 + 6, maxWidth: 110 + 6 },
  sizeL: { minWidth: 154 + 6, maxWidth: 154 + 6 },
  sizeXL: { minWidth: 170, maxWidth: 170 },

  // Circle
  circle: {
    display: 'block',
    width: 8,
    height: 8,
    borderRadius: 4,
    margin: 'auto',
  },
  circleOk: {
    backgroundColor: colors.gold,
  },
  circleError: {
    backgroundColor: 'transprent',
  },

  // Number block
  numberBlockContainer: {
    display: 'flex',
    flexDirection: 'row',
  },
  numberBlock: {
    borderTopWidth: 0,
    borderBottomWidth: 0,
    borderRightWidth: 0,
    paddingHorizontal: 10,
    borderLeftWidth: 1,
    borderLeftColor: colors.grayHeavy,
    border: 'solid',
  },
  numberBlockFirst: {
    borderLeftWidth: 0,
  },

  // Bar
  barContainer: {
    width: 40,
    height: 20,
    display: 'inline-flex',
    marginLeft: 8,
    position: 'relative',
    top: 4,
  },
  bar: {
    height: 20,
    display: 'inline-flex',
    borderRadius: 2,
  },
  barOk: {
    backgroundColor: colors.primary,
  },
  barWarn: {
    backgroundColor: colors.gold,
  },
  barKo: {
    backgroundColor: colors.red,
  },
})
