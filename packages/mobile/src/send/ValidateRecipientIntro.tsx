import Button, { BtnTypes } from '@celo/react-components/components/Button'
import ContactCircle from '@celo/react-components/components/ContactCircle'
import QRCodeBorderlessIcon from '@celo/react-components/icons/QRCodeBorderless'
import colors from '@celo/react-components/styles/colors'
import { fontStyles } from '@celo/react-components/styles/fonts'
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
import { TransactionData } from 'src/send/reducers'
import { formatDisplayName } from 'src/send/utils'

const AVATAR_SIZE = 120
const QR_ICON_SIZE = 24

type Navigation = NavigationInjectedProps['navigation']

interface OwnProps {
  navigation: Navigation
}

interface StateProps {
  recipient: Recipient
  transactionData: TransactionData
  fullValidationRequired: boolean
  displayName: string
  startOfSentenceDisplayName: string
  isPaymentRequest: true | undefined
}

type Props = WithTranslation & StateProps & OwnProps

const mapStateToProps = (state: RootState, ownProps: NavigationInjectedProps): StateProps => {
  const { navigation } = ownProps
  const transactionData = navigation.getParam('transactionData')
  const fullValidationRequired = navigation.getParam('fullValidationRequired')
  const isPaymentRequest = navigation.getParam('isPaymentRequest')
  const { recipient } = transactionData
  const { displayName, startOfSentenceDisplayName } = formatDisplayName(recipient.displayName)
  return {
    recipient,
    transactionData,
    fullValidationRequired,
    displayName,
    startOfSentenceDisplayName,
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
    const { t, recipient, displayName, startOfSentenceDisplayName } = this.props

    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.iconContainer}>
            <ContactCircle size={AVATAR_SIZE} thumbnailPath={getRecipientThumbnail(recipient)}>
              {<Image source={unknownUserIcon} style={styles.image} />}
            </ContactCircle>
          </View>
          <Text style={[styles.h1, fontStyles.bold]}>
            {t('confirmAccount.header', {
              displayName,
            })}
          </Text>
          <Text style={styles.body}>
            {t('secureSendExplanation.1', {
              e164Number: recipient.e164PhoneNumber,
              displayName: startOfSentenceDisplayName,
            })}
          </Text>
          <Text style={styles.body}>
            {t('secureSendExplanation.2', {
              displayName,
            })}
          </Text>
        </ScrollView>
        <View style={styles.buttonContainer}>
          <Button
            onPress={this.onPressScanCode}
            text={t('scanQRCode')}
            standard={false}
            type={BtnTypes.SECONDARY}
          >
            {<QRCodeBorderlessIcon height={QR_ICON_SIZE} color={colors.celoGreen} />}
          </Button>
          <Button
            onPress={this.onPressConfirmAccount}
            text={t('confirmAccount.button')}
            standard={false}
            type={BtnTypes.SECONDARY}
          />
        </View>
      </SafeAreaView>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'space-between',
  },
  scrollContainer: {
    flex: 1,
    paddingHorizontal: 30,
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
    paddingBottom: 30,
    flexDirection: 'column',
    alignItems: 'center',
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
  h1: {
    ...fontStyles.h1,
    paddingVertical: 15,
    paddingHorizontal: 5,
  },
  body: {
    ...fontStyles.body,
    textAlign: 'center',
    paddingBottom: 20,
  },
})

export default componentWithAnalytics(
  connect<StateProps, {}, OwnProps, RootState>(mapStateToProps)(
    withTranslation(Namespaces.sendFlow7)(ValidateRecipientIntro)
  )
)
