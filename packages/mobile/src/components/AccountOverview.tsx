import colors from '@celo/react-components/styles/colors'
import fontStyles, { estimateFontSize } from '@celo/react-components/styles/fonts'
import variables from '@celo/react-components/styles/variables'
import * as React from 'react'
import { withNamespaces, WithNamespaces } from 'react-i18next'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { connect } from 'react-redux'
import componentWithAnalytics from 'src/analytics/wrapper'
import CurrencyDisplay from 'src/components/CurrencyDisplay'
import Styles from 'src/components/Styles'
import { ExchangeRatePair } from 'src/exchange/reducer'
import { CURRENCIES, CURRENCY_ENUM as Tokens } from 'src/geth/consts'
import { startBalanceAutorefresh, stopBalanceAutorefresh } from 'src/home/actions'
import { Namespaces } from 'src/i18n'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { RootState } from 'src/redux/reducers'
import { getMoneyDisplayValue } from 'src/utils/formatting'

interface StateProps {
  exchangeRatePair: ExchangeRatePair | null
  goldEducationCompleted: boolean
  stableEducationCompleted: boolean
  goldBalance: string | null
  dollarBalance: string | null
}

interface OwnProps {
  testID: string
}

interface DispatchProps {
  startBalanceAutorefresh: typeof startBalanceAutorefresh
  stopBalanceAutorefresh: typeof stopBalanceAutorefresh
}

type Props = StateProps & DispatchProps & WithNamespaces & OwnProps

const mapStateToProps = (state: RootState): StateProps => {
  return {
    exchangeRatePair: state.exchange.exchangeRatePair,
    goldEducationCompleted: state.goldToken.educationCompleted,
    stableEducationCompleted: state.stableToken.educationCompleted,
    goldBalance: state.goldToken.balance,
    dollarBalance: state.stableToken.balance,
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

  componentDidMount() {
    this.props.startBalanceAutorefresh()
  }

  componentWillUnmount() {
    this.props.stopBalanceAutorefresh()
  }

  render() {
    const { t, testID, goldBalance, dollarBalance } = this.props

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
                />
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
                />
              </TouchableOpacity>
            </View>
          </View>
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
})

export default componentWithAnalytics(
  connect<StateProps, DispatchProps, OwnProps, RootState>(
    mapStateToProps,
    { startBalanceAutorefresh, stopBalanceAutorefresh }
  )(withNamespaces(Namespaces.walletFlow5)(AccountOverview))
)
