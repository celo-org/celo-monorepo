// SCREEN where users can review the data about the witdrawal of CELO they are about to make
// and confirm.

import Button, { BtnSizes, BtnTypes } from '@celo/react-components/components/Button'
import HorizontalLine from '@celo/react-components/components/HorizontalLine'
import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import variables from '@celo/react-components/styles/variables'
import { StackScreenProps } from '@react-navigation/stack'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useDispatch } from 'react-redux'
import { CeloExchangeEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import CancelButton from 'src/components/CancelButton'
import LineItemRow from 'src/components/LineItemRow'
import ShortenedAddress from 'src/components/ShortenedAddress'
import { withdrawCelo } from 'src/exchange/actions'
import WithdrawCeloSummary from 'src/exchange/WithdrawCeloSummary'
import { CURRENCY_ENUM } from 'src/geth/consts'
import i18n, { Namespaces } from 'src/i18n'
import { emptyHeader, HeaderTitleWithBalance } from 'src/navigator/Headers'
import { navigate, navigateBack } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { TopBarTextButton } from 'src/navigator/TopBarButton'
import { StackParamList } from 'src/navigator/types'
import useTypedSelector from 'src/redux/useSelector'
import DisconnectBanner from 'src/shared/DisconnectBanner'

type Props = StackScreenProps<StackParamList, Screens.WithdrawCeloReviewScreen>

function WithdrawCeloReviewScreen({ route }: Props) {
  const { amount, recipientAddress, feeEstimate } = route.params
  const { t } = useTranslation(Namespaces.exchangeFlow9)
  const isLoading = useTypedSelector((state) => state.exchange.isLoading)
  const dispatch = useDispatch()

  const onConfirmWithdraw = () => {
    ValoraAnalytics.track(CeloExchangeEvents.celo_withdraw_confirm, {
      amount: amount.toString(),
    })
    dispatch(withdrawCelo(amount, recipientAddress))
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <DisconnectBanner />
      <View style={styles.contentContainer}>
        <LineItemRow
          title={t('exchangeFlow9:withdrawCeloTo')}
          textStyle={fontStyles.regular}
          amount={<ShortenedAddress style={styles.withdrawAddress} address={recipientAddress} />}
        />
        <HorizontalLine />
        <WithdrawCeloSummary
          amount={amount}
          recipientAddress={recipientAddress}
          feeEstimate={feeEstimate}
        />
      </View>
      <Button
        onPress={onConfirmWithdraw}
        text={t(`global:withdraw`)}
        type={BtnTypes.TERTIARY}
        size={BtnSizes.FULL}
        style={styles.reviewBtn}
        testID="ConfirmWithdrawButton"
        showLoading={isLoading}
        loadingColor={colors.light}
      />
    </SafeAreaView>
  )
}

WithdrawCeloReviewScreen.navigationOptions = () => {
  const onCancel = () => {
    ValoraAnalytics.track(CeloExchangeEvents.celo_withdraw_cancel)
    navigate(Screens.ExchangeHomeScreen)
  }
  const onEdit = () => {
    ValoraAnalytics.track(CeloExchangeEvents.celo_withdraw_edit)
    navigateBack()
  }
  return {
    ...emptyHeader,
    headerTitle: () => (
      <HeaderTitleWithBalance
        title={i18n.t('exchangeFlow9:withdrawCeloReview')}
        token={CURRENCY_ENUM.GOLD}
      />
    ),
    headerLeft: () => <CancelButton onCancel={onCancel} />,
    headerRight: () => (
      <TopBarTextButton
        title={i18n.t('global:edit')}
        testID="EditButton"
        onPress={onEdit}
        titleStyle={{ color: colors.goldDark }}
        eventName={CeloExchangeEvents.celo_sell_edit}
      />
    ),
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },
  contentContainer: {
    flex: 1,
    marginTop: 38,
    paddingHorizontal: 16,
  },
  withdrawAddress: {
    ...fontStyles.regular,
    fontSize: 19,
  },
  reviewBtn: {
    padding: variables.contentPadding,
  },
})

export default WithdrawCeloReviewScreen
