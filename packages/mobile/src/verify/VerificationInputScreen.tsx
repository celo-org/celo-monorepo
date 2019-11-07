import Link from '@celo/react-components/components/Link'
import TextButton from '@celo/react-components/components/TextButton'
import TextInput from '@celo/react-components/components/TextInput'
import withTextInputPasteAware from '@celo/react-components/components/WithTextInputPasteAware'
import SmsCeloSwap from '@celo/react-components/icons/SmsCeloSwap'
import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import { extractAttestationCodeFromMessage } from '@celo/walletkit'
import dotProp from 'dot-prop-immutable'
import * as React from 'react'
import { withNamespaces, WithNamespaces } from 'react-i18next'
import { BackHandler, ScrollView, StyleSheet, Text, View } from 'react-native'
import Modal from 'react-native-modal'
import SafeAreaView from 'react-native-safe-area-view'
import { connect } from 'react-redux'
import componentWithAnalytics from 'src/analytics/wrapper'
import CancelButton from 'src/components/CancelButton'
import DevSkipButton from 'src/components/DevSkipButton'
import { Namespaces } from 'src/i18n'
import LoadingSpinner from 'src/icons/LoadingSpinner'
import { cancelVerification, receiveAttestationMessage } from 'src/identity/actions'
import { AttestationCode, CodeInputType, VerificationStatus } from 'src/identity/verification'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { RootState } from 'src/redux/reducers'

const CodeInput = withTextInputPasteAware(TextInput)

interface StateProps {
  e164Number: string
  attestationCodes: AttestationCode[]
  numCompleteAttestations: number
  verificationStatus: VerificationStatus
}

interface DispatchProps {
  cancelVerification: typeof cancelVerification
  receiveAttestationMessage: typeof receiveAttestationMessage
}

type Props = StateProps & DispatchProps & WithNamespaces

interface State {
  timer: number
  codeInputValues: string[]
  isModalVisible: boolean
}

const mapDispatchToProps = {
  cancelVerification,
  receiveAttestationMessage,
}

const mapStateToProps = (state: RootState): StateProps => {
  return {
    e164Number: state.account.e164PhoneNumber,
    attestationCodes: state.identity.attestationCodes,
    numCompleteAttestations: state.identity.numCompleteAttestations,
    verificationStatus: state.identity.verificationStatus,
  }
}

class VerificationInputScreen extends React.Component<Props, State> {
  static navigationOptions = { header: null }

  interval: number | undefined

  state: State = {
    timer: 60,
    codeInputValues: [],
    isModalVisible: false,
  }

  componentDidMount() {
    this.interval = setInterval(() => {
      const timer = this.state.timer
      if (timer === 1) {
        clearInterval(this.interval)
      }
      this.setState({ timer: timer - 1 })
    }, 1000)
  }

  componentWillUnmount() {
    BackHandler.removeEventListener('hardwareBackPress', this.handleBackButton)
    clearInterval(this.interval)
  }

  handleBackButton() {
    // Cancel verification when user presses back button on this screen
    this.onCancel()
    return true
  }

  onCancel = () => {
    this.props.cancelVerification()
    navigate(Screens.VerificationEducationScreen)
  }

  onChangeInputCode = (index: number) => {
    return (value: string) => {
      //TODO test this with typing codes
      this.setState(dotProp.set(this.state, `codeInputValues.${index}`, value))
      if (extractAttestationCodeFromMessage(value)) {
        this.props.receiveAttestationMessage(value, CodeInputType.MANUAL)
      }
    }
  }

  onPressCodesNotReceived = () => {
    this.setState({ isModalVisible: true })
  }

  onPressWaitForCodes = () => {
    this.setState({ isModalVisible: false })
  }

  onPressSkip = () => {
    this.props.cancelVerification()
    navigate(Screens.WalletHome)
  }

  shouldShowClipboard = (value: string) => {
    return !!extractAttestationCodeFromMessage(value)
  }

