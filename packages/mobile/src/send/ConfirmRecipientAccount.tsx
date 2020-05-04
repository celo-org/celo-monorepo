import Button, { BtnTypes } from '@celo/react-components/components/Button'
import KeyboardAwareScrollView from '@celo/react-components/components/KeyboardAwareScrollView'
import KeyboardSpacer from '@celo/react-components/components/KeyboardSpacer'
import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import * as React from 'react'
import { WithTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import SafeAreaView from 'react-native-safe-area-view'
import { NavigationInjectedProps } from 'react-navigation'
import { connect } from 'react-redux'
import { hideAlert, showError } from 'src/alert/actions'
import { componentWithAnalytics } from 'src/analytics/wrapper'
import CodeRow, { CodeRowStatus } from 'src/components/CodeRow'
import { CELO_FAUCET_LINK, SHOW_GET_INVITE_LINK } from 'src/config'
import i18n, { Namespaces, withTranslation } from 'src/i18n'
import { redeemInvite, skipInvite } from 'src/invite/actions'
import { extractValidInviteCode } from 'src/invite/utils'
import { headerWithBackButton } from 'src/navigator/Headers'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { RootState } from 'src/redux/reducers'
import { navigateToURI } from 'src/utils/linking'
import { currentAccountSelector } from 'src/web3/selectors'

type Navigation = NavigationInjectedProps['navigation']

interface OwnProps {
  navigation: Navigation
}

interface StateProps {
  redeemComplete: boolean
  isRedeemingInvite: boolean
  isSkippingInvite: boolean
  account: string | null
}

interface State {
  inputValue: string
}

interface DispatchProps {
  redeemInvite: typeof redeemInvite
  skipInvite: typeof skipInvite
  showError: typeof showError
  hideAlert: typeof hideAlert
}

const mapDispatchToProps = {
  redeemInvite,
  skipInvite,
  showError,
  hideAlert,
}

const mapStateToProps = (state: RootState): StateProps => {
  return {
    redeemComplete: state.invite.redeemComplete,
    isRedeemingInvite: state.invite.isRedeemingInvite,
    isSkippingInvite: state.invite.isSkippingInvite,
    account: currentAccountSelector(state),
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

  displayName = this.props.navigation.getParam('displayName')

  fullAddressValidationRequired = this.props.navigation.getParam('fullAddressValidationRequired')

  onPressContinue = () => {
    navigate(Screens.VerificationEducationScreen)
  }

  onPressGoToFaucet = () => {
    navigateToURI(CELO_FAUCET_LINK)
  }

  onPressSkip = () => {
    this.props.skipInvite()
  }

  onInputChange = (value: string) => {
    const inviteCode = extractValidInviteCode(value)
    if (inviteCode) {
      this.setState({ inputValue: inviteCode })
      this.props.redeemInvite(inviteCode)
    } else {
      this.setState({ inputValue: value })
    }
  }

  shouldShowClipboard = (value: string) => {
    return !!extractValidInviteCode(value)
  }

  renderInitialInstructions = () => {
    const { t } = this.props

    if (this.fullAddressValidationRequired) {
      return (
        <Text style={styles.body}>
          {t('confirmAccountNumber.1b', {
            displayName: this.displayName,
          })}
        </Text>
      )
    }

    return (
      <Text style={styles.body}>
        {t('confirmAccountNumber.1a', {
          displayName: this.displayName,
        })}
      </Text>
    )
  }

  renderAddressInputField = () => {
    const { t, isRedeemingInvite, redeemComplete } = this.props
    const { inputValue } = this.state

    let codeStatus = CodeRowStatus.INPUTTING
    if (isRedeemingInvite) {
      codeStatus = CodeRowStatus.PROCESSING
    } else if (redeemComplete) {
      codeStatus = CodeRowStatus.ACCEPTED
    }

    if (this.fullAddressValidationRequired) {
      return (
        <React.Fragment>
          <Text style={styles.codeHeader}>{t('accountInputHeaderB')}</Text>
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

  render() {
    const { t } = this.props

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
                displayName: this.displayName,
              })}
            </Text>
            {this.renderAddressInputField()}
          </View>
          <Text style={styles.askInviteText}>
            <Text style={fontStyles.bodySmallBold}>{t('inviteCodeText.noCode')}</Text>
            {SHOW_GET_INVITE_LINK ? (
              <>
                {t('inviteCodeText.requestCodeFromFaucet')}
                <Text onPress={this.onPressGoToFaucet} style={styles.askInviteLink}>
                  {t('inviteCodeText.faucetLink')}
                </Text>
                {' ' + t('global:or') + ' '}
                <Text onPress={this.onPressSkip} style={styles.askInviteLink}>
                  {t('inviteCodeText.skip')}
                </Text>
              </>
            ) : (
              <>
                {t('inviteCodeText.requestCodeNoFaucet')}
                <Text onPress={this.onPressSkip} style={styles.askInviteLink}>
                  {t('inviteCodeText.skip')}
                </Text>
              </>
            )}
          </Text>
        </KeyboardAwareScrollView>
        <View>
          <Button
            onPress={this.onPressContinue}
            disabled={false} // placeholder
            text={t('continue')}
            standard={false}
            type={BtnTypes.PRIMARY}
            testID="ContinueInviteButton"
          />
        </View>
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
  askInviteText: {
    ...fontStyles.bodySmall,
    marginTop: 20,
    marginBottom: 10,
  },
  askInviteLink: {
    ...fontStyles.bodySmall,
    textDecorationLine: 'underline',
  },
  body: {
    ...fontStyles.body,
    textAlign: 'center',
    paddingBottom: 15,
  },
})

export default componentWithAnalytics(
  connect<StateProps, DispatchProps, {}, RootState>(
    mapStateToProps,
    mapDispatchToProps
  )(withTranslation(Namespaces.sendFlow7)(ConfirmRecipientAccount))
)
