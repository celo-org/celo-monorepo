import * as React from 'react'
import { Text, View } from 'react-native'
import CopyToClipboard from 'src/dev/CopyToClipboard'
import ProgressCutBar from 'src/dev/ProgressCutBar'
import ValidatorsListBadges from 'src/dev/ValidatorsListBadges'
import { styles } from 'src/dev/ValidatorsListStyles'
import { I18nProps, withNamespaces } from 'src/i18n'
import Checkmark from 'src/icons/Checkmark'
import Chevron, { Direction } from 'src/icons/chevron'
import { colors } from 'src/styles'
import { cutAddress, formatNumber } from 'src/utils/utils'
import { CeloGroup, localStoragePinnedKey } from 'src/utils/validators'

const unknownGroupName = 'Unnamed Group'
const unknownValidatorName = 'Unnamed Validator'

interface Props {
  group: CeloGroup
  expanded: boolean
  onPinned: () => void
}
interface State {
  tooltip?: boolean
  isPinned?: boolean
}

class ValidatorsListRow extends React.PureComponent<Props & I18nProps, State> {
  state = {
    tooltip: false,
    isPinned: false,
  }
  tooltipRef = React.createRef<any>()
  removeDocumentListener: () => void

  constructor(...args) {
    super(...(args as [any]))

    const onDocumentClick = (event) => {
      if (!this.state.tooltip || !this.tooltipRef.current) {
        return
      }
      if (!this.tooltipRef.current.parentNode.contains(event.target)) {
        this.setState({ tooltip: false })
      }
    }

    document.addEventListener('click', onDocumentClick, false)

    this.removeDocumentListener = () =>
      document.removeEventListener('click', onDocumentClick, false)
  }

  componentDidMount() {
    this.setState({ isPinned: this.isPinned() })
  }

  componentWillUnmount() {
    this.removeDocumentListener()
  }

  isPinned(toggle?: boolean) {
    const { address } = this.props.group
    let list = (localStorage.getItem(localStoragePinnedKey) || '').split(',') || []
    let isPinned = list.includes(address)
    if (toggle) {
      if (!isPinned) {
        list.push(address)
      } else {
        list = list.filter((_) => _ !== address)
      }
      isPinned = !isPinned
      localStorage.setItem(localStoragePinnedKey, list.join(','))
      this.props.onPinned()
    }
    return isPinned
  }

  stopPropagation = (event) => {
    event.stopPropagation()
  }
  toggleTooltip = (event) => {
    event.stopPropagation()
    this.setState({ tooltip: !this.state.tooltip })
  }
  togglePinned: any = (event) => {
    event.stopPropagation()
    const is = this.isPinned(true)
    this.setState({ isPinned: is })
  }

