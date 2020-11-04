import Button, { BtnSizes, BtnTypes } from '@celo/react-components/components/Button'
import FormInput from '@celo/react-components/components/FormInput'
import KeyboardSpacer from '@celo/react-components/components/KeyboardSpacer'
import PhoneNumberInput from '@celo/react-components/components/PhoneNumberInput'
import colors from '@celo/react-components/styles/colors'
import { Countries } from '@celo/utils/src/countries'
import { parsePhoneNumber } from '@celo/utils/src/phoneNumbers'
import { StackScreenProps } from '@react-navigation/stack'
import * as React from 'react'
import { WithTranslation } from 'react-i18next'
import { ScrollView, StyleSheet } from 'react-native'
import * as RNLocalize from 'react-native-localize'
import { SafeAreaView } from 'react-native-safe-area-context'
import { connect } from 'react-redux'
import { setName, setPhoneNumber, setPromptForno } from 'src/account/actions'
import { hideAlert, showError } from 'src/alert/actions'
import { OnboardingEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { ErrorMessages } from 'src/app/ErrorMessages'
import DevSkipButton from 'src/components/DevSkipButton'
import { Namespaces, withTranslation } from 'src/i18n'
import { nuxNavigationOptions } from 'src/navigator/Headers'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import { RootState } from 'src/redux/reducers'
import { getCountryFeatures } from 'src/utils/countryFeatures'

interface StateProps {
  cachedName: string | null
  cachedNumber: string | null
  cachedCountryCallingCode: string | null
}

interface DispatchProps {
  setPromptForno: typeof setPromptForno
  showError: typeof showError
  hideAlert: typeof hideAlert
  setPhoneNumber: typeof setPhoneNumber
  setName: typeof setName
}

type OwnProps = StackScreenProps<StackParamList, Screens.NameAndNumber>

type Props = StateProps & DispatchProps & WithTranslation & OwnProps

interface State {
  name: string
  nationalPhoneNumber: string
  e164Number: string
  isValidNumber: boolean
  countryCodeAlpha2: string
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
    cachedName: state.account.name,
    cachedNumber: state.account.e164PhoneNumber,
    cachedCountryCallingCode: state.account.defaultCountryCode,
  }
}

function getPhoneNumberState(
  phoneNumber: string,
  countryCallingCode: string,
  countryCodeAlpha2: string
) {
  const phoneDetails = parsePhoneNumber(phoneNumber, countryCallingCode)

  if (phoneDetails) {
    return {
      nationalPhoneNumber: phoneDetails.displayNumber,
      e164Number: phoneDetails.e164Number,
      isValidNumber: true,
      countryCodeAlpha2: phoneDetails.regionCode!,
    }
  } else {
    return {
      nationalPhoneNumber: phoneNumber,
      e164Number: '',
      isValidNumber: false,
      countryCodeAlpha2,
    }
  }
}

export class NameAndNumber extends React.Component<Props, State> {
  static navigationOptions = nuxNavigationOptions

  countries = new Countries(this.props.i18n.language)

  state: State = {
    name: this.props.cachedName || '',
    ...getPhoneNumberState(
      this.props.cachedNumber || '',
      this.props.cachedCountryCallingCode || '',
      RNLocalize.getCountry()
    ),
  }

  componentDidUpdate(prevProps: Props) {
    const prevCountryCodeAlpha2 = prevProps.route.params?.selectedCountryCodeAlpha2
    const countryCodeAlpha2 = this.props.route.params?.selectedCountryCodeAlpha2
    if (prevCountryCodeAlpha2 !== countryCodeAlpha2 && countryCodeAlpha2) {
      const countryCallingCode =
        this.countries.getCountryByCodeAlpha2(countryCodeAlpha2)?.countryCallingCode ?? ''
      this.setState((prevState) =>
        getPhoneNumberState(prevState.nationalPhoneNumber, countryCallingCode, countryCodeAlpha2)
      )
    }
  }

