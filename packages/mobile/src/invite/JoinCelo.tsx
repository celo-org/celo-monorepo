import Button, { BtnTypes } from '@celo/react-components/components/Button'
import PhoneNumberInput from '@celo/react-components/components/PhoneNumberInput'
import TextInput from '@celo/react-components/components/TextInput'
import colors from '@celo/react-components/styles/colors'
import { fontStyles } from '@celo/react-components/styles/fonts'
import * as React from 'react'
import { WithNamespaces, withNamespaces } from 'react-i18next'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { connect } from 'react-redux'
import { setName, setPhoneNumber } from 'src/account/actions'
import { PincodeType } from 'src/account/reducer'
import { hideAlert, showError } from 'src/alert/actions'
import { componentWithAnalytics } from 'src/analytics/wrapper'
import { ErrorMessages } from 'src/app/ErrorMessages'
import DevSkipButton from 'src/components/DevSkipButton'
import { CELO_TERMS_LINK } from 'src/config'
import { Namespaces } from 'src/i18n'
import NuxLogo from 'src/icons/NuxLogo'
import { nuxNavigationOptions } from 'src/navigator/Headers'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { RootState } from 'src/redux/reducers'
import { navigateToURI } from 'src/utils/linking'

interface StateProps {
  language: string
  cachedName: string
  cachedNumber: string
  cachedCountryCode: string
  pincodeType: PincodeType
}

interface DispatchProps {
  showError: typeof showError
  hideAlert: typeof hideAlert
  setPhoneNumber: typeof setPhoneNumber
  setName: typeof setName
}

type Props = StateProps & DispatchProps & WithNamespaces

interface State {
  name: string
  e164Number: string
  countryCode: string
  isValidNumber: boolean
}

const mapDispatchToProps = {
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

  onPressGoToTerms = () => {
    navigateToURI(CELO_TERMS_LINK)
  }

  goToNextScreen = () => {
    const nextScreen =
      this.props.pincodeType === PincodeType.Unset
        ? Screens.PincodeEducation
        : Screens.EnterInviteCode
    navigate(nextScreen)
  }

  onPressContinue = () => {
    this.props.hideAlert()

    const { name, e164Number, isValidNumber, countryCode } = this.state
    const { cachedName, cachedNumber, cachedCountryCode } = this.props

    if (cachedName === name && cachedNumber === e164Number && cachedCountryCode === countryCode) {
      this.goToNextScreen()
      return
    }

    if (!name || !e164Number || !isValidNumber || !countryCode) {
      this.props.showError(ErrorMessages.INVALID_PHONE_NUMBER)
      return
    }

    this.props.setPhoneNumber(e164Number, countryCode)
    this.props.setName(name)
    this.goToNextScreen()
  }

  render() {
    const { t, language } = this.props
    const { name } = this.state

    return (
      <View style={styles.container}>
        <DevSkipButton nextScreen={Screens.PincodeEducation} />
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="always"
        >
          <NuxLogo />
          <Text style={fontStyles.h1} testID="InviteWallTitle">
            {t('welcomeCelo')}
          </Text>
          <Text style={fontStyles.bodySmall}>{t('joinText.0')}</Text>
          <TextInput
            onChangeText={this.onChangeNameInput}
            value={name}
            style={styles.nameInputField}
            placeholderTextColor={colors.inactive}
            underlineColorAndroid="transparent"
            enablesReturnKeyAutomatically={true}
            placeholder={t('fullName')}
            testID={'NameEntry'}
          />
          <PhoneNumberInput
            setE164Number={this.setE164Number}
            setCountryCode={this.setCountryCode}
            setIsValidNumber={this.setIsValidNumber}
            onInputChange={this.onChangePhoneInput}
            inputCountryPlaceholder={t('chooseCountry')}
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
          <Text style={[fontStyles.bodyXSmall, styles.disclaimer]}>
            {t('joinText.1')}
            <Text onPress={this.onPressGoToTerms} style={fontStyles.link}>
              {t('joinText.2')}
            </Text>
          </Text>
        </ScrollView>
        <Button
          standard={false}
          type={BtnTypes.PRIMARY}
          text={t('continue')}
          onPress={this.onPressContinue}
          disabled={!this.state.isValidNumber}
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
  scrollContainer: {
    padding: 20,
    paddingTop: 0,
  },
  nameInputField: {
    marginTop: 25,
    alignItems: 'center',
    borderColor: colors.inputBorder,
    borderRadius: 3,
    borderWidth: 1,
    marginBottom: 6,
    paddingLeft: 9,
    color: colors.inactive,
    height: 50,
  },
  disclaimer: {
    marginTop: 25,
  },
})

export default componentWithAnalytics(
  connect<StateProps, DispatchProps, {}, RootState>(
    mapStateToProps,
    mapDispatchToProps
  )(withNamespaces(Namespaces.nuxNamePin1)(JoinCelo))
)
