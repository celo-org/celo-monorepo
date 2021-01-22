import Times from '@celo/react-components/icons/Times'
import fontStyles from '@celo/react-components/styles/fonts'
import { StackScreenProps } from '@react-navigation/stack'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { SafeAreaView, ScrollView, StyleSheet, Text } from 'react-native'
import { Namespaces } from 'src/i18n'
import { emptyHeader } from 'src/navigator/Headers'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { TopBarIconButton } from 'src/navigator/TopBarButton'
import { StackParamList } from 'src/navigator/types'
import { getDisplayName, recipientHasNumber } from 'src/recipients/recipient'

type RouteProps = StackScreenProps<StackParamList, Screens.PaymentRequestUnavailable>
type Props = RouteProps

const navigateHome = () => navigate(Screens.WalletHome)

export const paymentRequestUnavailableScreenNavOptions = () => ({
  ...emptyHeader,
  headerLeft: () => <TopBarIconButton icon={<Times />} onPress={navigateHome} />,
  headerLeftContainerStyle: styles.headerContainer,
})

const PaymentRequestUnavailable = (props: Props) => {
  const { t } = useTranslation(Namespaces.paymentRequestFlow)
  const { recipient } = props.route.params.transactionData
  const displayName = getDisplayName(recipient, t)

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.requestHeader}>
          {!recipient.name
            ? t('requestUnavailableNoDisplayNameHeader')
            : t('requestUnavailableHeader', { displayName })}
        </Text>
        <Text style={styles.body}>
          {recipientHasNumber(recipient)
            ? t('requestUnavailableBody', { e164PhoneNumber: recipient.e164PhoneNumber })
            : t('requestUnavailableNoNumberBody')}
        </Text>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },
  scrollContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 32,
    justifyContent: 'flex-start',
  },
  headerContainer: {
    paddingLeft: 16,
  },
  requestHeader: {
    ...fontStyles.h2,
    paddingVertical: 20,
    paddingHorizontal: 5,
    textAlign: 'center',
  },
  body: {
    ...fontStyles.regular,
    textAlign: 'center',
    paddingBottom: 24,
  },
})

export default PaymentRequestUnavailable
