import ContactCircle from '@celo/react-components/components/ContactCircle'
import TextButton from '@celo/react-components/components/TextButton.v2'
import colors from '@celo/react-components/styles/colors.v2'
import fontStyles from '@celo/react-components/styles/fonts.v2'
import * as React from 'react'
import { WithTranslation } from 'react-i18next'
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native'
import SafeAreaView from 'react-native-safe-area-view'
import { NavigationInjectedProps } from 'react-navigation'
import { connect } from 'react-redux'
import componentWithAnalytics from 'src/analytics/wrapper'
import { Namespaces, withTranslation } from 'src/i18n'
import { unknownUserIcon } from 'src/images/Images'
import { headerWithBackButton } from 'src/navigator/Headers'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { getRecipientThumbnail, Recipient } from 'src/recipients/recipient'
import { RootState } from 'src/redux/reducers'
import { TransactionDataInput } from 'src/send/SendAmount'
import { formatDisplayName } from 'src/utils/formatting'

const AVATAR_SIZE = 120

type Navigation = NavigationInjectedProps['navigation']

interface OwnProps {
  navigation: Navigation
}
interface StateProps {
  recipient: Recipient
  transactionData: TransactionDataInput
  fullValidationRequired: boolean
  displayName: string
  displayNameCapitalized: string
  isPaymentRequest: true | undefined
}

type Props = WithTranslation & StateProps & OwnProps

const mapStateToProps = (state: RootState, ownProps: OwnProps): StateProps => {
  const { navigation } = ownProps
  const transactionData = navigation.getParam('transactionData')
  const fullValidationRequired = navigation.getParam('fullValidationRequired')
  const isPaymentRequest = navigation.getParam('isPaymentRequest')
  const { recipient } = transactionData
  const { displayName, displayNameCapitalized } = formatDisplayName(recipient.displayName)
  return {
    recipient,
    transactionData,
    fullValidationRequired,
    displayName,
    displayNameCapitalized,
    isPaymentRequest,
  }
}

class ValidateRecipientIntro extends React.Component<Props> {
  static navigationOptions = () => ({
    ...headerWithBackButton,
  })

  onPressScanCode = () => {
    navigate(Screens.QRScanner, {
      transactionData: this.props.transactionData,
      scanIsForSecureSend: true,
    })
  }

  onPressConfirmAccount = () => {
    const { fullValidationRequired, transactionData, isPaymentRequest } = this.props

    navigate(Screens.ValidateRecipientAccount, {
      transactionData,
      fullValidationRequired,
      isPaymentRequest,
    })
  }

  render() {
    const { t, recipient, displayName, displayNameCapitalized } = this.props

    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.iconContainer}>
            <ContactCircle size={AVATAR_SIZE} thumbnailPath={getRecipientThumbnail(recipient)}>
              {<Image source={unknownUserIcon} style={styles.image} />}
            </ContactCircle>
          </View>
          <Text style={styles.h2}>
            {t('confirmAccount.header', {
              displayName,
            })}
          </Text>
          <Text style={styles.body}>
            {t('secureSendExplanation.body1', {
              e164Number: recipient.e164PhoneNumber,
              displayName: displayNameCapitalized,
            })}
          </Text>
          <Text style={styles.body}>
            {t('secureSendExplanation.body2', {
              displayName,
            })}
          </Text>
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
    backgroundColor: colors.light,
    justifyContent: 'space-between',
  },
  scrollContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 30,
    flexDirection: 'column',
    justifyContent: 'flex-start',
  },
  iconContainer: {
    paddingTop: 20,
    flexDirection: 'column',
    alignItems: 'center',
  },
  buttonContainer: {
    paddingBottom: 60,
    flexDirection: 'column',
    alignItems: 'center',
  },
  button: {
    paddingVertical: 16,
  },
  image: {
    height: AVATAR_SIZE,
    width: AVATAR_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrLogo: {
    alignSelf: 'center',
    marginBottom: 30,
  },
  h2: {
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

export default componentWithAnalytics(
  connect<StateProps, {}, OwnProps, RootState>(mapStateToProps)(
    withTranslation(Namespaces.sendFlow7)(ValidateRecipientIntro)
  )
)
