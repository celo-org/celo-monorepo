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
        return {
          name: group.name,
          address: group.address,
          usd: weiToDecimal(group.usd),
          gold: weiToDecimal(group.lockedGold),
          votes: new BigNumber(votes)
            .dividedBy(totalVotes)
            .multipliedBy(100)
            .toString(),
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
            <View style={[styles.tableRow]}>
              <Text style={[styles.tableHeaderCell, styles.tableHeaderCellPadding]}>Name</Text>
              <Text style={[styles.tableHeaderCell, styles.sizeS]}>Elected</Text>
              <Text style={[styles.tableHeaderCell, styles.sizeS]}>Online</Text>
              <Text style={[styles.tableHeaderCell, styles.tableHeaderCellLeft, styles.sizeXL]}>
                Address
              </Text>
              <Text style={[styles.tableHeaderCell, styles.sizeM]}>Votes received</Text>
              <Text style={[styles.tableHeaderCell, styles.sizeM]}>CUSD</Text>
              <Text style={[styles.tableHeaderCell, styles.sizeM]}>CGLD</Text>
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
                    {group.name}
                  </Text>
                  <Text
                    style={[
                      styles.tableCell,
                      styles.tableCellCenter,
                      group.elected ? styles.tableCellHighlight : styles.tableCellHighlightError,
                      styles.sizeS,
                    ]}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {group.elected}
                  </Text>
                  <Text
                    style={[
                      styles.tableCell,
                      styles.tableCellCenter,
                      group.online ? styles.tableCellHighlight : styles.tableCellHighlightError,
                      styles.sizeS,
                    ]}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {group.online}
                  </Text>
                  <Text style={[styles.tableCell, styles.sizeXL]}>
                    <Text>{cutAddress(group.address)}</Text>
                    <Text
                      style={[styles.tableCopy]}
                      onClick={copyToClipboad.bind(this, group.address)}
                    >
                      copy
                    </Text>
                  </Text>
                  <Text
                    style={[styles.tableCell, styles.tableCellCenter, styles.sizeM]}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {formatNumber(group.votes, 2)}%
                  </Text>
                  <Text
                    style={[styles.tableCell, styles.tableCellCenter, styles.sizeM]}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {formatNumber(group.usd, 2)}
                  </Text>
                  <Text
                    style={[styles.tableCell, styles.tableCellCenter, styles.sizeM]}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {formatNumber(group.gold, 2)}
                  </Text>
                  <Text
                    style={[styles.tableCell, styles.tableCellCenter, styles.sizeS]}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {formatNumber(group.uptime, 1)}%
                  </Text>
                </View>
                {i === expanded && (
                  <View style={[styles.tableRow]}>
                    <Text style={[styles.tableCellDescription]}>{group.description}</Text>
                    <View style={[styles.tableCellTableContainer]}>
                      <View style={[styles.tableRow]}>
                        <Text
                          style={[
                            styles.tableSecondaryHeaderCell,
                            textStyles.left,
                            styles.tableSecondaryHeaderCellTitle,
                          ]}
                        >
                          Name
                        </Text>
                        <Text style={[styles.tableSecondaryHeaderCell, styles.sizeXS]}>
                          Elected
                        </Text>
                        <Text style={[styles.tableSecondaryHeaderCell, styles.sizeXS]}>Online</Text>
                        <Text
                          style={[styles.tableSecondaryHeaderCell, styles.sizeL, textStyles.left]}
                        >
                          Address
                        </Text>
                        <Text style={[styles.tableSecondaryHeaderCell, styles.sizeS]}>USD</Text>
                        <Text style={[styles.tableSecondaryHeaderCell, styles.sizeS]}>CGLD</Text>
                        <Text style={[styles.tableSecondaryHeaderCell, styles.sizeS]}>Uptime</Text>
                      </View>
                      {group.validators.map((validator, j) => (
                        <View key={`${i}.${j}`} style={[styles.tableRow]}>
                          <Text
                            style={[
                              styles.tableSecondaryCell,
                              textStyles.left,
                              styles.tableSecondaryTitleCell,
                            ]}
                            numberOfLines={1}
                            ellipsizeMode="tail"
                          >
                            {validator.name}
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
                          <Text
                            style={[styles.tableSecondaryCell, styles.sizeXS]}
                            numberOfLines={1}
                            ellipsizeMode="tail"
                          >
                            <View
                              style={[
                                styles.circle,
                                styles[validator.online ? 'circleOk' : 'circleError'],
                              ]}
                            />
                          </Text>
                          <Text
                            style={[styles.tableSecondaryCell, textStyles.left, styles.sizeL]}
                            numberOfLines={1}
                            ellipsizeMode="tail"
                          >
                            {cutAddress(validator.address)}
                            <Text
                              style={[styles.tableCopy]}
                              onClick={copyToClipboad.bind(this, validator.address)}
                            >
                              copy
                            </Text>
                          </Text>
                          <Text
                            style={[styles.tableSecondaryCell, styles.sizeS]}
                            numberOfLines={1}
                            ellipsizeMode="tail"
                          >
                            {formatNumber(validator.usd, 2)}
                          </Text>
                          <Text
                            style={[styles.tableSecondaryCell, styles.sizeS]}
                            numberOfLines={1}
                            ellipsizeMode="tail"
                          >
                            {formatNumber(validator.gold, 2)}
                          </Text>
                          <Text
                            style={[styles.tableSecondaryCell, styles.sizeS]}
                            numberOfLines={1}
                            ellipsizeMode="tail"
                          >
                            {formatNumber(validator.uptime, 1)}%
                          </Text>
                        </View>
                      ))}
                    </View>
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
  },
  tableHeaderCell: {
    fontFamily: typeFaces.garamond,
    color: colors.white,
    fontSize: 16,
    lineHeight: 20,
    paddingHorizontal: 5,
    paddingVertical: 24,
    textAlign: 'center',
    flexGrow: 0,
    borderBottomWidth: 1,
    borderStyle: 'solid',
    borderColor: colors.white,
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
    textDecorationLine: 'underline',
    fontWeight: '500',
    cursor: 'pointer',
    flexGrow: 1,
  },
  tableCellTitleArrow: {
    marginLeft: 16,
    marginRight: 24,
    width: 20,
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
  tableSecondaryHeaderCell: {
    fontFamily: typeFaces.futura,
    opacity: 0.4,
    fontSize: 12,
    padding: 5,
    textTransform: 'uppercase',
    color: colors.white,
    textAlign: 'center',
  },
  tableSecondaryHeaderCellTitle: {
    flexGrow: 1,
  },
  tableSecondaryTitleCell: {
    textAlign: 'left',
    flexGrow: 1,
  },
  tableSecondaryCell: {
    textAlign: 'center',
    fontFamily: typeFaces.garamond,
    paddingHorizontal: 5,
    paddingVertical: 10,
    color: colors.white,
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
    backgroundColor: colors.primary,
  },
  circleError: {
    backgroundColor: colors.error,
  },
})