  render() {
    const { group, expanded } = this.props
    const { tooltip, isPinned } = this.state

    return (
      <div style={tooltip ? { zIndex: 2 } : {}}>
        <View style={[styles.tableRow, styles.tableRowCont, tooltip ? { zIndex: 3 } : {}]}>
          <View
            style={[styles.tableCell, styles.pinContainer, styles.sizeXXS]}
            onClick={this.togglePinned}
          >
            <View style={[styles.pin, isPinned ? styles.pinned : {}]} />
          </View>
          <View style={[styles.tableCell, styles.tableCellTitle]}>
            <Text
              style={[
                styles.defaultText,
                styles.tableCell,
                styles.tableCellTitleArrow,
                ...(expanded ? [styles.tableCellTitleArrowExpanded] : []),
              ]}
            >
              <Chevron
                direction={Direction.right}
                opacity={expanded ? 1 : 0.4}
                color={colors.white}
                size={10}
              />
            </Text>
            <Text style={[styles.defaultText, styles.tableCellTitleRows]}>
              <Text style={[styles.defaultText, styles.tableCellTitleFirstRowWrapper]}>
                <Text
                  style={[styles.defaultText, styles.tableCellTitleFirstRow]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                  accessibilityRole="link"
                  href={`https://explorer.celo.org/address/${group.address}/celo`}
                  target="_blank"
                >
                  {group.name || unknownGroupName}
                </Text>

                {!!group.claims.length && (
                  <Text style={[styles.defaultText, styles.checkmark]}>
                    <div onClick={this.stopPropagation}>
                      <div ref={this.tooltipRef} onClick={this.toggleTooltip}>
                        <Checkmark color={colors.black} size={8} />
                      </div>

                      {tooltip && (
                        <Text style={[styles.defaultText, styles.tooltip]}>
                          {group.claims.map((domain, i) => (
                            <Text key={domain} style={[styles.defaultText, styles.tooltipRow]}>
                              {i + 1}.
                              <Text
                                accessibilityRole="link"
                                target="_blank"
                                href={`https://${domain}`}
                                style={[styles.defaultText, styles.tooltipText]}
                              >
                                {domain}
                              </Text>
                              <Text style={[styles.defaultText, styles.checkmark]}>
                                <Checkmark color={colors.black} size={8} />
                              </Text>
                            </Text>
                          ))}
                        </Text>
                      )}
                    </div>
                  </Text>
                )}
              </Text>
              <ValidatorsListBadges address={group.address} />
              <Text style={[styles.defaultText, styles.tableCellTitleSecRow]}>
                <Text style={[styles.defaultText, styles.address]}>
                  {cutAddress(group.address)}
                </Text>
                <CopyToClipboard content={group.address} />
              </Text>
            </Text>
          </View>
          <Text
            style={[styles.defaultText, styles.tableCell, styles.tableCellCenter, styles.sizeM]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {group.elected}/{group.numMembers}
          </Text>
          <Text style={[styles.defaultText, styles.tableCell, styles.sizeXL, styles.tableCellBars]}>
            <Text style={[styles.defaultText, styles.tableCellBarsValue]}>
              {formatNumber(+group.votesAbsolute, 1)}%
            </Text>
            <Text style={[styles.defaultText, styles.tableCellBarsRows]}>
              <Text style={[styles.defaultText, styles.tableCellBarsRowValues]}>
                {formatNumber(+group.votes, 1)}% of {formatNumber(+group.receivableVotes, 1)}%
              </Text>
              <ProgressCutBar
                bars={Math.min(Math.floor(+group.receivableVotes * 2) || 1, 6)}
                progress={Math.floor(+group.votes)}
              />
            </Text>
          </Text>
          <Text
            style={[styles.defaultText, styles.tableCell, styles.tableCellCenter, styles.sizeM]}
            numberOfLines={2}
            ellipsizeMode="tail"
          >
            {formatNumber(+group.votesRaw, 0)}
            {'\n'}({formatNumber((group.gold / group.votesRaw) * 100, 1) || 0}%)
          </Text>
          <Text
            style={[styles.defaultText, styles.tableCell, styles.tableCellCenter, styles.sizeM]}
            numberOfLines={2}
            ellipsizeMode="tail"
          >
            {formatNumber(+group.receivableRaw, 0)}
            {'\n'}({formatNumber((group.gold / +group.receivableRaw) * 100, 1) || 0}%)
          </Text>
          <Text
            style={[styles.defaultText, styles.tableCell, styles.tableCellCenter, styles.sizeM]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {formatNumber(group.gold, 0)}
          </Text>
          <Text
            style={[styles.defaultText, styles.tableCell, styles.tableCellCenter, styles.sizeM]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {formatNumber(group.commission, 0)}%
          </Text>
          <Text
            style={[styles.defaultText, styles.tableCell, styles.tableCellCenter, styles.sizeM]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            <Text style={styles.defaultText}>
              {group.rewards === null ? 'n/a' : formatNumber(group.rewards, 1) + '%'}
            </Text>
            <Text style={[styles.defaultText, styles.barContainer]}>
              <Text
                style={[
                  styles.defaultText,
                  styles.bar,
                  group.rewardsStyle,
                  { width: `${group.rewards}%` },
                ]}
              />
            </Text>
          </Text>
          {/* <Text
            style={[styles.defaultText, styles.tableCell, styles.tableCellCenter, styles.sizeS]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {formatNumber(group.uptime, 1)}%
          </Text> */}
          <Text
            style={[styles.defaultText, styles.tableCell, styles.tableCellCenter, styles.sizeS]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {formatNumber(group.attestation, 1)}%
          </Text>
        </View>
        {expanded && (
          <>
            {group.validators.map((validator, j) => (
              <View key={`${group.id}.${j}`} style={[styles.pStatic, styles.tableRow]}>
                <Text
                  style={[
                    styles.defaultText,
                    styles.tableCell,
                    styles.tableCellTitle,
                    styles.tableSecondaryCell,
                  ]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  <Text style={[styles.defaultText, styles.tableCell, styles.sizeXXS]} />
                  <Text style={[styles.defaultText, styles.tableCell, styles.tableCellTitleNumber]}>
                    {j + 1}
                  </Text>
                  <Text style={[styles.defaultText, styles.tableCellTitleRows]}>
                    <Text
                      style={[
                        styles.defaultText,
                        styles.tableCellTitleFirstRow,
                        styles.tableSecondaryCell,
                      ]}
                      accessibilityRole="link"
                      href={`https://explorer.celo.org/address/${validator.address}/celo`}
                      target="_blank"
                    >
                      {validator.name || unknownValidatorName}
                    </Text>
                    <Text
                      style={[
                        styles.defaultText,
                        styles.tableCellTitleSecRow,
                        styles.tableCellTitleSecondarySecRow,
                      ]}
                    >
                      <Text style={[styles.defaultText, styles.address]}>
                        {cutAddress(validator.address)}
                      </Text>
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
                <Text style={[styles.defaultText, styles.tableCell, styles.sizeXL]} />
                <Text style={[styles.defaultText, styles.tableCell, styles.sizeM]} />
                <Text style={[styles.defaultText, styles.tableCell, styles.sizeM]} />
                <Text
                  style={[
                    styles.defaultText,
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
                <Text style={[styles.defaultText, styles.tableCell, styles.sizeM]} />
                <Text style={[styles.defaultText, styles.tableCell, styles.sizeM]} />
                {/*                <Text
                  style={[
                    styles.defaultText,
                    styles.tableCell,
                    styles.tableCellCenter,
                    styles.tableSecondaryCell,
                    styles.sizeS,
                  ]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {formatNumber(validator.uptime, 1)}%
                </Text>*/}
                <Text
                  style={[
                    styles.defaultText,
                    styles.tableCell,
                    styles.tableCellCenter,
                    styles.tableSecondaryCell,
                    styles.sizeS,
                  ]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {validator.neverElected ? 'n/a' : `${formatNumber(validator.attestation, 1)}%`}
                </Text>
              </View>
            ))}
          </>
        )}
      </div>
    )
  }
}

export default withNamespaces('dev')(ValidatorsListRow)
