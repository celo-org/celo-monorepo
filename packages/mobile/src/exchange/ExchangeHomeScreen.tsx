import Button, { BtnTypes } from '@celo/react-components/components/Button'
import ScrollContainer from '@celo/react-components/components/ScrollContainer'
import SectionHeadNew from '@celo/react-components/components/SectionHeadNew'
import BigNumber from 'bignumber.js'
import * as React from 'react'
import { withNamespaces, WithNamespaces } from 'react-i18next'
import { StyleSheet, View } from 'react-native'
import SafeAreaView from 'react-native-safe-area-view'
import { NavigationInjectedProps } from 'react-navigation'
import { connect } from 'react-redux'
import componentWithAnalytics from 'src/analytics/wrapper'
import AccountOverview from 'src/components/AccountOverview'
import { fetchExchangeRate } from 'src/exchange/actions'
import Activity from 'src/exchange/Activity'
import ExchangeRate from 'src/exchange/ExchangeRate'
import { CURRENCY_ENUM as Token } from 'src/geth/consts'
import { Namespaces } from 'src/i18n'
import { navigate } from 'src/navigator/NavigationService'
import { Screens, Stacks } from 'src/navigator/Screens'
import { RootState } from 'src/redux/reducers'
import DisconnectBanner from 'src/shared/DisconnectBanner'
import { getRateForMakerToken } from 'src/utils/currencyExchange'
import Logger from 'src/utils/Logger'

interface StateProps {
  exchangeRate: BigNumber
  goldBalance: string | null
  dollarBalance: string | null
}

interface State {
  goldBalance: string
  dollarBalance: string
}

interface DispatchProps {
  fetchExchangeRate: typeof fetchExchangeRate
}

type Props = StateProps & DispatchProps & NavigationInjectedProps & WithNamespaces

const mapStateToProps = (state: RootState): StateProps => ({
  exchangeRate: getRateForMakerToken(state.exchange.exchangeRatePair, Token.DOLLAR),
  goldBalance: state.goldToken.balance,
  dollarBalance: state.stableToken.balance,
})

export class ExchangeHomeScreen extends React.Component<Props, State> {
  componentDidMount() {
    this.props.fetchExchangeRate()
  }

  goToBuyGold() {
    Logger.debug('ExchangeHomeScreen', 'about to read balance')
    const balance = this.state.goldBalance
    Logger.debug('ExchangeHomeScreen', `read balance of ${balance}`)
    navigate(Stacks.ExchangeStack, {
      makerToken: Token.GOLD,
      makerTokenBalance: balance,
    })
  }

  goToBuyDollars() {
    const balance = this.state.goldBalance
    navigate(Screens.ExchangeBuyScreen, {
      makerToken: Token.GOLD,
      makerTokenBalance: balance,
    })
  }

  render() {
    const { t, exchangeRate } = this.props

    return (
      <SafeAreaView style={styles.background}>
        <ScrollContainer
          heading={t('exchange')}
          testID="ExchangeScrollView"
          stickyHeaderIndices={[2]}
        >
          <DisconnectBanner />
          <View>
            <AccountOverview testID="ExchangeAccountOverview" />
            <View style={styles.lowerTop}>
              <ExchangeRate rate={exchangeRate} makerToken={Token.DOLLAR} />
            </View>
            <View style={styles.buttonContainer}>
              <Button
                text={t('buy')}
                onPress={this.goToBuyGold}
                style={styles.button}
                standard={true}
                type={BtnTypes.PRIMARY}
              />
              <View style={styles.buttonDivider} />
              <Button
                text={t('sell')}
                onPress={this.goToBuyDollars}
                style={styles.button}
                standard={true}
                type={BtnTypes.PRIMARY}
              />
            </View>
          </View>
          <SectionHeadNew text={t('goldActivity')} />
          <View style={styles.activity}>
            <Activity />
          </View>
        </ScrollContainer>
      </SafeAreaView>
    )
  }
}

export default componentWithAnalytics(
  connect<StateProps, DispatchProps, {}, RootState>(
    mapStateToProps,
    {
      fetchExchangeRate,
    }
  )(withNamespaces(Namespaces.exchangeFlow9)(ExchangeHomeScreen))
)

const styles = StyleSheet.create({
  activity: {
    flex: 1,
  },
  exchangeEvent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  background: {
    backgroundColor: 'white',
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  pseudoHeader: {
    height: 40,
  },
  lowerTop: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
  },
  button: {
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    flex: 1,
  },
  buttonDivider: {
    marginLeft: 16,
  },
})
