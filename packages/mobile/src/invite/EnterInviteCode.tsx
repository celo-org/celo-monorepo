import Button, { BtnTypes } from '@celo/react-components/components/Button'
import KeyboardAwareScrollView from '@celo/react-components/components/KeyboardAwareScrollView'
import KeyboardSpacer from '@celo/react-components/components/KeyboardSpacer'
import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import * as React from 'react'
import { WithTranslation } from 'react-i18next'
import { ActivityIndicator, Clipboard, StyleSheet, Text, View } from 'react-native'
import SafeAreaView from 'react-native-safe-area-view'
import { connect } from 'react-redux'
import { hideAlert, showError } from 'src/alert/actions'
import { componentWithAnalytics } from 'src/analytics/wrapper'
import CodeRow, { CodeRowStatus } from 'src/components/CodeRow'
import DevSkipButton from 'src/components/DevSkipButton'
import { CELO_FAUCET_LINK, SHOW_GET_INVITE_LINK } from 'src/config'
import { Namespaces, withTranslation } from 'src/i18n'
import { redeemInvite, skipInvite } from 'src/invite/actions'
import { extractValidInviteCode, getValidInviteCodeFromReferrerData } from 'src/invite/utils'
import { nuxNavigationOptionsNoBackButton } from 'src/navigator/Headers'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
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

type Props = StateProps & DispatchProps & WithTranslation

export class EnterInviteCode extends React.Component<Props, State> {
  static navigationOptions = nuxNavigationOptionsNoBackButton

  state: State = {
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
    // Check clipboard
    const message = await Clipboard.getString()
    if (extractValidInviteCode(message)) {
      this.onInputChange(message)
    }
  }

  onPressImportClick = async () => {
    navigate(Screens.ImportWallet)
  }

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

  render() {
    const { t, isRedeemingInvite, isSkippingInvite, redeemComplete, account } = this.props
    const { inputValue } = this.state

    let codeStatus = CodeRowStatus.INPUTTING
    if (isRedeemingInvite) {
      codeStatus = CodeRowStatus.PROCESSING
    } else if (redeemComplete) {
      codeStatus = CodeRowStatus.ACCEPTED
    }

    return (
      <SafeAreaView style={styles.container}>
        <KeyboardAwareScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps={'always'}
        >
          <View>
            <DevSkipButton nextScreen={Screens.VerificationEducationScreen} />
            <Text style={styles.h1} testID={'InviteCodeTitle'}>
              {t('inviteCodeText.title')}
            </Text>
            <Text style={fontStyles.body}>{t('inviteCodeText.body')}</Text>
            <Text style={styles.codeHeader}>{t('inviteCodeText.codeHeader')}</Text>
            <CodeRow
              status={codeStatus}
              inputValue={inputValue}
              inputPlaceholder={t('inviteCodeText.codePlaceholder')}
              onInputChange={this.onInputChange}
              shouldShowClipboard={this.shouldShowClipboard}
            />
          </View>
          {isSkippingInvite && (
            <View>
              <ActivityIndicator size="large" color={colors.celoGreen} />
            </View>
          )}
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
            disabled={isRedeemingInvite || !redeemComplete || !account}
            text={t('continue')}
            standard={false}
            type={BtnTypes.PRIMARY}
            testID="ContinueInviteButton"
          />
          <Button
            onPress={this.onPressImportClick}
            disabled={isRedeemingInvite || !!account}
            text={t('importIt')}
            standard={false}
            type={BtnTypes.SECONDARY}
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
    paddingTop: 0,
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
})

export default componentWithAnalytics(
  connect<StateProps, DispatchProps, {}, RootState>(
    mapStateToProps,
    mapDispatchToProps
  )(withTranslation(Namespaces.nuxNamePin1)(EnterInviteCode))
)
