import Button, { BtnSizes, BtnTypes } from '@celo/react-components/components/Button.v2'
import FormInput from '@celo/react-components/components/FormInput'
import KeyboardSpacer from '@celo/react-components/components/KeyboardSpacer'
import PhoneNumberInput from '@celo/react-components/components/PhoneNumberInput'
import colors from '@celo/react-components/styles/colors.v2'
import * as React from 'react'
import { WithTranslation } from 'react-i18next'
import { ScrollView, StyleSheet } from 'react-native'
import SafeAreaView from 'react-native-safe-area-view'
import { connect } from 'react-redux'
import { setName, setPhoneNumber, setPromptForno } from 'src/account/actions'
import { PincodeType } from 'src/account/reducer'
import { hideAlert, showError } from 'src/alert/actions'
import { ErrorMessages } from 'src/app/ErrorMessages'
import DevSkipButton from 'src/components/DevSkipButton'
import { Namespaces, withTranslation } from 'src/i18n'
import { nuxNavigationOptions } from 'src/navigator/Headers'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { RootState } from 'src/redux/reducers'

interface StateProps {
  language: string
  cachedName: string
  cachedNumber: string
  cachedCountryCode: string
  pincodeType: PincodeType
  acceptedTerms: boolean
}

interface DispatchProps {
  setPromptForno: typeof setPromptForno
  showError: typeof showError
  hideAlert: typeof hideAlert
  setPhoneNumber: typeof setPhoneNumber
  setName: typeof setName
}

type Props = StateProps & DispatchProps & WithTranslation

interface State {
  name: string
  e164Number: string
  countryCode: string
  isValidNumber: boolean
}

const mapDispatchToProps = {
  setPromptForno,
  setPhoneNumber,
  setName,
  showError,
  hideAlert,
}

const mapStateToProps = (state: RootState): StateProps => {
  return {
    language: state.app.language || 'en-us',
    cachedName: state.account.name,
    cachedNumber: state.account.e164PhoneNumber,
    cachedCountryCode: state.account.defaultCountryCode,
    pincodeType: state.account.pincodeType,
    acceptedTerms: state.account.acceptedTerms,
  }
}

export class JoinCelo extends React.Component<Props, State> {
  static navigationOptions = nuxNavigationOptions

  state: State = {
    name: this.props.cachedName,
    e164Number: this.props.cachedNumber,
    countryCode: this.props.cachedCountryCode,
    isValidNumber: this.props.cachedNumber !== '',
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

  onChangeNameInput = (value: string) => {
    this.setState({
      name: value,
    })
  }

  onChangePhoneInput = () => {
    this.props.hideAlert()
  }

  goToNextScreen = () => {
    if (!this.props.acceptedTerms) {
      navigate(Screens.RegulatoryTerms)
    } else if (this.props.pincodeType === PincodeType.Unset) {
      navigate(Screens.PincodeEducation)
    } else {
      navigate(Screens.EnterInviteCode)
    }
  }

  onPressCountryCode = () => {}

  onPressContinue = () => {
    this.props.hideAlert()

    const { name, e164Number, isValidNumber, countryCode } = this.state
    const { cachedName, cachedNumber, cachedCountryCode } = this.props

    if (cachedName === name && cachedNumber === e164Number && cachedCountryCode === countryCode) {
      this.goToNextScreen()
      return
    }

    if (!e164Number || !isValidNumber || !countryCode) {
      this.props.showError(ErrorMessages.INVALID_PHONE_NUMBER)
      return
    }

    if (!name) {
      this.props.showError(ErrorMessages.MISSING_FULL_NAME)
      return
    }

    this.props.setPromptForno(true) // Allow forno prompt after Welcome screen
    this.props.setPhoneNumber(e164Number, countryCode)
    this.props.setName(name)
    this.goToNextScreen()
  }

  render() {
    const { t, language, cachedCountryCode, cachedNumber } = this.props
    const { name } = this.state

    return (
      <SafeAreaView style={styles.container}>
        <DevSkipButton nextScreen={Screens.PincodeEducation} />
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="always"
        >
          <FormInput
            label={t('fullName')}
            onChangeText={this.onChangeNameInput}
            value={name}
            style={styles.nameInput}
            enablesReturnKeyAutomatically={true}
            placeholder={t('fullNamePlaceholder')}
            testID={'NameEntry'}
          />
          <PhoneNumberInput
            label={t('phoneNumber')}
            style={styles.phoneNumberInput}
            setE164Number={this.setE164Number}
            setCountryCode={this.setCountryCode}
            setIsValidNumber={this.setIsValidNumber}
            onInputChange={this.onChangePhoneInput}
            inputCountryPlaceholder={t('chooseCountry')}
            initialInputPhonePlaceholder={t('phoneNumber')}
            callingCode={true}
            lng={language}
            defaultCountryCode={cachedCountryCode !== '' ? cachedCountryCode : undefined}
            defaultPhoneNumber={cachedNumber !== '' ? cachedNumber : undefined}
            onPressCountryCode={this.onPressCountryCode}
          />
          <Button
            onPress={this.onPressContinue}
            text={t('global:next')}
            size={BtnSizes.MEDIUM}
            type={BtnTypes.SECONDARY}
            // disabled={!this.state.isValidNumber}
            testID={'JoinCeloContinueButton'}
          />
        </ScrollView>
        <KeyboardSpacer />
      </SafeAreaView>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    backgroundColor: colors.onboardingBackground,
  },
  scrollContainer: {
    padding: 24,
    paddingTop: 80,
  },
  nameInput: {},
  phoneNumberInput: {
    marginVertical: 32,
  },
})

export default connect<StateProps, DispatchProps, {}, RootState>(
  mapStateToProps,
  mapDispatchToProps
)(withTranslation(Namespaces.nuxNamePin1)(JoinCelo))
