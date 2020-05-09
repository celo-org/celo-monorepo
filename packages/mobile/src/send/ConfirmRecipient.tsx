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
import { setBackupDelayed } from 'src/account/actions'
import componentWithAnalytics from 'src/analytics/wrapper'
import { enterBackupFlow, exitBackupFlow } from 'src/app/actions'
import { Namespaces, withTranslation } from 'src/i18n'
import { unknownUserIcon } from 'src/images/Images'
import { headerWithBackButton } from 'src/navigator/Headers'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { getRecipientThumbnail, Recipient } from 'src/recipients/recipient'
import { RootState } from 'src/redux/reducers'
import { TransactionData } from 'src/send/SendAmount'

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
}

interface DispatchProps {
  setBackupDelayed: typeof setBackupDelayed
  enterBackupFlow: typeof enterBackupFlow
  exitBackupFlow: typeof exitBackupFlow
}

type Props = WithTranslation & StateProps & DispatchProps & OwnProps

const formatDisplayName = (displayName: string) => {
  if (displayName !== 'Mobile #') {
    return { displayName, startOfSentenceDisplayName: displayName }
  }

  return { displayName: 'your contact', startOfSentenceDisplayName: 'Your contract' }
}

const mapStateToProps = (state: RootState, ownProps: NavigationInjectedProps): StateProps => {
  const { navigation } = ownProps
  const transactionData = navigation.getParam('transactionData')
  const fullValidationRequired = navigation.getParam('fullValidationRequired')
  const { recipient } = transactionData
  const { displayName, startOfSentenceDisplayName } = formatDisplayName(recipient.displayName)
  return {
    recipient,
    transactionData,
    fullValidationRequired,
    displayName,
    startOfSentenceDisplayName,
  }
}

class ConfirmRecipient extends React.Component<Props> {
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
    const { fullValidationRequired, transactionData } = this.props

    navigate(Screens.ConfirmRecipientAccount, {
      transactionData,
      fullValidationRequired,
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
        <View>
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
    justifyContent: 'center',
  },
  iconContainer: {
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
    paddingLeft: 5,
    paddingRight: 5,
  },
  body: {
    ...fontStyles.body,
    textAlign: 'center',
    paddingBottom: 15,
  },
  loader: {
    marginBottom: 20,
  },
})

export default componentWithAnalytics(
  connect<StateProps, DispatchProps, OwnProps, RootState>(mapStateToProps, {
    setBackupDelayed,
    enterBackupFlow,
    exitBackupFlow,
  })(withTranslation(Namespaces.sendFlow7)(ConfirmRecipient))
)
