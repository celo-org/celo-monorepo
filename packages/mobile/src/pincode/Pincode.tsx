import Button, { BtnTypes } from '@celo/react-components/components/Button'
import Link from '@celo/react-components/components/Link'
import NumberInput from '@celo/react-components/components/NumberInput'
import colors from '@celo/react-components/styles/colors'
import { fontStyles } from '@celo/react-components/styles/fonts'
import * as React from 'react'
import { WithNamespaces, withNamespaces } from 'react-i18next'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { connect } from 'react-redux'
import { pincodeSet, setPin } from 'src/account/actions'
import { hideAlert, showError } from 'src/alert/actions'
import CeloAnalytics from 'src/analytics/CeloAnalytics'
import { CustomEventNames } from 'src/analytics/constants'
import { componentWithAnalytics } from 'src/analytics/wrapper'
import { ErrorMessages } from 'src/app/ErrorMessages'
import DevSkipButton from 'src/components/DevSkipButton'
import { ERROR_BANNER_DURATION, SUPPORTS_KEYSTORE } from 'src/config'
import { Namespaces } from 'src/i18n'
import Logo from 'src/icons/Logo'
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

const mapDispatchToProps = {
  showError,
  hideAlert,
  pincodeSet,
  setPin,
}

export class Pincode extends React.Component<Props, State> {
  static navigationOptions = { header: null }

  state = {
    step: Steps.EDUCATION,
    pin1: '',
    pin2: '',
  }

  goBack = () => {
    navigateBack()
  }

  goToImportWallet = () => {
    if (this.state.pin1 !== '') {
      CeloAnalytics.track(CustomEventNames.pin_value)
    }
    CeloAnalytics.track(CustomEventNames.pin_wallet_import)
    navigate(Screens.ImportWallet)
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
      navigate(Screens.RedeemInvite)
    } else {
      this.props.showError(ErrorMessages.INCORRECT_PIN, ERROR_BANNER_DURATION)
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
              <Text style={fontStyles.body}>{t('createPin.intro') + ' ' + t('createPin.why')}</Text>
            </View>
            <View style={[style.explanation]}>
              <Text style={fontStyles.body}>
                {<Text style={[fontStyles.bodyBold]}>{t('important')} </Text>}
                {t('createPin.warn')}
              </Text>
            </View>
          </View>
        )
      case Steps.PIN_ENTER:
        return (
          <View style={style.pincodeContent}>
            <Text style={[fontStyles.h1, style.h1]}>{t('createPin.title')}</Text>
            <NumberInput
              value={this.state.pin1}
              onChange={this.onChangePin1}
              onSubmit={this.onSubmitPin1}
              isSensitiveInput={true}
              keyboardType="numeric"
              textContentType="password"
              placeholder={t('createPin.yourPin')}
              autoFocus={true}
            />
          </View>
        )
      case Steps.PIN_REENTER:
        return (
          <View style={style.pincodeContent}>
            <Text style={[fontStyles.h1, style.h1]}>{t('verifyPin.title')}</Text>
            <NumberInput
              value={this.state.pin2}
              onChange={this.onChangePin2}
              onSubmit={this.createPin}
              isSensitiveInput={true}
              keyboardType="numeric"
              textContentType="password"
              placeholder={t('createPin.yourPin')}
              autoFocus={true}
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
            text={t('continue')}
            style={style.button}
            onPress={this.onPressEducation}
            standard={true}
            type={BtnTypes.SECONDARY}
          />
        )
    }
  }

  renderHeader() {
    const { t } = this.props
    return (
      <View style={style.header}>
        <View style={style.goBack}>
          <Link onPress={this.onCancel} testID="CancelPincodeButton">
            {t('cancel')}
          </Link>
        </View>
      </View>
    )
  }

  render() {
    if (SUPPORTS_KEYSTORE) {
      return <SystemAuth />
    }

    return (
      <View style={style.pincodeContainer}>
        <DevSkipButton nextScreen={Screens.RedeemInvite} />
        <ScrollView>
          {this.renderHeader()}
          <View style={style.pincodeLogo}>
            <Logo />
          </View>
          {this.renderStep()}
        </ScrollView>
        <View style={style.pincodeFooter}>{this.renderStepButton()}</View>
      </View>
    )
  }
}

const style = StyleSheet.create({
  pincodeHeader: {
    padding: 20,
  },
  pincodeContainer: {
    flex: 1,
    backgroundColor: 'white',
    justifyContent: 'space-between',
  },
  pincodeLogo: {
    paddingTop: 30,
    alignItems: 'center',
    paddingLeft: 20,
  },
  pincodeBody: {},
  pincodeContent: {
    flex: 1,
    paddingHorizontal: 25,
  },
  explanation: {
    paddingHorizontal: 20,
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
    padding: 20,
    margin: 0,
    flexDirection: 'row',
  },
  goBack: {
    flex: 1,
  },
})

export default componentWithAnalytics(
  connect<{}, DispatchProps>(
    null,
    mapDispatchToProps
  )(withNamespaces(Namespaces.nuxNamePin1)(Pincode))
)
