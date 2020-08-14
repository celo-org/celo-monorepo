import ContactCircle from '@celo/react-components/components/ContactCircle'
import TextButton from '@celo/react-components/components/TextButton.v2'
import fontStyles from '@celo/react-components/styles/fonts.v2'
import { StackScreenProps } from '@react-navigation/stack'
import * as React from 'react'
import { WithTranslation } from 'react-i18next'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { SendEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import CancelButton from 'src/components/CancelButton.v2'
import { Namespaces, withTranslation } from 'src/i18n'
import { emptyHeader } from 'src/navigator/Headers.v2'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import { getRecipientThumbnail } from 'src/recipients/recipient'

const AVATAR_SIZE = 64

type NavProps = StackScreenProps<StackParamList, Screens.ValidateRecipientIntro>
type Props = WithTranslation & NavProps

export const validateRecipientIntroScreenNavOptions = () => ({
  ...emptyHeader,
  headerLeft: () => <CancelButton eventName={SendEvents.send_secure_cancel} />,
})

class ValidateRecipientIntro extends React.Component<Props> {
  onPressScanCode = () => {
    const { isOutgoingPaymentRequest, transactionData, requesterAddress } = this.props.route.params
    navigate(Screens.QRNavigator, {
      screen: Screens.QRScanner,
      params: {
        transactionData,
        scanIsForSecureSend: true,
        isOutgoingPaymentRequest,
        requesterAddress,
      },
    })

    ValoraAnalytics.track(SendEvents.send_secure_start, { confirmByScan: true })
  }

  onPressConfirmAccount = () => {
    const {
      addressValidationType,
      transactionData,
      isOutgoingPaymentRequest,
      requesterAddress,
    } = this.props.route.params
    navigate(Screens.ValidateRecipientAccount, {
      transactionData,
      addressValidationType,
      isOutgoingPaymentRequest,
      requesterAddress,
    })

    ValoraAnalytics.track(SendEvents.send_secure_start, { confirmByScan: false })
  }

  render() {
    const { t } = this.props
    const { recipient } = this.props.route.params.transactionData
    const { displayName, e164PhoneNumber } = recipient

    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.iconContainer}>
            <ContactCircle
              size={AVATAR_SIZE}
              name={recipient.displayName}
              thumbnailPath={getRecipientThumbnail(recipient)}
            />
          </View>
          <Text style={styles.validationHeader}>
            {displayName === 'Mobile #'
              ? t('confirmAccount.headerNoDisplayName')
              : t('confirmAccount.header', { displayName })}
          </Text>
          <Text style={styles.body}>
            {displayName === 'Mobile #' || !e164PhoneNumber
              ? t('secureSendExplanation.body1NoDisplayName')
              : t('secureSendExplanation.body1', { e164PhoneNumber, displayName })}
          </Text>
          <Text style={styles.body}>{t('secureSendExplanation.body2')}</Text>
        </ScrollView>
        <View style={styles.buttonContainer}>
          <TextButton style={styles.button} onPress={this.onPressScanCode} testID={'scanQRCode'}>
            {t('scanQRCode')}
          </TextButton>
          <TextButton
            style={styles.button}
            onPress={this.onPressConfirmAccount}
            testID={'confirmAccountButton'}
          >
            {t('confirmAccount.button')}
          </TextButton>
        </View>
      </SafeAreaView>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },
  scrollContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 30,
    justifyContent: 'flex-start',
  },
  iconContainer: {
    paddingTop: 20,
    alignItems: 'center',
  },
  buttonContainer: {
    paddingBottom: 45,
    alignItems: 'center',
  },
  button: {
    paddingVertical: 16,
  },
  validationHeader: {
    ...fontStyles.h2,
    paddingVertical: 20,
    paddingHorizontal: 5,
    textAlign: 'center',
  },
  body: {
    ...fontStyles.small,
    textAlign: 'center',
    paddingBottom: 20,
  },
})

export default withTranslation<Props>(Namespaces.sendFlow7)(ValidateRecipientIntro)
