import Button, { BtnTypes } from '@celo/react-components/components/Button'
import ValidatedTextInput from '@celo/react-components/components/ValidatedTextInput'
import colors from '@celo/react-components/styles/colors'
import { fontStyles } from '@celo/react-components/styles/fonts'
import { ValidatorKind } from '@celo/utils/src/inputValidation'
import * as React from 'react'
import { WithNamespaces, withNamespaces } from 'react-i18next'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { pincodeSet, setPin } from 'src/account/actions'
import { hideAlert, showError } from 'src/alert/actions'
import CeloAnalytics from 'src/analytics/CeloAnalytics'
import { CustomEventNames } from 'src/analytics/constants'
import { componentWithAnalytics } from 'src/analytics/wrapper'
import { ErrorMessages } from 'src/app/ErrorMessages'
import DevSkipButton from 'src/components/DevSkipButton'
import { SUPPORTS_KEYSTORE } from 'src/config'
import { Namespaces } from 'src/i18n'
import BackupIcon from 'src/icons/BackupIcon'
import { nuxNavigationOptions } from 'src/navigator/Headers'
import { navigate, navigateBack } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import SystemAuth from 'src/pincode/SystemAuth'

enum Steps {
  EDUCATION = 0,
  PIN_ENTER = 1,
  PIN_REENTER = 2,
}

interface DispatchProps {
  showError: typeof showError
  hideAlert: typeof hideAlert
  pincodeSet: typeof pincodeSet
  setPin: typeof setPin
}

interface State {
  step: Steps
  pin1: string
  pin2: string
}

type Props = DispatchProps & WithNamespaces

// Use bindActionCreators to workaround a typescript error with the shorthand syntax with redux-thunk actions
// see https://github.com/DefinitelyTyped/DefinitelyTyped/issues/37369
const mapDispatchToProps = (dispatch: any) =>
  bindActionCreators(
    {
      showError,
      hideAlert,
      pincodeSet,
      setPin,
    },
    dispatch
  )

export class Pincode extends React.Component<Props, State> {
  static navigationOptions = nuxNavigationOptions

  state = {
    step: Steps.EDUCATION,
    pin1: '',
    pin2: '',
  }

  goBack = () => {
    navigateBack()
  }

  stepForward = () => {
    const newStep = (this.state.step + 1) % 3
    this.setState({
      step: newStep,
    })
  }

  stepBack = () => {
    const { step } = this.state
    if (step < 1) {
      navigateBack()
    } else {
      this.setState({
        step: (step - 1) % 3,
      })
    }
  }

  onChangePin1 = (pin1: string) => {
    this.setState({ pin1 })
  }

  onChangePin2 = (pin2: string) => {
    this.setState({ pin2 })
  }

  pin1IsValid = () => {
    return this.state.pin1.length === 6
  }

  pin2IsValid = () => {
    return this.state.pin1 === this.state.pin2
  }

  createPin = () => {
    CeloAnalytics.track(CustomEventNames.pin_create_button)
    const { pin1, pin2 } = this.state
    if (pin1 === pin2) {
      this.props.pincodeSet()
      navigate(Screens.EnterInviteCode)
    } else {
      this.props.showError(ErrorMessages.INCORRECT_PIN)
    }
  }

  onSubmitPin1 = () => {
    CeloAnalytics.track(CustomEventNames.pin_value)
    this.stepForward()
  }

  onPressEducation = () => {
    CeloAnalytics.track(CustomEventNames.pin_continue)
    this.stepForward()
  }

  onCancel = () => {
    if (this.state.pin1 !== '') {
      CeloAnalytics.track(CustomEventNames.pin_value)
    }
    this.stepBack()
  }