  render() {
    const { codeInputValues, isModalVisible, timer } = this.state
    const { t, attestationCodes, numCompleteAttestations } = this.props

    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.buttonCancelContainer}>
          <CancelButton onCancel={this.onCancel} />
        </View>
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps={'always'}
        >
          <DevSkipButton nextScreen={Screens.WalletHome} />
          <View style={styles.iconContainer}>
            <SmsCeloSwap width={102} height={32} />
          </View>
          <Text style={fontStyles.h1} testID="VerificationInputHeader">
            {t('input.header')}
          </Text>
          <Text style={fontStyles.body}>
            <Text style={fontStyles.bold}>{t('input.body1')}</Text>
            {t('input.body2')}
          </Text>
          <Text style={styles.codeHeader}>{t('input.codeHeader1')}</Text>
          {attestationCodes[0] ? (
            <CodeInput
              value={codeInputValues[0]}
              placeholder={'<#> m9oASm/3g7aZ...'}
              shouldShowClipboard={this.shouldShowClipboard}
              onChangeText={this.onChangeInputCode(0)}
              style={styles.codeInput}
            />
          ) : (
            <View>
              <Text>{attestationCodes[0]}</Text>
            </View>
          )}
          <Text style={styles.codeHeader}>{t('input.codeHeader2')}</Text>
          {attestationCodes[1] ? (
            <CodeInput
              value={codeInputValues[1]}
              placeholder={'<#> m9oASm/3g7aZ...'}
              shouldShowClipboard={this.shouldShowClipboard}
              onChangeText={this.onChangeInputCode(1)}
              style={styles.codeInput}
            />
          ) : (
            <View>
              <Text>{attestationCodes[1]}</Text>
            </View>
          )}
          <Text style={styles.codeHeader}>{t('input.codeHeader3')}</Text>
          {attestationCodes[2] ? (
            <CodeInput
              value={codeInputValues[2]}
              placeholder={'<#> m9oASm/3g7aZ...'}
              shouldShowClipboard={this.shouldShowClipboard}
              onChangeText={this.onChangeInputCode(2)}
              style={styles.codeInput}
            />
          ) : (
            <View>
              <Text>{attestationCodes[2]}</Text>
            </View>
          )}
          <Link style={styles.missingCodesLink} onPress={this.onPressCodesNotReceived}>
            {t('input.codesMissing')}
          </Link>
        </ScrollView>
        <Modal isVisible={isModalVisible}>
          <View style={styles.modalContainer}>
            <View style={styles.modalTimerContainer}>
              <LoadingSpinner />
              <Text style={fontStyles.body}>{'0:' + timer}</Text>
            </View>
            <Text style={styles.modalHeader}>{t('missingCodesModal.header')}</Text>
            <Text style={fontStyles.body}>{t('missingCodesModal.body')}</Text>
            <View style={styles.modalButtonsContainer}>
              <TextButton onPress={this.onPressWaitForCodes} style={styles.modalCancelText}>
                {t('missingCodesModal.wait')}
              </TextButton>
              <TextButton
                onPress={this.onPressSkip}
                style={styles.modalSkipText}
                disabled={timer > 0}
              >
                {t('missingCodesModal.skip')}
              </TextButton>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    backgroundColor: colors.backgroundDarker,
  },
  scrollContainer: {
    flex: 1,
    padding: 30,
    paddingTop: 0,
  },
  buttonCancelContainer: {
    position: 'absolute',
    top: 10,
    left: 5,
    zIndex: 10,
  },
  iconContainer: {
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 20,
  },
  bodyBold: {
    ...fontStyles.body,
    ...fontStyles.semiBold,
  },
  codeHeader: {
    ...fontStyles.body,
    ...fontStyles.semiBold,
    marginTop: 20,
  },
  codeInput: {
    flex: 0,
    borderColor: colors.inputBorder,
    borderRadius: 3,
    borderWidth: 1,
    height: 50,
    marginVertical: 5,
    paddingHorizontal: 4,
  },
  missingCodesLink: {
    fontSize: 16,
    textAlign: 'center',
    paddingVertical: 10,
    marginVertical: 20,
  },
  modalContainer: {
    backgroundColor: colors.background,
    padding: 20,
    marginHorizontal: 10,
    borderRadius: 4,
  },
  modalHeader: {
    ...fontStyles.h2,
    ...fontStyles.bold,
    marginVertical: 15,
  },
  modalTimerContainer: {
    alignItems: 'center',
  },
  modalButtonsContainer: {
    marginTop: 25,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
  },
  modalCancelText: {
    ...fontStyles.body,
    ...fontStyles.semiBold,
    paddingRight: 20,
  },
  modalSkipText: {
    ...fontStyles.body,
    ...fontStyles.semiBold,
    color: colors.celoGreen,
    paddingLeft: 20,
  },
})

export default componentWithAnalytics(
  connect<StateProps, DispatchProps, {}, RootState>(
    mapStateToProps,
    mapDispatchToProps
  )(withNamespaces(Namespaces.nuxVerification2)(VerificationInputScreen))
)
