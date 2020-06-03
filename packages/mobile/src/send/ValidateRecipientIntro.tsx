import ContactCircle from '@celo/react-components/components/ContactCircle'
import TextButton from '@celo/react-components/components/TextButton.v2'
import colors from '@celo/react-components/styles/colors.v2'
import fontStyles from '@celo/react-components/styles/fonts.v2'
import { StackScreenProps } from '@react-navigation/stack'
import * as React from 'react'
import { WithTranslation } from 'react-i18next'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import SafeAreaView from 'react-native-safe-area-view'
import { connect } from 'react-redux'
import { Namespaces, withTranslation } from 'src/i18n'
import { AddressValidationType } from 'src/identity/reducer'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import { getRecipientThumbnail, Recipient } from 'src/recipients/recipient'
import { RootState } from 'src/redux/reducers'
import { TransactionDataInput } from 'src/send/SendAmount'
import { formatDisplayName } from 'src/utils/formatting'

const AVATAR_SIZE = 120

interface StateProps {
  recipient: Recipient
  transactionData: TransactionDataInput
  addressValidationType: AddressValidationType
  isPaymentRequest?: true
}

type OwnProps = StackScreenProps<StackParamList, Screens.ValidateRecipientIntro>
type Props = WithTranslation & StateProps & OwnProps

const mapStateToProps = (state: RootState, ownProps: OwnProps): StateProps => {
  const { route } = ownProps
  const { recipient } = route.params.transactionData
  return {
    recipient,
    transactionData: route.params.transactionData,
    addressValidationType: route.params.addressValidationType,
    isPaymentRequest: route.params.isPaymentRequest,
  }
}

class ValidateRecipientIntro extends React.Component<Props> {
  onPressScanCode = () => {
    navigate(Screens.QRScanner, {
      transactionData: this.props.transactionData,
      scanIsForSecureSend: true,
    })
  }

  onPressConfirmAccount = () => {
    const { addressValidationType, transactionData, isPaymentRequest } = this.props

    navigate(Screens.ValidateRecipientAccount, {
      transactionData,
      addressValidationType,
      isPaymentRequest,
    })
  }

  render() {
    const { t, recipient } = this.props
    const { displayName, displayNameCapitalized } = formatDisplayName(recipient.displayName)

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
    justifyContent: 'flex-start',
  },
  iconContainer: {
    paddingTop: 20,
    alignItems: 'center',
  },
  buttonContainer: {
    paddingBottom: 60,
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

export default connect<StateProps, {}, OwnProps, RootState>(mapStateToProps)(
  withTranslation(Namespaces.sendFlow7)(ValidateRecipientIntro)
)
