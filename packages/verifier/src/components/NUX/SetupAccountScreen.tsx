import Button, { BtnTypes } from '@celo/react-components/components/Button'
import PhoneNumberInput from '@celo/react-components/components/PhoneNumberInput'
import TextInput from '@celo/react-components/components/TextInput'
import { navigate } from '@celo/react-components/services/NavigationService'
import colors from '@celo/react-components/styles/colors'
import fonts from '@celo/react-components/styles/fonts'
import { Namespaces } from 'locales'
import * as React from 'react'
import { WithNamespaces, withNamespaces } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import { NavigationScreenProps } from 'react-navigation'
import { connect } from 'react-redux'
import CeloAnalytics from 'src/analytics/CeloAnalytics'
import { CustomEventNames } from 'src/analytics/constants'
import { clearError, setCountryCode, setE164Number, setName, showError } from 'src/app/actions'
import { errorMessages } from 'src/app/reducer'
import { Screens } from 'src/navigator/Screens'
import { setVerifier } from 'src/services/FirebaseDb'
import VerifierService from 'src/services/VerifierService'
import CancelButton from 'src/shared/CancelButton'
import NuxLogo from 'src/shared/NuxLogo'

interface StateProps {
  name: string | null
}

interface State {
  name: string | null
  e164Number: string | null
  countryCode: string | null
  regionCode: string | null
  isValidNumber: boolean
  isSubmitting: boolean
}

interface NavigationParams {
  isNUXMode: boolean
}

interface DispatchProps {
  setE164Number: typeof setE164Number
  setCountryCode: typeof setCountryCode
  setName: typeof setName
  showError: typeof showError
  clearError: typeof clearError
}

type Props = WithNamespaces & DispatchProps & StateProps & NavigationScreenProps<NavigationParams>

const mapDispatchToProps = {
  setE164Number,
  setCountryCode,
  setName,
  showError,
  clearError,
}

class SetupAccountScreen extends React.Component<Props, State> {
  state: State = {
    name: null,
    e164Number: null,
    countryCode: null,
    regionCode: null,
    isValidNumber: false,
    isSubmitting: false,
  }

  scrollView = React.createRef<KeyboardAwareScrollView>()

  onSubmit = async () => {
    const { name, e164Number, isValidNumber, countryCode, regionCode } = this.state
    if (!name || !e164Number || !isValidNumber || !countryCode || !regionCode) {
      this.props.showError(errorMessages.PHONE_NUMBER_IS_INVALID)
      return
    }

    this.setState({ isSubmitting: true })

    this.props.setE164Number(e164Number)
    this.props.setCountryCode(countryCode)
    this.props.setName(name)

    const fcmToken = await VerifierService.getFCMToken()
    await setVerifier({
      name,
      phoneNum: e164Number,
      fcmToken,
      supportedRegion: regionCode,
      isVerifying: true,
    })

    const event = this.isNUXMode()
      ? CustomEventNames.setup_continue
      : CustomEventNames.submit_profile_update
    CeloAnalytics.track(event, {})

    navigate(this.isNUXMode() ? Screens.App : Screens.Settings)
  }

  setE164Number = (e164Number: string) => {
    this.setState({
      e164Number,
    })
  }

  setRegionCode = (regionCode: string) => {
    this.setState({
      regionCode,
    })
  }

  setCountryCode = (countryCode: string) => {
    this.setState({
      countryCode,
    })
  }

  onSetCountryCodeEndEditing = () => {
    if (!this.state.countryCode) {
      return
    }
    const eventName = this.isNUXMode()
      ? CustomEventNames.country_setup
      : CustomEventNames.new_phone_country
    CeloAnalytics.track(eventName, { countryCode: this.state.countryCode })
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

  onChangeNameEndEditing = () => {
    if (!this.state.name) {
      return
    }
    const eventName = this.isNUXMode()
      ? CustomEventNames.full_name_setup
      : CustomEventNames.new_name
    CeloAnalytics.track(eventName)
  }

  onChangePhoneInput = () => {
    this.props.clearError()
  }

  onChangePhoneEndEditing = () => {
    if (!this.state.e164Number) {
      return
    }
    const eventName = this.isNUXMode()
      ? CustomEventNames.phone_setup
      : CustomEventNames.new_phone_number
    CeloAnalytics.track(eventName, {
      valid: this.state.isValidNumber,
    })
  }

  scrollToEnd = () => {
    setTimeout(() => {
      if (this.scrollView && this.scrollView.current) {
        this.scrollView.current.scrollToEnd()
      }
    }, 1000)
  }

  isNUXMode() {
    return this.props.navigation.getParam('isNUXMode', true)
  }

  render() {
    const { t } = this.props
    const { name, isSubmitting } = this.state
    return (
      <View style={styles.container}>
        {this.isNUXMode() || (
          <CancelButton onPress={this.props.clearError} backScreen={Screens.Settings} />
        )}
        <KeyboardAwareScrollView
          style={styles.content}
          ref={this.scrollView}
          keyboardShouldPersistTaps={'always'}
        >
          <View style={styles.inside}>
            <NuxLogo />
            <Text style={[fonts.h1, styles.heading]}>{t('setupAccount')}</Text>
            <Text style={[fonts.paragraph, styles.textBlock]}>{t('specifyPhoneNumber')}</Text>
            <Text style={[fonts.paragraph, styles.textBlock]}>{t('mustBeVerified')}</Text>
            <View style={styles.inputs}>
              <TextInput
                placeholder={t('fullName')}
                style={styles.inputName}
                autoFocus={false}
                onChangeText={this.onChangeNameInput}
                onEndEditing={this.onChangeNameEndEditing}
                value={name!}
              />
              <PhoneNumberInput
                style={styles.inputPhoneNumber}
                defaultCountry={null}
                setE164Number={this.setE164Number}
                setCountryCode={this.setCountryCode}
                setRegionCode={this.setRegionCode}
                setIsValidNumber={this.setIsValidNumber}
                onInputFocus={this.scrollToEnd}
                onInputChange={this.onChangePhoneInput}
                onEndEditingPhoneNumber={this.onChangePhoneEndEditing}
                onEndEditingCountryCode={this.onSetCountryCodeEndEditing}
                inputCountryPlaceholder={t('country')}
                inputPhonePlaceholder={t('phoneNumber')}
              />
            </View>
          </View>
        </KeyboardAwareScrollView>
        <Button
          standard={false}
          type={BtnTypes.PRIMARY}
          text={this.isNUXMode() ? t('continue') : t('common:submit')}
          onPress={this.onSubmit}
          disabled={isSubmitting}
        />
      </View>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
    justifyContent: 'flex-start',
  },
  content: {
    flex: 1,
    paddingHorizontal: 25,
  },
  heading: {
    color: colors.dark,
  },
  inside: {
    flex: 1,
    alignItems: 'stretch',
    justifyContent: 'space-between',
  },
  textBlock: {
    marginTop: 20,
  },
  inputs: {
    flex: 1,
  },
  inputPhoneNumber: {
    marginTop: 5,
    marginBottom: 80,
    flex: 1,
  },
  inputName: {
    padding: 2,
    marginTop: 25,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: 3,
    flex: 1,
  },
})

export default withNamespaces(Namespaces.setupAccount)(
  connect<null, DispatchProps>(
    null,
    mapDispatchToProps
  )(SetupAccountScreen)
)
