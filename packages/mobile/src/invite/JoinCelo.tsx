import { BtnTypes } from '@celo/react-components/components/Button'
import PhoneNumberInput from '@celo/react-components/components/PhoneNumberInput'
import TextInput from '@celo/react-components/components/TextInput'
import colors from '@celo/react-components/styles/colors'
import { fontStyles } from '@celo/react-components/styles/fonts'
import * as React from 'react'
import { WithNamespaces, withNamespaces } from 'react-i18next'
import { Linking, ScrollView, StyleSheet, Text, TextInput as RNTextInput, View } from 'react-native'
import { connect } from 'react-redux'
import { setName, setPhoneNumber } from 'src/account/actions'
import { hideAlert, showError } from 'src/alert/actions'
import { componentWithAnalytics } from 'src/analytics/wrapper'
import { ErrorMessages } from 'src/app/ErrorMessages'
import BackButton from 'src/components/BackButton'
import DevSkipButton from 'src/components/DevSkipButton'
import GethAwareButton from 'src/geth/GethAwareButton'
import { Namespaces } from 'src/i18n'
import NuxLogo from 'src/icons/NuxLogo'
import { redeemComplete } from 'src/invite/actions'
import { navigate, navigateBack } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { RootState } from 'src/redux/reducers'
import DisconnectBanner from 'src/shared/DisconnectBanner'

function goToCeloSite() {
  Linking.openURL('https://celo.org/terms')
}

interface StateProps {
  error: ErrorMessages | null
  language: string
  cachedName: string
  cachedNumber: string
  cachedCountryCode: string
  pincodeSet: boolean
}

interface DispatchProps {
  showError: typeof showError
  hideAlert: typeof hideAlert
  setPhoneNumber: typeof setPhoneNumber
  setName: typeof setName
  redeemComplete: typeof redeemComplete
}

type Props = StateProps & DispatchProps & WithNamespaces

interface State {
  name: string
  e164Number: string
  countryCode: string
  isValidNumber: boolean
  isSubmitting: boolean
}

const mapDispatchToProps = {
  setPhoneNumber,
  setName,
  showError,
  hideAlert,
  redeemComplete,
}

const mapStateToProps = (state: RootState): StateProps => {
  return {
    error: (state.alert && state.alert.underlyingError) || null,
    language: state.app.language || 'en-us',
    cachedName: state.account.name,
    cachedNumber: state.account.e164PhoneNumber,
    cachedCountryCode: state.account.defaultCountryCode,
    pincodeSet: state.account.pincodeSet,
  }
}

const displayedErrors = [ErrorMessages.REDEEM_INVITE_FAILED, ErrorMessages.INVALID_INVITATION]

const hasDisplayedError = (error: ErrorMessages | null) => {
  return error && displayedErrors.includes(error)
}
export class JoinCelo extends React.Component<Props, State> {
  static navigationOptions = {
    headerStyle: {
      elevation: 0,
    },
    headerLeftContainerStyle: { paddingHorizontal: 20 },
    headerLeft: <BackButton />,
    headerRightContainerStyle: { paddingRight: 15 },
    headerRight: (
      <View>
        <DisconnectBanner />
      </View>
    ),
  }

  static getDerivedStateFromProps(props: Props, state: State): State | null {
    if (hasDisplayedError(props.error) && state.isSubmitting) {
      return {
        ...state,
        isSubmitting: false,
      }
    }
    return null
  }

  codeInput: any = React.createRef<RNTextInput>()
  scrollView = React.createRef<ScrollView>()

  state: State = {
    name: this.props.cachedName,
    isSubmitting: false,
    e164Number: this.props.cachedNumber,
    countryCode: this.props.cachedCountryCode,
    isValidNumber: this.props.cachedNumber !== '',
  }

  back = () => {
    navigateBack()
  }

  setE164Number = (e164Number: string) => {
    this.setState({
      e164Number,
    })
  }

  setCountryCode = (countryCode: string) => {
    this.setState({
      countryCode,
    })
  }

  setIsValidNumber = (isValidNumber: boolean) => {
    this.setState({
      isValidNumber,
    })
  }

  setName = (value: string) => {
    this.setState({ name: value })
  }

  onChangeNameInput = (value: string) => {
    this.setState({
      name: value,
    })
  }

  onChangePhoneInput = () => {
    this.props.hideAlert()
  }

