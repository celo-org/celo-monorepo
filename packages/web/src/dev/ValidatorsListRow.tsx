import * as React from 'react'
import { Text as RNText, View } from 'react-native'
import CopyToClipboard from 'src/dev/CopyToClipboard'
import ProgressCutBar from 'src/dev/ProgressCutBar'
import { styles } from 'src/dev/ValidatorsListStyles'
import { I18nProps, withNamespaces } from 'src/i18n'
import Chevron, { Direction } from 'src/icons/chevron'
import { colors } from 'src/styles'
import { cutAddress, formatNumber } from 'src/utils/utils'
import Checkmark from 'src/icons/Checkmark'

class Text extends RNText {
  render() {
    return <RNText style={[styles.defaultText, this.props.style]}>{this.props.children}</RNText>
  }
}

export interface CeloGroup {
  elected: number
  online: number
  total: number
  uptime: number
  attestation: number
  name: string
  address: string
  usd: number
  gold: number
  receivableVotes: string
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
    gold: number
    elected: boolean
    online: boolean
    uptime: number
    attestation: number
    claims: string[]
  }>
}

interface Props {
  group: CeloGroup
  expanded: boolean
}

class ValidatorsListRow extends React.PureComponent<Props & I18nProps> {
  render() {
    const { group, expanded } = this.props
    return (
      <View key={group.address}>
        <View style={[styles.tableRow, styles.tableRowCont]}>
          <View style={[styles.tableCell, styles.tableCellTitle]}>
            <Text style={[styles.tableCell, styles.tableCellTitleArrow]}>
              <Chevron
                direction={expanded ? Direction.down : Direction.right}
                opacity={expanded ? 1 : 0.4}
                color={colors.white}
                size={10}
              />
            </Text>
            <Text style={[styles.tableCellTitleRows]}>
              <Text style={[styles.tableCellTitleFirstRow]} numberOfLines={1} ellipsizeMode="tail">
                {group.name}

                {!!group.claims.length && (<Text style={[styles.checkmark]}>
                  <Checkmark color={colors.black} size={8} />
                </Text>)}
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
            <Text style={[styles.numberBlock, styles.numberBlockFirst]}>{group.elected}</Text>
            <Text style={[styles.numberBlock]}>{group.numMembers}</Text>
          </Text>
          <Text style={[styles.tableCell, styles.sizeXL, styles.tableCellBars]}>
            <Text style={[styles.tableCellBarsValue]}>
              {formatNumber(+group.votesAbsolute, 1)}%
            </Text>
            <Text style={[styles.tableCellBarsRows]}>
              <Text style={[styles.tableCellBarsRowValues]}>
                {formatNumber(+group.votes, 1)}% of {formatNumber(+group.receivableVotes, 1)}%
              </Text>
              <ProgressCutBar
                bars={Math.min(Math.floor(+group.receivableVotes * 2) || 1, 6)}
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
            <Text>{group.rewards === null ? 'n/a' : formatNumber(group.rewards, 1) + '%'}</Text>
            <Text style={[styles.barContainer]}>
              <Text style={[styles.bar, group.rewardsStyle, { width: `${group.rewards}%` }]} />
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
        {expanded && (
          <View>
            {group.validators.map((validator, j) => (
              <View key={`${group.address}.${j}`} style={[styles.tableRow]}>
                <Text
                  style={[styles.tableCell, styles.tableCellTitle, styles.tableSecondaryCell]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  <Text style={[styles.tableCell, styles.tableCellTitleNumber]}>{j + 1}</Text>
                  <Text style={[styles.tableCellTitleRows]}>
                    <Text style={[styles.tableCellTitleFirstRow, styles.tableSecondaryCell]}>
                      {validator.name}
                    </Text>
                    <Text
                      style={[styles.tableCellTitleSecRow, styles.tableCellTitleSecondarySecRow]}
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
                    style={[styles.circle, styles[validator.elected ? 'circleOk' : 'circleError']]}
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
    )
  }
}

export default withNamespaces('dev')(ValidatorsListRow)
