import KeyboardAwareScrollView from '@celo/react-components/components/KeyboardAwareScrollView'
import KeyboardSpacer from '@celo/react-components/components/KeyboardSpacer'
import TextButton from '@celo/react-components/components/TextButton.v2'
import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts.v2'
import { HeaderHeightContext } from '@react-navigation/stack'
import * as React from 'react'
import { Trans, WithTranslation } from 'react-i18next'
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native'
import { SafeAreaInsetsContext } from 'react-native-safe-area-context'
import { connect } from 'react-redux'
import { OnboardingEvents } from 'src/analytics/Events'
import { AnalyticsPropertiesList } from 'src/analytics/Properties'
import CodeInput, { CodeInputStatus } from 'src/components/CodeInput'
import DevSkipButton from 'src/components/DevSkipButton'
import { CELO_FAUCET_LINK, SHOW_GET_INVITE_LINK } from 'src/config'
import i18n, { Namespaces, withTranslation } from 'src/i18n'
import { redeemInvite, skipInvite } from 'src/invite/actions'
import { extractValidInviteCode, getValidInviteCodeFromReferrerData } from 'src/invite/utils'
import { HeaderTitleWithSubtitle, nuxNavigationOptions } from 'src/navigator/Headers.v2'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import TopBarTextButtonOnboarding from 'src/onboarding/TopBarTextButtonOnboarding'
import UseBackToWelcomeScreen from 'src/onboarding/UseBackToWelcomeScreen'
import { RootState } from 'src/redux/reducers'
import { navigateToURI } from 'src/utils/linking'
import { currentAccountSelector } from 'src/web3/selectors'

interface StateProps {
  redeemComplete: boolean
  isRedeemingInvite: boolean
  isSkippingInvite: boolean
  account: string | null
}

interface State {
  keyboardVisible: boolean
  inputValue: string
}

interface DispatchProps {
  redeemInvite: typeof redeemInvite
  skipInvite: typeof skipInvite
}

const mapDispatchToProps = {
  redeemInvite,
  skipInvite,
}

const mapStateToProps = (state: RootState): StateProps => {
  return {
    redeemComplete: state.invite.redeemComplete,
    isRedeemingInvite: state.invite.isRedeemingInvite,
    isSkippingInvite: state.invite.isSkippingInvite,
    account: currentAccountSelector(state),
  }
}

type Props = StateProps & DispatchProps & WithTranslation

export class EnterInviteCode extends React.Component<Props, State> {
  static navigationOptions = {
    ...nuxNavigationOptions,
    headerLeft: () => (
      <TopBarTextButtonOnboarding
        title={i18n.t('global:cancel')}
        // Note: redux state reset is handled by UseBackToWelcomeScreen
        // tslint:disable-next-line: jsx-no-lambda
        onPress={() => navigate(Screens.Welcome)}
      />
    ),
    headerTitle: () => (
      <HeaderTitleWithSubtitle
        title={i18n.t('onboarding:inviteCode.title')}
        subTitle={i18n.t('onboarding:step', { step: '3' })}
      />
    ),
  }

  state: State = {
    keyboardVisible: false,
    inputValue: '',
  }

  async componentDidMount() {
    await this.checkForInviteCode()
  }