  goToNextScreen = () => {
    navigate(Screens.PincodeSet)
  }

  onChangeNameInput = (value: string) => {
    this.setState({
      name: value,
    })
  }

  onChangePhoneNumberInput = (nationalPhoneNumber: string, countryCallingCode: string) => {
    this.setState((prevState) =>
      getPhoneNumberState(nationalPhoneNumber, countryCallingCode, prevState.countryCodeAlpha2)
    )
  }

  onPressCountry = () => {
    navigate(Screens.SelectCountry, {
      countries: this.countries,
      selectedCountryCodeAlpha2: this.state.countryCodeAlpha2,
    })
  }

  onPressContinue = () => {
    this.props.hideAlert()

    const { name, e164Number, isValidNumber, countryCodeAlpha2 } = this.state
    const countryCallingCode = this.countries.getCountryByCodeAlpha2(countryCodeAlpha2)
      ?.countryCallingCode
    const { cachedName, cachedNumber, cachedCountryCallingCode } = this.props

    if (
      cachedName === name &&
      cachedNumber === e164Number &&
      cachedCountryCallingCode === countryCallingCode
    ) {
      this.goToNextScreen()
      return
    }

    if (!e164Number || !isValidNumber || !countryCallingCode) {
      // Replacing all integers except 0 with a “X” to obfuscate the number
      // but still allow us to see if symbols or leading 0s were added
      ValoraAnalytics.track(OnboardingEvents.phone_number_invalid, {
        obfuscatedPhoneNumber: e164Number.replace(/[1-9]/g, 'X'),
      })
      this.props.showError(ErrorMessages.INVALID_PHONE_NUMBER)
      return
    }

    const { SANCTIONED_COUNTRY } = getCountryFeatures(countryCodeAlpha2)
    if (SANCTIONED_COUNTRY) {
      this.props.showError(ErrorMessages.COUNTRY_NOT_AVAILABLE)
      return
    }

    if (!name) {
      this.props.showError(ErrorMessages.MISSING_FULL_NAME)
      return
    }

    this.props.setPromptForno(true) // Allow forno prompt after Welcome screen
    ValoraAnalytics.track(OnboardingEvents.phone_number_set, {
      country: this.props.route.params?.country,
      countryCode: countryCallingCode,
    })
    this.props.setPhoneNumber(e164Number, countryCallingCode)
    this.props.setName(name)
    this.goToNextScreen()
  }

  render() {
    const { t } = this.props
    const { name, nationalPhoneNumber, countryCodeAlpha2 } = this.state

    // Lookup by countryCodeAlpha2 is cheap
    const country = countryCodeAlpha2
      ? this.countries.getCountryByCodeAlpha2(countryCodeAlpha2)
      : undefined

    return (
      <SafeAreaView style={styles.container}>
        <DevSkipButton nextScreen={Screens.PincodeSet} />
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="always"
        >
          <FormInput
            label={t('fullName')}
            onChangeText={this.onChangeNameInput}
            value={name}
            enablesReturnKeyAutomatically={true}
            placeholder={t('fullNamePlaceholder')}
            testID={'NameEntry'}
          />
          <PhoneNumberInput
            label={t('phoneNumber')}
            style={styles.phoneNumberInput}
            country={country}
            nationalPhoneNumber={nationalPhoneNumber}
            onPressCountry={this.onPressCountry}
            onChange={this.onChangePhoneNumberInput}
          />
          <Button
            onPress={this.onPressContinue}
            text={t('global:next')}
            size={BtnSizes.MEDIUM}
            type={BtnTypes.ONBOARDING}
            disabled={!this.state.isValidNumber}
            testID={'NameAndNumberContinueButton'}
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
  phoneNumberInput: {
    marginVertical: 32,
  },
})

export default connect<StateProps, DispatchProps, OwnProps, RootState>(
  mapStateToProps,
  mapDispatchToProps
)(withTranslation<Props>(Namespaces.nuxNamePin1)(NameAndNumber))
