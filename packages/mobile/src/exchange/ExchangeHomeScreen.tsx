import Button, { BtnTypes } from '@celo/react-components/components/Button'
import ScrollContainer from '@celo/react-components/components/ScrollContainer'
import SectionHeadNew from '@celo/react-components/components/SectionHeadNew'
import BigNumber from 'bignumber.js'
import * as React from 'react'
import { WithTranslation } from 'react-i18next'
import { StyleSheet, View } from 'react-native'
import SafeAreaView from 'react-native-safe-area-view'
import { connect } from 'react-redux'
import componentWithAnalytics from 'src/analytics/wrapper'
import AccountOverview from 'src/components/AccountOverview'
import { fetchExchangeRate } from 'src/exchange/actions'
import Activity from 'src/exchange/Activity'
import ExchangeRate from 'src/exchange/ExchangeRate'
import { CURRENCY_ENUM } from 'src/geth/consts'
import { Namespaces, withTranslation } from 'src/i18n'
import { navigate } from 'src/navigator/NavigationService'
import { Stacks } from 'src/navigator/Screens'
import { RootState } from 'src/redux/reducers'
import DisconnectBanner from 'src/shared/DisconnectBanner'
import { getRateForMakerToken } from 'src/utils/currencyExchange'

interface StateProps {
  exchangeRate: BigNumber
  goldBalance: string | null
  dollarBalance: string | null
}

interface DispatchProps {
  fetchExchangeRate: typeof fetchExchangeRate
}

type Props = StateProps & DispatchProps & WithTranslation

const mapStateToProps = (state: RootState): StateProps => ({
  exchangeRate: getRateForMakerToken(state.exchange.exchangeRatePair, CURRENCY_ENUM.DOLLAR),
  goldBalance: state.goldToken.balance,
  dollarBalance: state.stableToken.balance,
})

export class ExchangeHomeScreen extends React.Component<Props> {
  componentDidMount() {
    this.props.fetchExchangeRate()
  }

  goToBuyGold = () => {
    navigate(Stacks.ExchangeStack, {
      makerTokenDisplay: {
        makerToken: CURRENCY_ENUM.DOLLAR,
        makerTokenBalance: this.props.dollarBalance,
      },
    })
  }

  goToBuyDollars = () => {
    navigate(Stacks.ExchangeStack, {
      makerTokenDisplay: {
        makerToken: CURRENCY_ENUM.GOLD,
        makerTokenBalance: this.props.goldBalance,
      },
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
              <ExchangeRate rate={exchangeRate} makerToken={CURRENCY_ENUM.DOLLAR} />
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
  )(withTranslation(Namespaces.exchangeFlow9)(ExchangeHomeScreen))
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
