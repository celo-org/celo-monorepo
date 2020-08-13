// SCREEN First step on the "Withdraw CELO" flow where user provides an address to withdraw to
// and an amount.

import Button, { BtnSizes, BtnTypes } from '@celo/react-components/components/Button.v2'
import KeyboardAwareScrollView from '@celo/react-components/components/KeyboardAwareScrollView'
import KeyboardSpacer from '@celo/react-components/components/KeyboardSpacer'
import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts.v2'
import variables from '@celo/react-components/styles/variables'
import { StackScreenProps } from '@react-navigation/stack'
import BigNumber from 'bignumber.js'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { CeloExchangeEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import AccountAddressInput from 'src/components/AccountAddressInput'
import CeloAmountInput from 'src/components/CeloAmountInput'
import { CURRENCY_ENUM } from 'src/geth/consts'
import i18n, { Namespaces } from 'src/i18n'
import { HeaderTitleWithBalance, headerWithBackButton } from 'src/navigator/Headers.v2'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import useSelector from 'src/redux/useSelector'
import DisconnectBanner from 'src/shared/DisconnectBanner'

type Props = StackScreenProps<StackParamList, Screens.WithdrawCeloScreen>

function WithdrawCeloScreen({ navigation }: Props) {
  const [accountAddress, setAccountAddress] = useState('')
  const [celoToTransfer, setCeloToTransfer] = useState('')

  const goldBalance = useSelector((state) => state.goldToken.balance)
  const goldBalanceNumber = new BigNumber(goldBalance || 0)
  const { t } = useTranslation(Namespaces.exchangeFlow9)

  const celoToTransferNumber = new BigNumber(celoToTransfer)
  const readyToReview =
    accountAddress.startsWith('0x') &&
    accountAddress.length === 42 &&
    celoToTransferNumber.isGreaterThan(0) &&
    celoToTransferNumber.isLessThanOrEqualTo(goldBalanceNumber)

  const onConfirm = () => {
    const celoAmount = new BigNumber(celoToTransfer)
    ValoraAnalytics.track(CeloExchangeEvents.celo_withdraw_review, {
      amount: celoAmount.toString(),
    })
    navigation.navigate(Screens.WithdrawCeloReviewScreen, {
      amount: celoAmount,
      recipientAddress: accountAddress,
    })
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <DisconnectBanner />
      <KeyboardAwareScrollView
        keyboardShouldPersistTaps={'always'}
        contentContainerStyle={styles.contentContainer}
      >
        <Text style={styles.inputLabel}>{t('accountAddressLabel')}</Text>
        <AccountAddressInput
          inputContainerStyle={styles.inputContainer}
          inputStyle={styles.input}
          onAddressChanged={setAccountAddress}
          accountAddress={accountAddress}
        />
        <Text style={styles.inputLabel}>{t('celoAmountLabel')}</Text>
        <CeloAmountInput
          inputContainerStyle={styles.inputContainer}
          inputStyle={styles.input}
          onCeloChanged={setCeloToTransfer}
          celo={celoToTransfer}
        />
      </KeyboardAwareScrollView>
      <Button
        onPress={onConfirm}
        text={t(`global:review`)}
        accessibilityLabel={t('continue')}
        disabled={!readyToReview}
        type={BtnTypes.SECONDARY}
        size={BtnSizes.FULL}
        style={styles.reviewBtn}
        testID="WithdrawReviewButton"
      />
      <KeyboardSpacer />
    </SafeAreaView>
  )
}

WithdrawCeloScreen.navigationOptions = () => {
  return {
    ...headerWithBackButton,
    headerTitle: () => (
      <HeaderTitleWithBalance
        title={i18n.t('exchangeFlow9:withdrawCelo')}
        token={CURRENCY_ENUM.GOLD}
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
    paddingHorizontal: 16,
  },
  inputLabel: {
    marginTop: 24,
    marginBottom: 4,
    ...fontStyles.label,
  },
  inputContainer: {
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: 4,
    borderColor: colors.gray3,
  },
  input: {
    ...fontStyles.regular,
  },
  reviewBtn: {
    padding: variables.contentPadding,
  },
})

export default WithdrawCeloScreen
