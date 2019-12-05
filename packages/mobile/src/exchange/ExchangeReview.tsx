import Button, { BtnTypes } from '@celo/react-components/components/Button'
import KeyboardAwareScrollView from '@celo/react-components/components/KeyboardAwareScrollView'

import ReviewFrame from '@celo/react-components/components/ReviewFrame'
import ReviewHeader from '@celo/react-components/components/ReviewHeader'
import colors from '@celo/react-components/styles/colors'
import { fontStyles } from '@celo/react-components/styles/fonts'
import { componentStyles } from '@celo/react-components/styles/styles'
import BigNumber from 'bignumber.js'
import * as React from 'react'
import { withNamespaces, WithNamespaces } from 'react-i18next'
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import SafeAreaView from 'react-native-safe-area-view'
import { NavigationInjectedProps } from 'react-navigation'
import { connect } from 'react-redux'
import CeloAnalytics from 'src/analytics/CeloAnalytics'
import { CustomEventNames } from 'src/analytics/constants'
import componentWithAnalytics from 'src/analytics/wrapper'
import { exchangeTokens, fetchExchangeRate } from 'src/exchange/actions'
import ExchangeConfirmationCard from 'src/exchange/ExchangeConfirmationCard'
import { ExchangeRatePair } from 'src/exchange/reducer'
import { CURRENCY_ENUM as Token } from 'src/geth/consts'
import i18n, { Namespaces } from 'src/i18n'
import { navigate, navigateBack } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { RootState } from 'src/redux/reducers'
import { isAppConnected } from 'src/redux/selectors'
import DisconnectBanner from 'src/shared/DisconnectBanner'
import {
  getNewDollarBalance,
  getNewGoldBalance,
  getRateForMakerToken,
  getTakerAmount,
} from 'src/utils/currencyExchange'
import { getMoneyDisplayValue } from 'src/utils/formatting'
import { headerWithCancelButton } from 'src/navigator/Headers'

interface StateProps {
  dollarBalance: string | null
  goldBalance: string | null
  exchangeRatePair: ExchangeRatePair | null
  fee: string
  appConnected: boolean
}

interface DispatchProps {
  fetchExchangeRate: typeof fetchExchangeRate
  exchangeTokens: typeof exchangeTokens
}

interface NavProps {
  makerToken: Token
  makerTokenBalance: string
}

type Props = StateProps & WithNamespaces & DispatchProps & NavigationInjectedProps

const mapStateToProps = (state: RootState): StateProps => ({
  goldBalance: state.goldToken.balance,
  dollarBalance: state.stableToken.balance,
  exchangeRatePair: state.exchange.exchangeRatePair,
  fee: getMoneyDisplayValue(0),
  appConnected: isAppConnected(state),
})

class ExchangeReview extends React.Component<Props> {
  static navigationOptions = ({ navigation }: NavigationInjectedProps<NavProps>) => {
    const makerToken = navigation.getParam('makerToken')
    const title = makerToken === Token.DOLLAR ? 'Buy Gold' : 'Sell Gold' // TODO(anna) translate
    const makerTokenBalance = navigation.getParam('makerTokenBalance')
    return {
      ...headerWithCancelButton,
      headerTitle: (
        <View style={styles.headerTextContainer}>
          <Text style={fontStyles.headerBoldTitle}>{title}</Text>
          <View>
            <Text style={fontStyles.subSmall}>
              {getMoneyDisplayValue(makerTokenBalance, makerToken, true) +
                ' ' +
                i18n.t(`${Namespaces.exchangeFlow9}:lowerCaseAvailable`)}
            </Text>
          </View>
        </View>
      ),
    }
  }

  onPressConfirm = () => {
    // const confirmationInput = this.getConfirmationInput()
    /*
    this.props.exchangeTokens(confirmationInput.makerToken, confirmationInput.makerAmount)
    CeloAnalytics.track(CustomEventNames.exchange_confirm, {
      makerToken: confirmationInput.makerToken,
      makerAmount: confirmationInput.makerAmount,
    })
    */
    navigate(Screens.ExchangeHomeScreen)
  }

