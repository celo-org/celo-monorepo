import Button, { BtnTypes } from '@celo/react-components/components/Button'
import KeyboardAwareScrollView from '@celo/react-components/components/KeyboardAwareScrollView'
import KeyboardSpacer from '@celo/react-components/components/KeyboardSpacer'
import SearchUser from '@celo/react-components/icons/SearchUser'
import fontStyles from '@celo/react-components/styles/fonts'
import { StackScreenProps } from '@react-navigation/stack'
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { BackHandler, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useSelector } from 'react-redux'
import { ErrorMessages } from 'src/app/ErrorMessages'
import ErrorMessageInline from 'src/components/ErrorMessageInline'
import { Namespaces } from 'src/i18n'
import LoadingSpinner from 'src/icons/LoadingSpinner'
import { LOOKUP_GAS_FEE_ESTIMATE } from 'src/identity/privateHashing'
import { isUserBalanceSufficient } from 'src/identity/utils'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import { stableTokenBalanceSelector } from 'src/stableToken/reducer'

type Props = StackScreenProps<StackParamList, Screens.PhoneNumberLookupQuota>

function PhoneNumberLookupQuotaScreen(props: Props) {
  const [isSending, setIsSending] = useState(false)
  const userBalance = useSelector(stableTokenBalanceSelector)
  const { t } = useTranslation(Namespaces.nuxVerification2)

  const userBalanceIsSufficient = isUserBalanceSufficient(userBalance, LOOKUP_GAS_FEE_ESTIMATE)

  const onSkip = () => {
    props.route.params.onSkip()
    return true
  }

  const onBuy = () => {
    setIsSending(true)
    props.route.params.onBuy()
  }

  useEffect(() => {
    BackHandler.addEventListener('hardwareBackPress', onSkip)
    return () => BackHandler.removeEventListener('hardwareBackPress', onSkip)
  }, [])

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAwareScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps={'always'}
      >
        <SearchUser width={88} height={100} />
        <Text style={styles.h1}>{t('quotaLookup.title')}</Text>
        <Text style={styles.body}>{t('quotaLookup.body1')}</Text>
        <Text style={styles.body}>{t('quotaLookup.body2')}</Text>
        <View style={styles.spinnerContainer}>{isSending && <LoadingSpinner />}</View>
      </KeyboardAwareScrollView>
      <View>
        <View style={styles.errorMessageContainer}>
          <ErrorMessageInline
            error={userBalanceIsSufficient ? null : ErrorMessages.INSUFFICIENT_BALANCE}
          />
        </View>
        <Button
          onPress={onBuy}
          disabled={!userBalanceIsSufficient || isSending}
          text={t('quotaLookup.cta')}
          standard={false}
          type={BtnTypes.PRIMARY}
          testID="QuotaBuyButton"
        />
        <Button
          onPress={onSkip}
          disabled={isSending}
          text={t('global:skip')}
          standard={false}
          type={BtnTypes.SECONDARY}
          testID="QuotaSkipButton"
        />
      </View>
      <KeyboardSpacer />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  h1: {
    ...fontStyles.h1,
    marginTop: 20,
  },
  body: {
    ...fontStyles.bodyLarge,
    textAlign: 'center',
    marginBottom: 20,
  },
  spinnerContainer: {
    height: 40,
  },
  errorMessageContainer: {
    alignItems: 'center',
  },
})

export default PhoneNumberLookupQuotaScreen
