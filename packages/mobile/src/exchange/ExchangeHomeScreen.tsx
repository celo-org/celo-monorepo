import ScrollContainer from '@celo/react-components/components/ScrollContainer'
import SectionHead from '@celo/react-components/components/SectionHead'
import SmallButton from '@celo/react-components/components/SmallButton'
import BigNumber from 'bignumber.js'
import * as React from 'react'
import { withNamespaces, WithNamespaces } from 'react-i18next'
import { StyleSheet, View } from 'react-native'
import { connect } from 'react-redux'
import CeloAnalytics from 'src/analytics/CeloAnalytics'
import { CustomEventNames } from 'src/analytics/constants'
import componentWithAnalytics from 'src/analytics/wrapper'
import AccountOverview from 'src/components/AccountOverview'
import { fetchExchangeRate } from 'src/exchange/actions'
import Activity from 'src/exchange/Activity'
import ExchangeRate from 'src/exchange/ExchangeRate'
import { CURRENCY_ENUM as Token } from 'src/geth/consts'
import { Namespaces } from 'src/i18n'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { RootState } from 'src/redux/reducers'
import DisconnectBanner from 'src/shared/DisconnectBanner'
import { getRateForMakerToken } from 'src/utils/currencyExchange'

interface StateProps {
  exchangeRate: BigNumber
}

interface DispatchProps {
  fetchExchangeRate: typeof fetchExchangeRate
}

type Props = StateProps & DispatchProps & WithNamespaces

const mapStateToProps = (state: RootState): StateProps => ({
  exchangeRate: getRateForMakerToken(state.exchange.exchangeRatePair, Token.DOLLAR),
})

function goToTrade() {
  CeloAnalytics.track(CustomEventNames.exchange_button)
  navigate(Screens.ExchangeStack)
}

export class ExchangeHomeScreen extends React.Component<Props> {
  static navigationOptions = {
    title: 'Exchange Home',
  }

  componentDidMount() {
    this.props.fetchExchangeRate()
  }

  render() {
    const { t, exchangeRate } = this.props

    return (
      <View style={styles.background}>
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
              <SmallButton
                text={t('exchange')}
                solid={true}
                onPress={goToTrade}
                style={styles.button}
              />
            </View>
          </View>
          <SectionHead text={t('activity')} />
          <View style={styles.activity}>
            <Activity />
          </View>
        </ScrollContainer>
      </View>
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
  button: {
    alignSelf: 'center',
  },
})