  onPressEdit = () => {
    CeloAnalytics.track(CustomEventNames.exchange_edit)
    navigateBack()
  }

  componentDidMount() {
    const makerAmount = new BigNumber(40)
    const makerToken = Token.DOLLAR
    this.props.fetchExchangeRate(makerAmount, makerToken)
  }

  renderHeader = () => {
    return <ReviewHeader title={this.props.t('reviewExchange')} />
  }

  render() {
    const { exchangeRatePair, fee, t, appConnected, dollarBalance, goldBalance } = this.props
    const makerAmount = new BigNumber(40)
    const makerToken = Token.DOLLAR
    const rate = getRateForMakerToken(exchangeRatePair, makerToken)
    const takerAmount = getTakerAmount(makerAmount, rate)
    /*
<ExchangeConfirmationCard
          makerToken={makerToken}
          newDollarBalance={newDollarBalance}
          newGoldBalance={newGoldBalance}
          makerAmount={makerAmount}
          takerAmount={takerAmount}
          exchangeRate={rate}
          fee={fee}
        />
    */

    return (
      <SafeAreaView
        // Force inset as this screen uses auto focus and KeyboardSpacer padding is initially
        // incorrect because of that
        forceInset={{ top: 'never', bottom: 'always' }}
        style={styles.container}
      >
        <View
          style={{
            paddingHorizontal: 16,
          }}
        >
          <DisconnectBanner />
          <KeyboardAwareScrollView keyboardShouldPersistTaps={'always'}>
            <View
              style={{
                flexDirection: 'column',
                justifyContent: 'flex-start',
              }}
            >
              <View style={[styles.rowContainer, styles.goldInputRow]}>
                <Text style={[fontStyles.body, styles.exchangeBodyText]}>Amount (EUR)</Text>
                <Text style={[fontStyles.body, styles.currencyAmountText]}>{'$20.00'}</Text>
              </View>
              <View style={styles.line} />
              <View style={[styles.rowContainer]}>
                <Text style={[fontStyles.body, styles.exchangeBodyText]}>Subtotal (@ rate 10)</Text>
                <Text style={[fontStyles.body, styles.exchangeBodyText]}>{'$20.00'}</Text>
              </View>
              <View style={[styles.rowContainer]}>
                <Text style={[fontStyles.body, styles.exchangeBodyText]}>Exchange Fee</Text>
                <Text style={[fontStyles.body, styles.exchangeBodyText]}>{'$20.00'}</Text>
              </View>
              <View style={[styles.rowContainer]}>
                <Text style={[fontStyles.body, styles.exchangeBodyText]}>Security Fee</Text>
                <Text style={[fontStyles.body, styles.exchangeBodyText]}>{'$20.00'}</Text>
              </View>
              <View style={styles.line} />
              <View style={styles.rowContainer}>
                <Text style={[fontStyles.bodyBold]}>Total</Text>
                <Text style={fontStyles.bodyBold}>{'$20.013'}</Text>
              </View>
            </View>
          </KeyboardAwareScrollView>
        </View>

        <View style={componentStyles.bottomContainer}>
          <Button
            onPress={this.onPressConfirm}
            text={t(`${Namespaces.walletFlow5}:review`)}
            standard={false}
            disabled={!appConnected || rate.isZero()}
            type={BtnTypes.PRIMARY}
          />
        </View>
      </SafeAreaView>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  headerTextContainer: { flex: 1, alignSelf: 'center', alignItems: 'center' },
  line: {
    borderBottomColor: colors.darkLightest,
    borderBottomWidth: 1,
    marginBottom: 16,
  },
  exchangeBodyText: { fontSize: 15 },
  currencyAmountText: { fontSize: 24, lineHeight: 39, color: colors.celoGreen },

  rowContainer: { flexDirection: 'row', flex: 1, justifyContent: 'space-between' },
  goldInputRow: {
    marginTop: 38,
    alignItems: 'center',
  },
})

export default componentWithAnalytics(
  connect<StateProps, DispatchProps, {}, RootState>(
    mapStateToProps,
    { exchangeTokens, fetchExchangeRate }
  )(withNamespaces(Namespaces.exchangeFlow9)(ExchangeReview))
)
