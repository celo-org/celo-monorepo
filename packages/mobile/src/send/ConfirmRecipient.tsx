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
import { isBackupTooLate } from 'src/redux/selectors'

const AVATAR_SIZE = 120
const QR_ICON_SIZE = 24

type Navigation = NavigationInjectedProps['navigation']

interface OwnProps {
  navigation: Navigation
}

interface State {
  displayName: string
  displayNameStartOfSentence: string
}

interface StateProps {
  backupCompleted: boolean
  socialBackupCompleted: boolean
  backupTooLate: boolean
  backupDelayedTime: number
}

interface DispatchProps {
  setBackupDelayed: typeof setBackupDelayed
  enterBackupFlow: typeof enterBackupFlow
  exitBackupFlow: typeof exitBackupFlow
}

type Props = WithTranslation & StateProps & DispatchProps & OwnProps

const mapStateToProps = (state: RootState): StateProps => {
  return {
    backupCompleted: state.account.backupCompleted,
    socialBackupCompleted: state.account.socialBackupCompleted,
    backupTooLate: isBackupTooLate(state),
    backupDelayedTime: state.account.backupDelayedTime,
  }
}

class ConfirmRecipient extends React.Component<Props> {
  static navigationOptions = () => ({
    ...headerWithBackButton,
  })

  state: State = {
    displayName: '',
    displayNameStartOfSentence: '',
  }

  componentDidMount = () => {
    const recipient = this.getRecipient()
    const displayName = this.formatDisplayName(recipient.displayName)
    const displayNameStartOfSentence = this.formatDisplayName(recipient.displayName, true)
    this.setState({ displayName, displayNameStartOfSentence })
  }

  getRecipient = (): Recipient => {
    const recipient = this.props.navigation.getParam('recipient')
    if (!recipient) {
      throw new Error('Recipient expected')
    }
    return recipient
  }

  formatDisplayName = (displayName: string, isAtStartOfSentence?: boolean) => {
    // OPEN QUESTION: Is default displayName also "Mobile #" for Android?
    if (displayName !== 'Mobile #') {
      return displayName
    }

    if (isAtStartOfSentence) {
      return 'This person'
    }

    return 'this person'
  }

  onPressScanCode = () => {
    navigate(Screens.QRScanner, { secureSendFlow: true })
  }

  onPressConfirmAccount = () => {
    const fullAddressValidationRequired = this.props.navigation.getParam(
      'fullAddressValidationRequired'
    )
    navigate(Screens.ConfirmRecipientAccount, {
      displayName: this.state.displayName,
      fullAddressValidationRequired,
    })
  }

  render() {
    const { t } = this.props
    const recipient = this.getRecipient()
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
              displayName: this.state.displayName,
            })}
          </Text>
          <Text style={styles.body}>
            {t('secureSendExplanation.1', {
              e164Number: recipient.e164PhoneNumber,
              displayName: this.state.displayNameStartOfSentence,
            })}
          </Text>
          <Text style={styles.body}>
            {t('secureSendExplanation.2', {
              displayName: this.state.displayName,
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
  connect<StateProps, DispatchProps, {}, RootState>(mapStateToProps, {
    setBackupDelayed,
    enterBackupFlow,
    exitBackupFlow,
  })(withTranslation(Namespaces.sendFlow7)(ConfirmRecipient))
)
