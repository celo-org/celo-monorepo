import { BigNumber } from 'bignumber.js'
import * as React from 'react'
import { StyleSheet, Text, View } from 'react-native'
// import css from 'src/dev/ValidatorsList.scss'
import { H1 } from 'src/fonts/Fonts'
import { I18nProps, withNamespaces } from 'src/i18n'
import Chevron, { Direction } from 'src/icons/chevron'
import { HEADER_HEIGHT } from 'src/shared/Styles'
import { colors, standardStyles, textStyles, typeFaces } from 'src/styles'
import { copyToClipboad, cutAddress, formatNumber, weiToDecimal } from 'src/utils/utils'

interface ValidatorsListProps {
  data: any
  isLoading: boolean
}

export interface State {
  expanded: number | undefined
}

class ValidatorsListApp extends React.PureComponent<ValidatorsListProps & I18nProps, State> {
  state = {
    expanded: undefined,
  }

  expand(expanded: number) {
    if (this.state.expanded === expanded) {
      this.setState({ expanded: undefined })
    } else {
      this.setState({ expanded })
    }
  }

  cleanData({ celoValidatorGroups, latestBlock }: any) {
    const totalVotes: BigNumber = celoValidatorGroups
      .map(({ votes }) => new BigNumber(votes))
      .reduce((acc: BigNumber, _) => acc.plus(_), new BigNumber(0))

    return celoValidatorGroups
      .map(({ account, affiliates, votes }) => {
        const group = account
        const rewards = 50 + Math.random() * 50
        const rewardsStyle =
          rewards < 70 ? styles.barKo : rewards < 90 ? styles.barWarn : styles.barOk
        return {
          name: group.name,
          address: group.address,
          usd: weiToDecimal(group.usd),
          gold: weiToDecimal(group.lockedGold),
          votes: new BigNumber(votes)
            .dividedBy(totalVotes)
            .multipliedBy(100)
            .toString(),
          rewards, // <-- Mock
          rewardsStyle, // <-- Mock
          validators: affiliates.edges.map((validator) => {
            const {
              address,
              elected,
              online,
              account: { name, usd, lockedGold },
              score,
            } = validator.node
            return {
              name,
              address,
              usd: weiToDecimal(usd),
              gold: weiToDecimal(lockedGold),
              elected: elected === latestBlock,
              online: online === latestBlock,
              uptime: (+score * 100) / 10 ** 24,
            }
          }),
        }
      })
      .map((group) => {
        const data = group.validators.reduce(
          ({ elected, online, uptime }, validator) => ({
            elected: elected + +validator.elected,
            online: online + +validator.online,
            uptime: uptime + validator.uptime,
          }),
          { elected: 0, online: 0, uptime: 0 }
        )
        data.uptime = data.uptime / group.validators.length
        return {
          ...group,
          ...data,
        }
      })
  }