  nextScreen = () => {
    const nextScreen = this.props.pincodeSet ? Screens.EnterInviteCode : Screens.Pincode
    navigate(nextScreen)
  }

  submit = async () => {
    const { name, e164Number, isValidNumber, countryCode } = this.state
    const { cachedName, cachedNumber, cachedCountryCode } = this.props

    if (cachedName === name && cachedNumber === e164Number && cachedCountryCode === countryCode) {
      this.nextScreen()
      return
    }

    if (!name || !e164Number || !isValidNumber || !countryCode) {
      this.props.showError(ErrorMessages.INVALID_PHONE_NUMBER)
      return
    }

    this.setState({ isSubmitting: true })
    this.props.hideAlert()
    this.props.setPhoneNumber(e164Number, countryCode)
    this.props.setName(name)
    this.props.redeemComplete(false)
    this.setState({ isSubmitting: false })
    this.nextScreen()
  }

  focusOnCode = () => {
    if (this.codeInput.current) {
      this.codeInput.current.focus()
    }
  }

  scrollToEnd = () => {
    setTimeout(() => {
      if (this.scrollView && this.scrollView.current) {
        this.scrollView.current.scrollToEnd()
      }
    }, 1000) // This timeout must long enough or it doesnt not work
  }

  render() {
    const { t, language } = this.props
    const { name } = this.state

    return (
      <View style={styles.container}>
        <DevSkipButton nextScreen={Screens.Pincode} />
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="always"
          ref={this.scrollView}
        >
          <View>
            <NuxLogo style={styles.logo} />
            <Text style={[fontStyles.h1, styles.center]} testID="InviteWallTitle">
              {' '}
              {t('welcomeCelo')}
            </Text>
            <Text style={[fontStyles.bodySmall, styles.body]}>{t('joinText.0')}</Text>
            <Text style={[fontStyles.bodySmall, styles.body]}>
              {t('joinText.1')}
              <Text onPress={goToCeloSite} style={fontStyles.link}>
                {t('joinText.2')}
              </Text>
            </Text>
            <TextInput
              onFocus={this.scrollToEnd}
              onChangeText={this.setName}
              value={name}
              style={styles.box}
              placeholderTextColor={colors.inactive}
              underlineColorAndroid="transparent"
              enablesReturnKeyAutomatically={true}
              onSubmitEditing={this.focusOnCode}
              placeholder={t('fullName')}
              testID={'NameEntry'}
            />
            <PhoneNumberInput
              setE164Number={this.setE164Number}
              setCountryCode={this.setCountryCode}
              setIsValidNumber={this.setIsValidNumber}
              onInputFocus={this.scrollToEnd}
              onInputChange={this.onChangePhoneInput}
              inputCountryPlaceholder={t('chooseCountryCode')}
              inputPhonePlaceholder={t('phoneNumber')}
              callingCode={true}
              lng={language}
              defaultCountryCode={
                this.props.cachedCountryCode !== '' ? this.props.cachedCountryCode : undefined
              }
              defaultPhoneNumber={
                this.props.cachedNumber !== '' ? this.props.cachedNumber : undefined
              }
            />
          </View>
        </ScrollView>
        <GethAwareButton
          standard={false}
          type={BtnTypes.PRIMARY}
          text={t('continue')}
          onPress={this.submit}
          disabled={this.state.isSubmitting || !this.state.isValidNumber}
          testID={'JoinCeloContinueButton'}
        />
      </View>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    backgroundColor: colors.background,
  },
  logo: {
    marginTop: 0,
  },
  headerRight: {
    paddingLeft: 15,
  },
  scrollContainer: {
    paddingHorizontal: 10,
    paddingBottom: 10,
  },
  box: {
    alignItems: 'center',
    borderColor: colors.inputBorder,
    borderRadius: 3,
    borderWidth: 1,
    marginBottom: 6,
    paddingLeft: 9,
    color: colors.inactive,
    height: 50,
  },
  center: {
    textAlign: 'center',
  },
  body: {
    paddingBottom: 15,
    fontWeight: '300',
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  importWallet: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-start',
    marginVertical: 17,
  },
  description: {
    padding: 30,
  },
})

export default componentWithAnalytics(
  connect<StateProps, DispatchProps, {}, RootState>(
    mapStateToProps,
    mapDispatchToProps
  )(withNamespaces(Namespaces.nuxNamePin1)(JoinCelo))
)
