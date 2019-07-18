import PulsingDot from '@celo/react-components/components/PulsingDot'
import SmallButton from '@celo/react-components/components/SmallButton'
import colors from '@celo/react-components/styles/colors'
import fontStyles, { estimateFontSize } from '@celo/react-components/styles/fonts'
import variables from '@celo/react-components/styles/variables'
import * as React from 'react'
import { withNamespaces, WithNamespaces } from 'react-i18next'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { connect } from 'react-redux'
import { CTA_CIRCLE_SIZE } from 'src/account/Education'
import componentWithAnalytics from 'src/analytics/wrapper'
import CurrencyDisplay from 'src/components/CurrencyDisplay'
import Styles from 'src/components/Styles'
import { isE2EEnv } from 'src/config'
import { ExchangeRatePair } from 'src/exchange/reducer'
import { CURRENCIES, CURRENCY_ENUM as Tokens } from 'src/geth/consts'
import { refreshAllBalances } from 'src/home/actions'
import { Namespaces } from 'src/i18n'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { RootState } from 'src/redux/reducers'
import { showRefreshBalanceMessage } from 'src/redux/selectors'
import { getMoneyDisplayValue } from 'src/utils/formatting'

interface StateProps {
  exchangeRatePair: ExchangeRatePair | null
  goldEducationCompleted: boolean
  stableEducationCompleted: boolean
  goldBalance: string | null
  dollarBalance: string | null
  balanceOutOfSync: boolean
}

interface OwnProps {
  testID: string
}

interface DispatchProps {
  refreshAllBalances: typeof refreshAllBalances
}

type Props = StateProps & DispatchProps & WithNamespaces & OwnProps

const mapStateToProps = (state: RootState): StateProps => {
  return {
    exchangeRatePair: state.exchange.exchangeRatePair,
    goldEducationCompleted: state.goldToken.educationCompleted,
    stableEducationCompleted: state.stableToken.educationCompleted,
    goldBalance: state.goldToken.balance,
    dollarBalance: state.stableToken.balance,
    balanceOutOfSync: showRefreshBalanceMessage(state),
  }
}

export class AccountOverview extends React.Component<Props> {
  goToGoldTokenEducation = () => {
    navigate(Screens.GoldEducation)
  }

  goToStableTokenEducation = () => {
    navigate(Screens.DollarEducation)
  }

  getFontSize(balance: any, dot: boolean) {
    const numLength = getMoneyDisplayValue(balance).length
    const deviceWidth = variables.width
    const dotOffset = dot ? 15 : 0
    const containerWidth = deviceWidth / 2 - 60 - dotOffset // 60 = padding
    const fontSize = estimateFontSize(36, numLength, containerWidth)
    return fontSize
  }

  refreshBalances = () => {
    this.props.refreshAllBalances()
  }

  render() {
    const { t, testID, goldBalance, dollarBalance, balanceOutOfSync } = this.props

    return (
      <View testID={testID}>
        <View>
          <View style={style.currencyContainer}>
            <View style={[style.currencyArea, Styles.center]} testID={`${testID}/dollarBalance`}>
              <Text style={[style.currencyLabel, fontStyles.bodySmall]}>
                {t('celoDollars') + ' ' + CURRENCIES[Tokens.DOLLAR].code}
              </Text>
              <TouchableOpacity
                onPress={this.goToStableTokenEducation}
                disabled={this.props.stableEducationCompleted}
                style={[style.education, !this.props.stableEducationCompleted && style.dotOffset]}
              >
                <CurrencyDisplay
                  amount={dollarBalance}
                  size={this.getFontSize(dollarBalance, !this.props.stableEducationCompleted)}
                  type={Tokens.DOLLAR}
                  balanceOutOfSync={balanceOutOfSync}
                />
                {!this.props.stableEducationCompleted && (
                  <PulsingDot
                    color={colors.messageBlue}
                    circleStartSize={CTA_CIRCLE_SIZE}
                    style={style.dot}
                    animated={!isE2EEnv}
                  />
                )}
              </TouchableOpacity>
            </View>
            <View style={style.line} />
            <View style={[style.currencyArea]} testID={`${testID}/goldBalance`}>
              <Text style={[style.currencyLabel, fontStyles.bodySmall]}>
                {t('celoGold') + ' ' + CURRENCIES[Tokens.GOLD].code}
              </Text>
              <TouchableOpacity
                onPress={this.goToGoldTokenEducation}
                disabled={this.props.goldEducationCompleted}
                style={[style.education, !this.props.goldEducationCompleted && style.dotOffset]}
              >
                <CurrencyDisplay
                  amount={goldBalance}
                  size={this.getFontSize(goldBalance, !this.props.goldEducationCompleted)}
                  type={Tokens.GOLD}
                  balanceOutOfSync={balanceOutOfSync}
                />
                {!this.props.goldEducationCompleted && (
                  <PulsingDot
                    color={colors.messageBlue}
                    circleStartSize={CTA_CIRCLE_SIZE}
                    style={style.dot}
                  />
                )}
              </TouchableOpacity>
            </View>
          </View>
          {balanceOutOfSync && (
            <View style={style.balanceRefreshContainer}>
              <Text style={style.balanceRefreshText}>{t('balanceNeedUpdating')}</Text>
              <SmallButton
                text={t('refreshBalances')}
                onPress={this.refreshBalances}
                solid={false}
                style={style.messageButton}
                textStyle={fontStyles.messageText}
              />
            </View>
          )}
        </View>
      </View>
    )
  }
}

const style = StyleSheet.create({
  currencyContainer: {
    flexDirection: 'row',
    position: 'relative',
    paddingHorizontal: variables.contentPadding * 2,
    paddingTop: 15,
    paddingBottom: 5,
  },
  line: {
    alignSelf: 'center',
    height: 50,
    width: 1,
    marginTop: 10,
    backgroundColor: colors.darkLightest,
  },
  currencyArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nativeBalanceRow: {
    flexDirection: 'row',
  },
  currencyLabel: {
    lineHeight: 30,
  },
  nativeBalance: {
    marginTop: -1,
    marginLeft: 3,
  },
  dollarBalance: {
    color: colors.celoGreen,
  },
  goldBalance: {
    color: colors.celoGold,
  },
  currency: {
    textAlignVertical: 'bottom',
  },
  progressBar: {
    position: 'relative',
  },
  education: {
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'visible',
  },
  dotOffset: {
    paddingLeft: 10,
  },
  dot: {
    padding: 10,
  },
  balanceRefreshContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 13,
    paddingHorizontal: 50,
  },
  balanceRefreshText: {
    ...fontStyles.bodySmall,
    color: colors.messageBlue,
    paddingRight: 5,
  },
  messageButton: {
    ...fontStyles.messageText,
    borderColor: colors.messageBlue,
    minWidth: 0,
    paddingVertical: 2,
    paddingHorizontal: 5,
  },
})

export default componentWithAnalytics(
  connect<StateProps, DispatchProps, OwnProps, RootState>(
    mapStateToProps,
    { refreshAllBalances }
  )(withNamespaces(Namespaces.walletFlow5)(AccountOverview))
)
