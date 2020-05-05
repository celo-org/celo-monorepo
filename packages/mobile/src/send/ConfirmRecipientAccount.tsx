import Button, { BtnTypes } from '@celo/react-components/components/Button'
import KeyboardAwareScrollView from '@celo/react-components/components/KeyboardAwareScrollView'
import KeyboardSpacer from '@celo/react-components/components/KeyboardSpacer'
import Checkmark from '@celo/react-components/icons/Checkmark'
import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import { delay } from 'lodash'
import * as React from 'react'
import { WithTranslation } from 'react-i18next'
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native'
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
  fullAddressValidationRequired: boolean
  isValidRecipient: boolean
  isValidatingRecipient: boolean
}

interface State {
  inputValue: string
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
    fullAddressValidationRequired: navigation.getParam('fullAddressValidationRequired'),
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
  }

  componentDidUpdate = async () => {
    if (this.props.isValidRecipient) {
      await delay(() => {}, 3000) // artificial delay for the loading animation
      navigate(Screens.SendAmount)
    }
  }

  onPressContinue = () => {
    this.props.validateRecipientAddress(
      this.state.inputValue,
      this.props.fullAddressValidationRequired
    )
  }

  onInputChange = (value: string) => {
    this.setState({ inputValue: value })
  }

  onPressHelp = () => {
    // TODO: Help Modal should pop up
  }

  shouldShowClipboard = () => false

  renderInitialInstructions = () => {
    const { t, displayName, fullAddressValidationRequired } = this.props

    if (fullAddressValidationRequired) {
      return (
        <Text style={styles.body}>
          {t('confirmAccountNumber.1b', {
            displayName,
          })}
        </Text>
      )
    }

    return (
      <Text style={styles.body}>
        {t('confirmAccountNumber.1a', {
          displayName,
        })}
      </Text>
    )
  }

  renderAddressInputField = () => {
    const { t, fullAddressValidationRequired } = this.props
    const { inputValue } = this.state
    const codeStatus = CodeRowStatus.INPUTTING

    if (fullAddressValidationRequired) {
      return (
        <React.Fragment>
          <Text style={styles.codeHeader}>{t('accountInputHeaderB')}</Text>
          <CodeRow
            status={codeStatus}
            inputValue={inputValue}
            inputPlaceholder={t('confirmAccountNumber.placeholder')}
            onInputChange={this.onInputChange}
            shouldShowClipboard={this.shouldShowClipboard}
          />
        </React.Fragment>
      )
    }

    return (
      <React.Fragment>
        <Text style={styles.codeHeader}>{t('accountInputHeaderA')}</Text>
        <CodeRow
          status={codeStatus}
          inputValue={inputValue}
          inputPlaceholder={t('inviteCodeText.codePlaceholder')}
          onInputChange={this.onInputChange}
          shouldShowClipboard={this.shouldShowClipboard}
        />
      </React.Fragment>
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
          <View>
            {this.renderInitialInstructions()}
            <Text style={styles.body}>
              {t('confirmAccountNumber.2', {
                displayName,
              })}
            </Text>
            {this.renderAddressInputField()}
          </View>
          <Text onPress={this.onPressHelp} style={styles.askHelpText}>
            {t('confirmAccountNumber.help', { displayName })}
          </Text>
        </KeyboardAwareScrollView>
        <View>{this.renderConfirmButtonOrLoadingAnimations()}</View>
        <KeyboardSpacer />
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
})

export default componentWithAnalytics(
  connect<StateProps, DispatchProps, OwnProps, RootState>(
    mapStateToProps,
    mapDispatchToProps
  )(withTranslation(Namespaces.sendFlow7)(ConfirmRecipientAccount))
)
