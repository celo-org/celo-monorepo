import * as React from 'react'
import { Text as RNText, View } from 'react-native'
import CopyToClipboard from 'src/dev/CopyToClipboard'
import ProgressCutBar from 'src/dev/ProgressCutBar'
import { styles } from 'src/dev/ValidatorsListStyles'
import { I18nProps, withNamespaces } from 'src/i18n'
import Checkmark from 'src/icons/Checkmark'
import Chevron, { Direction } from 'src/icons/chevron'
import { colors } from 'src/styles'
import { cutAddress, formatNumber } from 'src/utils/utils'

const unknownGroupName = 'Unnamed Group'
const unknownValidatorName = 'Unnamed Validator'

const localStoragePinnedKey = 'pinnedValidators'

class Text extends RNText {
  render() {
    return (
      <RNText {...this.props} style={[styles.defaultText, this.props.style]}>
        {this.props.children}
      </RNText>
    )
  }
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
  gold: number
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

    this.state.isPinned = this.isPinned()

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

  componentWillUnmount() {
    this.removeDocumentListener()
  }

  isPinned(toggle?: boolean) {
    const { address } = this.props.group
    let list = localStorage.getItem(localStoragePinnedKey)?.split(',') || []
    let isPinned = list.includes(address)
    if (toggle) {
      list = list.filter((_) => _ !== address)
      if (!isPinned) {
        list.push(address)
      }
      isPinned = !isPinned
      localStorage.setItem(localStoragePinnedKey, list.join(','))
      this.props.onPinned()
    }
    return isPinned
  }

  render() {
    const { group, expanded } = this.props
    const { tooltip, isPinned } = this.state
    const stopPropagation = (event: any) => {
      event.stopPropagation()
    }
    const toggleTooltip = (event: any) => {
      stopPropagation(event)
      this.setState({ tooltip: !tooltip })
    }
    const togglePinned: any = (event: any) => {
      stopPropagation(event)
      const is = this.isPinned(true)
      this.setState({ isPinned: is })
    }
    return (
      <div style={tooltip ? { zIndex: 2 } : {}}>
        <View style={[styles.tableRow, styles.tableRowCont, tooltip ? { zIndex: 3 } : {}]}>
          <Text
            style={[
              styles.tableCell,
              styles.tableCellCenter,
              styles.sizeXXS,
              isPinned ? {} : styles.noPinned,
            ]}
          >
            <span style={{ cursor: 'pointer' }} onClick={togglePinned}>
              📍
            </span>
          </Text>
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
              <Text style={[styles.tableCellTitleFirstRowWrapper]}>
                <Text
                  style={[styles.tableCellTitleFirstRow]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                  accessibilityRole="link"
                  href={`https://explorer.celo.org/address/${group.address}/celo`}
                  target="_blank"
                >
                  {group.name || unknownGroupName}
                </Text>

                {!!group.claims.length && (
                  <Text style={[styles.checkmark]}>
                    <div onClick={stopPropagation}>
                      <div ref={this.tooltipRef} onClick={toggleTooltip}>
                        <Checkmark color={colors.black} size={8} />
                      </div>

                      {tooltip && (
                        <Text style={[styles.tooltip]}>
                          {group.claims.map((domain, i) => (
                            <Text key={domain} style={[styles.tooltipRow]}>
                              {i + 1}.
                              <Text
                                accessibilityRole="link"
                                target="_blank"
                                href={`https://${domain}`}
                                style={[styles.tooltipText]}
                              >
                                {domain}
                              </Text>
                              <Text style={[styles.checkmark]}>
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
            numberOfLines={2}
            ellipsizeMode="tail"
          >
            {formatNumber(+group.votesRaw, 0)}
            {'\n'}({formatNumber((group.gold / group.votesRaw) * 100, 1) || 0}%)
          </Text>
          <Text
            style={[styles.tableCell, styles.tableCellCenter, styles.sizeM]}
            numberOfLines={2}
            ellipsizeMode="tail"
          >
            {formatNumber(+group.receivableRaw, 0)}
            {'\n'}({formatNumber((group.gold / +group.receivableRaw) * 100, 1) || 0}%)
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
          <>
            {group.validators.map((validator, j) => (
              <View key={`${group.id}.${j}`} style={[styles.pStatic, styles.tableRow]}>
                <Text
                  style={[styles.tableCell, styles.tableCellTitle, styles.tableSecondaryCell]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  <Text style={[styles.tableCell, styles.tableCellTitleNumber]}>{j + 1}</Text>
                  <Text style={[styles.tableCellTitleRows]}>
                    <Text
                      style={[styles.tableCellTitleFirstRow, styles.tableSecondaryCell]}
                      accessibilityRole="link"
                      href={`https://explorer.celo.org/address/${validator.address}/celo`}
                      target="_blank"
                    >
                      {validator.name || unknownValidatorName}
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
                <Text style={[styles.tableCell, styles.sizeM]} />
                <Text style={[styles.tableCell, styles.sizeM]} />
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
          </>
        )}
      </div>
    )
  }
}

export default withNamespaces('dev')(ValidatorsListRow)
