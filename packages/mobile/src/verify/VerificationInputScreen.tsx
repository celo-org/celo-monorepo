import Link from '@celo/react-components/components/Link'
import TextButton from '@celo/react-components/components/TextButton'
import TextInput from '@celo/react-components/components/TextInput'
import withTextInputPasteAware from '@celo/react-components/components/WithTextInputPasteAware'
import InviteCodeIcon from '@celo/react-components/icons/InviteCodeIcon'
import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import { stripHexLeader } from '@celo/utils/src/signatureUtils'
import dotProp from 'dot-prop-immutable'
import * as React from 'react'
import { withNamespaces, WithNamespaces } from 'react-i18next'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import Modal from 'react-native-modal'
import SafeAreaView from 'react-native-safe-area-view'
import { connect } from 'react-redux'
import { hideAlert, showError } from 'src/alert/actions'
import { errorSelector } from 'src/alert/reducer'
import componentWithAnalytics from 'src/analytics/wrapper'
import { ErrorMessages } from 'src/app/ErrorMessages'
import DevSkipButton from 'src/components/DevSkipButton'
import i18n, { Namespaces } from 'src/i18n'
import {
  cancelVerification,
  receiveAttestationMessage,
  startVerification,
} from 'src/identity/actions'
import { ATTESTATION_CODE_PLACEHOLDER } from 'src/identity/reducer'
import { AttestationCode } from 'src/identity/verification'
import { Screens } from 'src/navigator/Screens'
import { RootState } from 'src/redux/reducers'
import Logger from 'src/utils/Logger'
import { currentAccountSelector } from 'src/web3/selectors'

const CodeInput = withTextInputPasteAware(TextInput)

function getRecodedVerificationText(attestationCode: AttestationCode, t: i18n.TranslationFunction) {
  try {
    if (!attestationCode || !attestationCode.code) {
      return '---'
    }

    if (attestationCode.code === ATTESTATION_CODE_PLACEHOLDER) {
      return t('codeAccepted')
    }

    return Buffer.from(stripHexLeader(attestationCode.code), 'hex').toString('base64')
  } catch (error) {
    Logger.warn('VerificationInputScreen', 'Could not recode verification code to base64')
    return null
  }
}

interface StateProps {
  numberVerified: boolean
  e164Number: string
  account: string | null
  attestationCodes: AttestationCode[]
  numCompleteAttestations: number
  verificationFailed: boolean
  underlyingError: ErrorMessages | null | undefined
}

interface DispatchProps {
  startVerification: typeof startVerification
  cancelVerification: typeof cancelVerification
  receiveVerificationMessage: typeof receiveAttestationMessage
  showError: typeof showError
  hideAlert: typeof hideAlert
}

type Props = StateProps & DispatchProps & WithNamespaces

interface State {
  codeInputValues: string[]
  isModalVisible: boolean
}

const mapDispatchToProps = {
  startVerification,
  cancelVerification,
  receiveVerificationMessage: receiveAttestationMessage,
  showError,
  hideAlert,
}

const mapStateToProps = (state: RootState): StateProps => {
  return {
    numberVerified: state.app.numberVerified,
    e164Number: state.account.e164PhoneNumber,
    attestationCodes: state.identity.attestationCodes,
    numCompleteAttestations: state.identity.numCompleteAttestations,
    verificationFailed: state.identity.verificationFailed,
    account: currentAccountSelector(state),
    underlyingError: errorSelector(state),
  }
}

class VerificationInputScreen extends React.Component<Props, State> {
  static navigationOptions = { header: null }

  state: State = {
    codeInputValues: [],
    isModalVisible: false,
  }

  onChangeInputCode = (index: number) => {
    return (value: string) => {
      this.setState(dotProp.set(this.state, `codeInputValues.${index}`, value))
    }
  }

  onPressCodesNotReceived = () => {
    this.setState({ isModalVisible: true })
  }

  onPressWaitForCodes = () => {
    this.setState({ isModalVisible: false })
  }

  render() {
    const { codeInputValues, isModalVisible } = this.state
    const {
      attestationCodes,
      numCompleteAttestations,
      verificationFailed,
      e164Number,
      t,
    } = this.props

    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <DevSkipButton nextScreen={Screens.WalletHome} />
          <View style={styles.iconContainer}>
            <InviteCodeIcon width={152} height={48} />
          </View>
          <Text style={fontStyles.body}>
            <Text style={fontStyles.bold}>{t('input.body1')}</Text>
            {t('input.body2')}
          </Text>
          <Text style={styles.codeHeader}>{t('input.codeHeader1')}</Text>
          <CodeInput
            value={codeInputValues[0]}
            placeholder={'<#> m9oASm/3g7aZ...'}
            shouldShowClipboard={() => true}
            onChangeText={this.onChangeInputCode(0)}
            style={styles.codeInput}
          />
          <Text style={styles.codeHeader}>{t('input.codeHeader2')}</Text>
          <CodeInput
            value={codeInputValues[1]}
            placeholder={'<#> m9oASm/3g7aZ...'}
            shouldShowClipboard={() => true}
            onChangeText={this.onChangeInputCode(1)}
            style={styles.codeInput}
          />
          <Text style={styles.codeHeader}>{t('input.codeHeader3')}</Text>
          <CodeInput
            value={codeInputValues[2]}
            placeholder={'<#> m9oASm/3g7aZ...'}
            shouldShowClipboard={() => true}
            onChangeText={this.onChangeInputCode(2)}
            style={styles.codeInput}
          />
        </ScrollView>
        <Link style={styles.missingCodesLink} onPress={this.onPressCodesNotReceived}>
          {t('input.codesMissing')}
        </Link>
        <Modal isVisible={isModalVisible}>
          <View style={styles.modalContainer}>
            <Text style={fontStyles.h1}>{t('missingCodesModal.header')}</Text>
            <Text style={fontStyles.body}>{t('missingCodesModal.body')}</Text>
            <View style={styles.modalButtonsContainer}>
              <Text style={fontStyles.body}>{'0:49'}</Text>
            </View>
            <View style={styles.modalButtonsContainer}>
              <TextButton onPress={this.onPressWaitForCodes} style={styles.modalCancelText}>
                {t('global:cancel')}
              </TextButton>
              <TextButton onPress={this.onPressWaitForCodes} style={styles.modalSkipText}>
                {t('global:skip')}
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
  iconContainer: {
    alignItems: 'center',
    marginVertical: 35,
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
    paddingVertical: 20,
  },
  modalContainer: {
    backgroundColor: colors.background,
    padding: 20,
    borderRadius: 4,
  },
  modalButtonsContainer: {
    marginTop: 20,
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
