import Button, { BtnTypes } from '@celo/react-components/components/Button'
import ItemSeparator from '@celo/react-components/components/ItemSeparator'
import ScrollContainer from '@celo/react-components/components/ScrollContainer'
import SectionHeadNew from '@celo/react-components/components/SectionHeadNew'
import BigNumber from 'bignumber.js'
import * as React from 'react'
import { WithTranslation } from 'react-i18next'
import { StyleSheet, View } from 'react-native'
import SafeAreaView from 'react-native-safe-area-view'
import { connect } from 'react-redux'
import componentWithAnalytics from 'src/analytics/wrapper'
import { fetchExchangeRate } from 'src/exchange/actions'
import CeloGoldHistoryChart from 'src/exchange/CeloGoldHistoryChart'
import CeloGoldOverview from 'src/exchange/CeloGoldOverview'
import { CURRENCY_ENUM } from 'src/geth/consts'
import { Namespaces, withTranslation } from 'src/i18n'
import { navigate } from 'src/navigator/NavigationService'
import { Stacks } from 'src/navigator/Screens'
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
        makerTokenBalance: this.props.dollarBalance || '0',
      },
    })
  }

  goToBuyDollars = () => {
    navigate(Stacks.ExchangeStack, {
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
        <ScrollContainer
          heading={t('global:gold')}
          testID="ExchangeScrollView"
          stickyHeaderIndices={[2]}
        >
          <DisconnectBanner />
          <View>
            <CeloGoldOverview testID="ExchangeAccountOverview" />
            <ItemSeparator />
            <CeloGoldHistoryChart />
            <ItemSeparator />
            <View style={styles.buttonContainer}>
              <Button
                text={t('buy')}
                onPress={this.goToBuyGold}
                style={styles.button}
                standard={true}
                type={BtnTypes.PRIMARY}
              />
              {hasGold && (
                <>
                  <View style={styles.buttonDivider} />
                  <Button
                    text={t('sell')}
                    onPress={this.goToBuyDollars}
                    style={styles.button}
                    standard={true}
                    type={BtnTypes.PRIMARY}
                  />
                </>
              )}
            </View>
          </View>
          <SectionHeadNew text={t('goldActivity')} />
          <View style={styles.activity}>
            <TransactionsList currency={CURRENCY_ENUM.GOLD} />
          </View>
        </ScrollContainer>
      </SafeAreaView>
    )
  }
}

export default componentWithAnalytics(
  connect<StateProps, DispatchProps, {}, RootState>(mapStateToProps, {
    fetchExchangeRate,
  })(withTranslation(Namespaces.exchangeFlow9)(ExchangeHomeScreen))
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
