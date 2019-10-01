import Button, { BtnTypes } from '@celo/react-components/components/Button'
import PhoneNumberInput from '@celo/react-components/components/PhoneNumberInput'
import colors from '@celo/react-components/styles/colors'
import { fontStyles } from '@celo/react-components/styles/fonts'
import { isE164Number } from '@celo/utils/src/phoneNumbers'
import * as React from 'react'
import { WithNamespaces, withNamespaces } from 'react-i18next'
import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native'
import { connect } from 'react-redux'
import { setPhoneNumber } from 'src/account/actions'
import { hideAlert, showError } from 'src/alert/actions'
import componentWithAnalytics from 'src/analytics/wrapper'
import { ErrorMessages } from 'src/app/ErrorMessages'
import DevSkipButton from 'src/components/DevSkipButton'
import { DEFAULT_COUNTRY } from 'src/config'
import NuxLogo from 'src/icons/NuxLogo'
import { startVerification } from 'src/identity/actions'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { RootState } from 'src/redux/reducers'
import DisconnectBanner from 'src/shared/DisconnectBanner'

interface StateProps {
  devModeActive: boolean
}

interface DispatchProps {
  setPhoneNumber: typeof setPhoneNumber
  showError: typeof showError
  hideAlert: typeof hideAlert
  startVerification: typeof startVerification
}

type Props = StateProps & DispatchProps & WithNamespaces

interface State {
  e164Number: string
  countryCode: string
  isValidNumber: boolean
}

const mapDispatchToProps = {
  setPhoneNumber,
  showError,
  hideAlert,
  startVerification,
}

const mapStateToProps = (state: RootState): StateProps => {
  return {
    devModeActive: state.account.devModeActive || false,
  }
}

export class Input extends React.Component<Props, State> {
  state = {
    e164Number: '',
    countryCode: '',
    isValidNumber: false,
  }

  scrollView = React.createRef<ScrollView>()

  onInputChange = () => {
    this.props.hideAlert()
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

  onSubmit = async () => {
    const { e164Number, countryCode, isValidNumber } = this.state
    if (!e164Number || !isValidNumber || !isE164Number(e164Number)) {
      this.props.showError(ErrorMessages.INVALID_PHONE_NUMBER)
      return
    }

    this.props.setPhoneNumber(e164Number, countryCode)
    this.props.startVerification()

    navigate(Screens.VerifyVerifying)
  }

  scrollToEnd = () => {
    // (Rossy): This does not work without a setTimeout.
    // I believe the animation of the keyboard showing is the problem
    setTimeout(() => {
      if (this.scrollView && this.scrollView.current) {
        this.scrollView.current.scrollToEnd()
      }
    }, 1000)
  }

  render() {
    const { t, lng } = this.props
    // This locks the country code
    const defaultCountry = this.props.devModeActive ? null : DEFAULT_COUNTRY

    return (
      <View style={style.container}>
        <DevSkipButton nextScreen={Screens.VerifyVerifying} />
        <DisconnectBanner />
        <ScrollView style={style.content} ref={this.scrollView} keyboardShouldPersistTaps="always">
          <NuxLogo testID="VerifyLogo" />
          <Text style={[fontStyles.h1, style.title]}>{t('enterPhoneToVerify')}</Text>
          <PhoneNumberInput
            style={style.phoneNumberInput}
            defaultCountry={defaultCountry}
            setE164Number={this.setE164Number}
            setCountryCode={this.setCountryCode}
            setIsValidNumber={this.setIsValidNumber}
            onInputFocus={this.scrollToEnd}
            onInputChange={this.onInputChange}
            inputCountryPlaceholder={t('country')}
            inputPhonePlaceholder={t('phoneNumber')}
            lng={lng}
          />
          <View style={style.spacer} />
        </ScrollView>
        <View>
          <Button
            onPress={this.onSubmit}
            text={t('startVerification')}
            standard={true}
            type={BtnTypes.PRIMARY}
            testID="VerifyInputAutomaticButton"
          />
        </View>
      </View>
    )
  }
}

const style = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    // Stop gap solution until we properly fix layout on iOS
    paddingTop: Platform.OS === 'ios' ? 100 : 20,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
  },
  logo: {
    alignItems: 'center',
    marginTop: 75,
    marginBottom: 25,
  },
  title: {
    marginHorizontal: 40,
  },
  phoneNumberInput: {
    marginTop: 10,
  },
  disclaimer: {
    marginTop: 20,
    marginBottom: 40,
    textAlign: 'center',
    color: colors.dark,
  },
  spacer: {
    height: 100,
  },
})

export default componentWithAnalytics(
  connect<StateProps, DispatchProps, {}, RootState>(
    mapStateToProps,
    mapDispatchToProps
  )(withNamespaces('nuxVerification2')(Input))
)
