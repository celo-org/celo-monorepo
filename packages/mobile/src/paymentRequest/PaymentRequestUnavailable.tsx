import colors from '@celo/react-components/styles/colors.v2'
import fontStyles from '@celo/react-components/styles/fonts.v2'
import { StackScreenProps } from '@react-navigation/stack'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { SafeAreaView, ScrollView, StyleSheet, Text } from 'react-native'
import { Namespaces } from 'src/i18n'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'

type RouteProps = StackScreenProps<StackParamList, Screens.PaymentRequestUnavailable>
type Props = RouteProps

const PaymentRequestUnavailable = (props: Props) => {
  const { t } = useTranslation(Namespaces.paymentRequestFlow)
  const { recipient } = props.route.params.transactionData

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.h2}>
          {recipient.displayName === 'Mobile #'
            ? t('requestUnavailableNoDisplayNameHeader')
            : t('requestUnavailableHeader', { displayName: recipient.displayName })}
        </Text>
        <Text style={styles.body}>
          {t('requestUnavailableBody', { e164PhoneNumber: recipient.e164PhoneNumber })}
        </Text>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.light,
    justifyContent: 'space-between',
  },
  scrollContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 32,
    flexDirection: 'column',
    justifyContent: 'flex-start',
  },
  h2: {
    ...fontStyles.h2,
    paddingVertical: 20,
    paddingHorizontal: 5,
    textAlign: 'center',
  },
  body: {
    ...fontStyles.regular,
    textAlign: 'center',
    paddingBottom: 20,
  },
})

export default PaymentRequestUnavailable