  checkForInviteCode = async () => {
    // Check deeplink
    const validCode = await getValidInviteCodeFromReferrerData()
    if (validCode) {
      this.setState({ inputValue: validCode })
      this.props.redeemInvite(validCode)
      return
    }
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

  onToggleKeyboard = (visible: boolean) => {
    this.setState({ keyboardVisible: visible })
  }

  shouldShowClipboard = (clipboardContent: string): boolean => {
    const inviteCode = extractValidInviteCode(clipboardContent)
    return !!inviteCode && !this.state.inputValue.toLowerCase().startsWith(inviteCode.toLowerCase())
  }

  render() {
    const { t, isRedeemingInvite, isSkippingInvite, redeemComplete, account } = this.props
    const { keyboardVisible, inputValue } = this.state

    let codeStatus = CodeInputStatus.INPUTTING
    if (isRedeemingInvite) {
      codeStatus = CodeInputStatus.PROCESSING
    } else if (redeemComplete) {
      codeStatus = CodeInputStatus.ACCEPTED
    }
    const backAnalyticsEvents: [keyof AnalyticsPropertiesList] = [
      OnboardingEvents.create_account_cancel,
    ]

    if (isRedeemingInvite) {
      backAnalyticsEvents.push(OnboardingEvents.invite_redeem_cancel)
    }

    return (
      <HeaderHeightContext.Consumer>
        {(headerHeight) => (
          <SafeAreaInsetsContext.Consumer>
            {(insets) => (
              <View style={styles.container}>
                <UseBackToWelcomeScreen backAnalyticsEvents={backAnalyticsEvents} />
                <DevSkipButton nextScreen={Screens.VerificationEducationScreen} />
                <KeyboardAwareScrollView
                  style={headerHeight ? { marginTop: headerHeight } : undefined}
                  contentContainerStyle={[
                    styles.scrollContainer,
                    !keyboardVisible && insets && { marginBottom: insets.bottom },
                  ]}
                  keyboardShouldPersistTaps={'always'}
                >
                  <View>
                    <Text style={styles.body}>{t('inviteCode.body')}</Text>
                    <CodeInput
                      label={t('inviteCode.label')}
                      status={codeStatus}
                      inputValue={inputValue}
                      inputPlaceholder={t('inviteCode.codePlaceholder')}
                      onInputChange={this.onInputChange}
                      shouldShowClipboard={this.shouldShowClipboard}
                    />
                    {isRedeemingInvite && (
                      <View style={styles.loadingContainer}>
                        <Text style={styles.loadingText}>{t('inviteCode.loadingHeader')}</Text>
                        <Text style={styles.loadingText}>{t('inviteCode.loadingBody')}</Text>
                      </View>
                    )}
                  </View>
                  {isSkippingInvite && (
                    <View>
                      <ActivityIndicator size="large" color={colors.greenBrand} />
                    </View>
                  )}
                  <View>
                    {SHOW_GET_INVITE_LINK ? (
                      <Text style={styles.askInviteText}>
                        <Trans i18nKey="inviteCode.nodeCodeInviteLink" ns={Namespaces.onboarding}>
                          <Text onPress={this.onPressGoToFaucet} style={styles.askInviteLink} />
                          <Text onPress={this.onPressSkip} style={styles.askInviteLink} />
                        </Trans>
                      </Text>
                    ) : !isRedeemingInvite ? (
                      <TextButton
                        style={styles.bottomButton}
                        onPress={this.onPressSkip}
                        disabled={isRedeemingInvite || !!account}
                      >
                        {t('inviteCode.noCode')}
                      </TextButton>
                    ) : null}
                  </View>
                </KeyboardAwareScrollView>
                <KeyboardSpacer onToggle={this.onToggleKeyboard} />
              </View>
            )}
          </SafeAreaInsetsContext.Consumer>
        )}
      </HeaderHeightContext.Consumer>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.onboardingBackground,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 34,
    justifyContent: 'space-between',
  },
  body: {
    ...fontStyles.regular,
    marginBottom: 24,
  },
  askInviteText: {
    ...fontStyles.small,
    color: colors.onboardingBrownLight,
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  askInviteLink: {
    textDecorationLine: 'underline',
  },
  bottomButton: {
    textAlign: 'center',
    color: colors.onboardingBrownLight,
    padding: 16,
  },
  loadingContainer: {
    marginTop: 16,
  },
  loadingText: {
    textAlign: 'center',
    ...fontStyles.regular,
    color: colors.onboardingBrownLight,
  },
})

export default connect<StateProps, DispatchProps, {}, RootState>(
  mapStateToProps,
  mapDispatchToProps
)(withTranslation<Props>(Namespaces.onboarding)(EnterInviteCode))
