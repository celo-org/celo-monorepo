import Button, { BtnTypes } from '@celo/react-components/components/Button'
import KeyboardAwareScrollView from '@celo/react-components/components/KeyboardAwareScrollView'
import KeyboardSpacer from '@celo/react-components/components/KeyboardSpacer'
import TextButton from '@celo/react-components/components/TextButton'
import Checkmark from '@celo/react-components/icons/Checkmark'
import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import { delay } from 'lodash'
import * as React from 'react'
import { WithTranslation } from 'react-i18next'
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native'
import Modal from 'react-native-modal'
import SafeAreaView from 'react-native-safe-area-view'
import { NavigationInjectedProps } from 'react-navigation'
import { connect } from 'react-redux'
import { componentWithAnalytics } from 'src/analytics/wrapper'
import CodeRow, { CodeRowStatus } from 'src/components/CodeRow'
import i18n, { Namespaces, withTranslation } from 'src/i18n'
import { headerWithBackButton } from 'src/navigator/Headers'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { RootState } from 'src/redux/reducers'
import { validateRecipientAddress } from 'src/send/actions'

type Navigation = NavigationInjectedProps['navigation']

interface OwnProps {
  navigation: Navigation
}

interface StateProps {
  displayName: string
  fullValidationRequired: boolean
  isValidRecipient: boolean
  isValidatingRecipient: boolean
}

interface State {
  inputValue: string
  isModalVisible: boolean
}

interface DispatchProps {
  validateRecipientAddress: typeof validateRecipientAddress
}

const mapDispatchToProps = {
  validateRecipientAddress,
}

const mapStateToProps = (state: RootState, ownProps: NavigationInjectedProps): StateProps => {
  const { navigation } = ownProps
  return {
    displayName: navigation.getParam('displayName'),
    fullValidationRequired: navigation.getParam('fullValidationRequired'),
    isValidRecipient: state.send.isValidRecipient,
    isValidatingRecipient: state.send.isValidatingRecipient,
  }
}

type Props = StateProps & DispatchProps & WithTranslation & OwnProps

export class ConfirmRecipientAccount extends React.Component<Props, State> {
  static navigationOptions = () => ({
    ...headerWithBackButton,
    headerTitle: i18n.t('sendFlow7:confirmAccountNumber.title'),
  })

  state: State = {
    inputValue: '',
    isModalVisible: false,
  }

  componentDidUpdate = async () => {
    if (this.props.isValidRecipient) {
      await delay(() => {}, 3000) // artificial delay for the loading animation
      navigate(Screens.SendAmount)
    }
  }

  onPressContinue = () => {
    this.props.validateRecipientAddress(this.state.inputValue, this.props.fullValidationRequired)
  }

  onInputChange = (value: string) => {
    this.setState({ inputValue: value })
  }

  toggleModal = () => {
    this.setState({ isModalVisible: !this.state.isModalVisible })
  }

  shouldShowClipboard = () => false

  renderInstructionsAndInputField = () => {
    const { t, displayName, fullValidationRequired } = this.props
    const { inputValue } = this.state
    const codeStatus = CodeRowStatus.INPUTTING

    if (fullValidationRequired) {
      return (
        <View>
          <Text style={styles.body}>
            {t('confirmAccountNumber.1b', {
              displayName,
            })}
          </Text>
          <Text style={styles.body}>
            {t('confirmAccountNumber.2b', {
              displayName,
            })}
          </Text>
          <Text style={styles.codeHeader}>{t('accountInputHeaderB')}</Text>
          <CodeRow
            status={codeStatus}
            inputValue={inputValue}
            inputPlaceholder={t('confirmAccountNumber.placeholder')}
            onInputChange={this.onInputChange}
            shouldShowClipboard={this.shouldShowClipboard}
          />
        </View>
      )
    }

    return (
      <View>
        <Text style={styles.body}>
          {t('confirmAccountNumber.1a', {
            displayName,
          })}
        </Text>
        <Text style={styles.body}>
          {t('confirmAccountNumber.2a', {
            displayName,
          })}
        </Text>
        <Text style={styles.codeHeader}>{t('accountInputHeaderA')}</Text>
        <CodeRow
          status={codeStatus}
          inputValue={inputValue}
          inputPlaceholder={t('inviteCodeText.codePlaceholder')}
          onInputChange={this.onInputChange}
          shouldShowClipboard={this.shouldShowClipboard}
        />
      </View>
    )
  }

  renderConfirmButtonOrLoadingAnimations = () => {
    const { t, isValidRecipient, isValidatingRecipient } = this.props

    if (isValidatingRecipient) {
      return (
        <ActivityIndicator size="small" color={colors.celoGreen} style={styles.codeInputSpinner} />
      )
    }

    if (isValidRecipient) {
      return (
        <View style={styles.checkmarkContainer}>
          <Checkmark height={20} width={20} />
        </View>
      )
    }

    return (
      <Button
        onPress={this.onPressContinue}
        text={t('continue')}
        standard={false}
        type={BtnTypes.PRIMARY}
        testID="ContinueInviteButton"
      />
    )
  }

  render() {
    const { t, displayName } = this.props

    return (
      <SafeAreaView style={styles.container}>
        <KeyboardAwareScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps={'always'}
        >
          <View>{this.renderInstructionsAndInputField()}</View>
          <Text onPress={this.toggleModal} style={styles.askHelpText}>
            {t('confirmAccountNumber.help', { displayName })}
          </Text>
        </KeyboardAwareScrollView>
        <View>{this.renderConfirmButtonOrLoadingAnimations()}</View>
        <KeyboardSpacer />
        <Modal isVisible={this.state.isModalVisible}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalHeader}>{t('helpModal.header')}</Text>
            <Text style={fontStyles.body}>{t('helpModal.body1')}</Text>
            <Text style={fontStyles.body}>{t('helpModal.body2')}</Text>
            <View style={styles.modalButtonsContainer}>
              <TextButton onPress={this.toggleModal} style={styles.modalCancelText}>
                {t('global:close')}
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
    backgroundColor: colors.background,
    justifyContent: 'space-between',
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
    paddingTop: 40,
    justifyContent: 'space-between',
  },
  codeHeader: {
    ...fontStyles.body,
    ...fontStyles.semiBold,
    marginTop: 20,
  },
  h1: {
    ...fontStyles.h1,
    marginTop: 20,
    flex: 1,
    justifyContent: 'center',
  },
  codeInputSpinner: {
    backgroundColor: '#FFF',
    position: 'absolute',
    top: 5,
    right: 3,
    padding: 10,
  },
  checkmarkContainer: {
    backgroundColor: colors.darkLightest,
    position: 'absolute',
    top: 3,
    right: 3,
    padding: 10,
  },
  askHelpText: {
    ...fontStyles.bodySmall,
    marginTop: 20,
    marginBottom: 10,
    textDecorationLine: 'underline',
    justifyContent: 'center',
  },
  body: {
    ...fontStyles.body,
    textAlign: 'center',
    paddingBottom: 15,
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
})

export default componentWithAnalytics(
  connect<StateProps, DispatchProps, OwnProps, RootState>(
    mapStateToProps,
    mapDispatchToProps
  )(withTranslation(Namespaces.sendFlow7)(ConfirmRecipientAccount))
)