  render() {
    const { expanded } = this.state
    const { data } = this.props
    const validatorGroups = data ? this.cleanData(data) : []
    return (
      <View style={styles.cover}>
        <View>
          <H1 style={[textStyles.center, standardStyles.sectionMarginTablet, textStyles.invert]}>
            Validator Explorer
          </H1>
          <View style={[styles.table]}>
            <View style={[styles.tableRow, styles.tableHeaderRow]}>
              <Text style={[styles.tableHeaderCell, styles.tableHeaderCellPadding]}>Name</Text>
              <Text style={[styles.tableHeaderCell, styles.sizeS]}>Elected/ Total</Text>
              <Text style={[styles.tableHeaderCell, styles.sizeXL]}>Votes Available</Text>
              <Text style={[styles.tableHeaderCell, styles.sizeM]}>Locked CGLD</Text>
              <Text style={[styles.tableHeaderCell, styles.sizeM]}>Group Share</Text>
              <Text style={[styles.tableHeaderCell, styles.sizeM]}>Voter Rewards</Text>
              <Text style={[styles.tableHeaderCell, styles.sizeS]}>Uptime</Text>
            </View>
            {validatorGroups.map((group, i) => (
              <View key={i}>
                <View style={[styles.tableRow]}>
                  <Text
                    style={[styles.tableCell, styles.tableCellTitle]}
                    numberOfLines={1}
                    ellipsizeMode="tail"
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
                      <Text style={[styles.tableCellTitleFirstRow]}>{group.name}</Text>
                      <Text style={[styles.tableCellTitleSecRow]}>
                        <Text>{cutAddress(group.address)}</Text>
                        <Text
                          style={[styles.tableCopy]}
                          onClick={copyToClipboad.bind(this, group.address)}
                        >
                          copy
                        </Text>
                      </Text>
                    </Text>
                  </Text>
                  <Text
                    style={[styles.tableCell, styles.tableCellCenter, styles.sizeS]}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    <Text style={[styles.numberBlock, styles.numberBlockFirst]}>
                      {group.elected}
                    </Text>
                    <Text style={[styles.numberBlock]}>{group.online}</Text>
                  </Text>
                  <Text style={[styles.tableCell, styles.sizeXL]}>3 percentages</Text>
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
                    {formatNumber(12, 0)}%
                  </Text>
                  <Text
                    style={[styles.tableCell, styles.tableCellCenter, styles.sizeM]}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    <Text>{formatNumber(group.rewards, 1)}%</Text>
                    <Text style={[styles.barContainer]}>
                      <Text
                        style={[styles.bar, group.rewardsStyle, { width: `${group.rewards}%` }]}
                      ></Text>
                    </Text>
                  </Text>
                  <Text
                    style={[styles.tableCell, styles.tableCellCenter, styles.sizeS]}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {formatNumber(group.uptime, 1)}%
                  </Text>
                </View>
                {i === 0 /*expanded*/ && (
                  <View>
                    {group.validators.map((validator, j) => (
                      <View key={`${i}.${j}`} style={[styles.tableRow]}>
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
                            <Text style={[styles.tableCellTitleSecRow]}>
                              <Text>{cutAddress(validator.address)}</Text>
                              <Text
                                style={[styles.tableCopy]}
                                onClick={copyToClipboad.bind(this, group.address)}
                              >
                                copy
                              </Text>
                            </Text>
                          </Text>
                        </Text>
                        <Text
                          style={[styles.tableSecondaryCell, styles.sizeXS]}
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
                        <Text style={[styles.tableCell, styles.sizeXL]}></Text>
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
                        <Text style={[styles.tableCell, styles.sizeM]}></Text>
                        <Text style={[styles.tableCell, styles.sizeM]}></Text>
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
  content: {
    paddingBottom: 10,
  },
  cover: {
    marginTop: HEADER_HEIGHT,
    backgroundColor: colors.dark,
    maxWidth: '100vw',
    overflow: 'hidden',
  },

  // Table
  table: {
    width: 960,
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
  tableHeaderRow: {
    borderBottomWidth: 1,
    borderStyle: 'solid',
    borderColor: colors.white,
  },
  tableHeaderCell: {
    color: colors.white,
    fontSize: 16,
    lineHeight: 20,
    paddingHorizontal: 5,
    paddingVertical: 24,
    textAlign: 'center',
    flexGrow: 0,
  },
  tableHeaderCellPadding: {
    textAlign: 'left',
    paddingLeft: 16 + 20 + 24,
    flexGrow: 1,
  },
  tableHeaderCellLeft: {
    textAlign: 'left',
  },
  tableCell: {
    paddingVertical: 12,
    paddingHorizontal: 5,
    color: colors.white,
    fontSize: 16,
    flexGrow: 0,
  },
  tableCellTitle: {
    cursor: 'pointer',
    flexGrow: 1,
    display: 'flex',
    flexDirection: 'row',
  },
  tableCellTitleRows: {
    display: 'flex',
    flexDirection: 'column',
  },
  tableCellTitleFirstRow: {
    textDecorationLine: 'underline',
    fontWeight: '500',
  },
  tableCellTitleSecRow: {
    color: colors.grayHeavy,
    fontSize: 14,
    paddingTop: 10,
    fontWeight: 'normal',
  },
  tableCellTitleArrow: {
    marginLeft: 15,
    marginRight: 20,
    width: 20,
    textAlign: 'center',
  },
  tableCellTitleNumber: {
    marginLeft: 15 + 20 + 20,
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
  tableCopy: {
    fontFamily: typeFaces.futura,
    textTransform: 'uppercase',
    opacity: 0.4,
    fontWeight: '500',
    fontSize: 12,
    position: 'relative',
    top: -0.5,
    marginLeft: 7,
    cursor: 'pointer',
  },
  tableCellCenter: {
    textAlign: 'center',
  },
  tableCellDescription: {
    alignSelf: 'flex-start',
    maxWidth: 280,
    minWidth: 280,
    marginRight: 24,
    marginLeft: 16 + 20 + 24,
    opacity: 0.4,
    fontFamily: typeFaces.garamond,
    color: colors.white,
    fontSize: 16,
  },
  tableCellTableContainer: {
    flexGrow: 1,
    alignSelf: 'flex-start',
    paddingRight: 5,
    maxWidth: 596,
  },
  tableSecondaryCell: {
    fontSize: 14,
  },

  // Column sizes
  sizeXS: { minWidth: 64, maxWidth: 64 },
  sizeS: { minWidth: 74, maxWidth: 74 },
  sizeM: { minWidth: 110, maxWidth: 110 },
  sizeL: { minWidth: 154, maxWidth: 154 },
  sizeXL: { minWidth: 174, maxWidth: 174 },

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
