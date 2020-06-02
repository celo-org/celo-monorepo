import Button, { BtnSizes, BtnTypes } from '@celo/react-components/components/Button.v2'
import ItemSeparator from '@celo/react-components/components/ItemSeparator'
import ScrollContainer from '@celo/react-components/components/ScrollContainer'
import SectionHead from '@celo/react-components/components/SectionHeadGold'
import { StackScreenProps } from '@react-navigation/stack'
import BigNumber from 'bignumber.js'
import * as React from 'react'
import { WithTranslation } from 'react-i18next'
import { StyleSheet, View } from 'react-native'
import SafeAreaView from 'react-native-safe-area-view'
import { connect } from 'react-redux'
import CeloAnalytics from 'src/analytics/CeloAnalytics'
import { CustomEventNames } from 'src/analytics/constants'
import { fetchExchangeRate } from 'src/exchange/actions'
import CeloGoldHistoryChart from 'src/exchange/CeloGoldHistoryChart'
import CeloGoldOverview from 'src/exchange/CeloGoldOverview'
import { CURRENCY_ENUM } from 'src/geth/consts'
import { Namespaces, withTranslation } from 'src/i18n'
import DrawerTopBar from 'src/navigator/DrawerTopBar'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import { RootState } from 'src/redux/reducers'
import DisconnectBanner from 'src/shared/DisconnectBanner'
import TransactionsList from 'src/transactions/TransactionsList'
import { getRateForMakerToken } from 'src/utils/currencyExchange'

interface StateProps {
  exchangeRate: BigNumber
  goldBalance: string | null
  dollarBalance: string | null
}

interface DispatchProps {
  fetchExchangeRate: typeof fetchExchangeRate
}

type OwnProps = StackScreenProps<StackParamList, Screens.ExchangeHomeScreen>

type Props = StateProps & DispatchProps & WithTranslation & OwnProps

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
    CeloAnalytics.track(CustomEventNames.gold_buy_start)
    this.props.navigation.navigate(Screens.ExchangeTradeScreen, {
      makerTokenDisplay: {
        makerToken: CURRENCY_ENUM.DOLLAR,
        makerTokenBalance: this.props.dollarBalance || '0',
      },
    })
  }

  goToBuyDollars = () => {
    CeloAnalytics.track(CustomEventNames.gold_sell_start)
    this.props.navigation.navigate(Screens.ExchangeTradeScreen, {
      makerTokenDisplay: {
        makerToken: CURRENCY_ENUM.GOLD,
        makerTokenBalance: this.props.goldBalance || '0',
      },
    })
  }

  render() {
    const { t, goldBalance } = this.props
    const hasGold = new BigNumber(goldBalance || 0).isGreaterThan(0)

    return (
      <SafeAreaView style={styles.background}>
        <DrawerTopBar />
        <ScrollContainer heading={t('global:gold')} testID="ExchangeScrollView">
          <DisconnectBanner />
          <CeloGoldHistoryChart />
          <View style={styles.buttonContainer}>
            <Button
              text={t('buy')}
              size={BtnSizes.FULL}
              onPress={this.goToBuyGold}
              style={styles.button}
              type={BtnTypes.TERTIARY}
            />
            {hasGold && (
              <Button
                size={BtnSizes.FULL}
                text={t('sell')}
                onPress={this.goToBuyDollars}
                style={styles.button}
                type={BtnTypes.TERTIARY}
              />
            )}
          </View>
          <ItemSeparator />
          <CeloGoldOverview testID="ExchangeAccountOverview" />
          <ItemSeparator />
          <SectionHead text={t('global:activity')} />
          <TransactionsList currency={CURRENCY_ENUM.GOLD} />
        </ScrollContainer>
      </SafeAreaView>
    )
  }
}

export default connect<StateProps, DispatchProps, {}, RootState>(mapStateToProps, {
  fetchExchangeRate,
})(withTranslation(Namespaces.exchangeFlow9)(ExchangeHomeScreen))

const styles = StyleSheet.create({
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
  buttonContainer: {
    flexDirection: 'row',
    flex: 1,
    marginTop: 24,
    marginBottom: 28,
    marginHorizontal: 12,
  },
  button: {
    marginHorizontal: 4,
    flex: 1,
  },
})