  renderStep() {
    const { t } = this.props
    switch (this.state.step) {
      case Steps.EDUCATION:
        return (
          <View style={style.pincodeContent}>
            <Text style={[fontStyles.h1, style.h1]} testID="PincodeTitle">
              {t('createPin.title')}
            </Text>
            <View style={style.explanation}>
              <Text style={fontStyles.bodySmall}>
                {t('createPin.intro') + ' ' + t('createPin.why')}
              </Text>
            </View>
            <View style={[style.explanation]}>
              <Text style={fontStyles.bodySmall}>
                {<Text style={[fontStyles.bodySmallBold]}>{t('important')} </Text>}
                {t('createPin.warn')}
              </Text>
            </View>
          </View>
        )
      case Steps.PIN_ENTER:
        return (
          <View style={style.pincodeContent}>
            <Text style={[fontStyles.h1, style.h1]}>{t('createPin.title')}</Text>
            <ValidatedTextInput
              value={this.state.pin1}
              validator={ValidatorKind.Integer}
              onChangeText={this.onChangePin1}
              onSubmitEditing={this.onSubmitPin1}
              autoFocus={true}
              keyboardType="numeric"
              maxLength={6}
              placeholder={t('createPin.yourPin')}
              secureTextEntry={true}
              style={style.numberInput}
              textContentType="password"
              nativeInput={true}
            />
          </View>
        )
      case Steps.PIN_REENTER:
        return (
          <View style={style.pincodeContent}>
            <Text style={[fontStyles.h1, style.h1]}>{t('verifyPin.title')}</Text>
            <ValidatedTextInput
              value={this.state.pin2}
              validator={ValidatorKind.Integer}
              onChangeText={this.onChangePin2}
              onSubmitEditing={this.createPin}
              autoFocus={true}
              keyboardType="numeric"
              maxLength={6}
              placeholder={t('createPin.yourPin')}
              secureTextEntry={true}
              style={style.numberInput}
              textContentType="password"
              nativeInput={true}
            />
          </View>
        )
    }
  }

  renderStepButton() {
    const { t } = this.props
    switch (this.state.step) {
      case Steps.PIN_REENTER:
        return (
          <Button
            testID="Pincode-ReEnter"
            text={t('verifyPin.finalPin')}
            style={style.button}
            standard={true}
            type={BtnTypes.PRIMARY}
            onPress={this.createPin}
            disabled={!this.pin2IsValid()}
          />
        )
      case Steps.PIN_ENTER:
        return (
          <Button
            testID="Pincode-Enter"
            text={t('continue')}
            style={style.button}
            onPress={this.stepForward}
            disabled={!this.pin1IsValid()}
            standard={true}
            type={BtnTypes.PRIMARY}
          />
        )
      default:
        return (
          <Button
            testID="Pincode-Education"
            text={t('continue')}
            style={style.button}
            onPress={this.onPressEducation}
            standard={true}
            type={BtnTypes.SECONDARY}
          />
        )
    }
  }

  render() {
    if (SUPPORTS_KEYSTORE) {
      return <SystemAuth />
    }

    return (
      <View style={style.container}>
        <DevSkipButton nextScreen={Screens.EnterInviteCode} />
        <ScrollView contentContainerStyle={style.scrollContainer}>
          <BackupIcon style={style.pincodeLogo} />
          {this.renderStep()}
        </ScrollView>
        <View style={style.pincodeFooter}>{this.renderStepButton()}</View>
      </View>
    )
  }
}

const style = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    justifyContent: 'space-between',
  },
  scrollContainer: {
    padding: 20,
    paddingTop: 0,
  },
  pincodeLogo: {
    alignSelf: 'center',
  },
  pincodeContent: {
    flex: 1,
    paddingHorizontal: 10,
  },
  explanation: {
    marginVertical: 10,
  },
  pincodeFooter: {
    alignItems: 'center',
  },
  pincodeFooterText: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingBottom: 35,
  },
  numberInput: {
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: 3,
    padding: 7,
    fontSize: 24,
    marginHorizontal: 60,
    marginVertical: 15,
    textAlign: 'center',
    backgroundColor: '#FFFFFF',
  },
  h1: {
    textAlign: 'center',
    color: colors.dark,
    padding: 25,
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 5,
  },
  header: {
    padding: 10,
    flexDirection: 'row',
  },
  goBack: {
    flex: 1,
    paddingBottom: 21,
  },
})

export default componentWithAnalytics(
  connect<{}, DispatchProps>(
    null,
    mapDispatchToProps
  )(withNamespaces(Namespaces.nuxNamePin1)(Pincode))
)
