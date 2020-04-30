/**
 * This is a reactnavigation SCREEN, which we use to set a PIN.
 */
import colors from '@celo/react-components/styles/colors'
import * as React from 'react'
import { WithTranslation } from 'react-i18next'
import { StyleSheet } from 'react-native'
import SafeAreaView from 'react-native-safe-area-view'
import { connect } from 'react-redux'
import { setPincode } from 'src/account/actions'
import { PincodeType } from 'src/account/reducer'
import { showError } from 'src/alert/actions'
import CeloAnalytics from 'src/analytics/CeloAnalytics'
import { CustomEventNames } from 'src/analytics/constants'
import { componentWithAnalytics } from 'src/analytics/wrapper'
import { ErrorMessages } from 'src/app/ErrorMessages'
import DevSkipButton from 'src/components/DevSkipButton'
import { Namespaces, withTranslation } from 'src/i18n'
import { nuxNavigationOptions } from 'src/navigator/Headers'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import Pincode from 'src/pincode/Pincode'
import { isPinValid, PIN_LENGTH } from 'src/pincode/utils'

interface DispatchProps {
  showError: typeof showError
  setPincode: typeof setPincode
}

interface State {
  isPin1Inputted: boolean
  pin1: string
  pin2: string
}

type Props = DispatchProps & WithTranslation

const mapDispatchToProps = {
  showError,
  setPincode,
}

export class PincodeSet extends React.Component<Props, State> {
  static navigationOptions = nuxNavigationOptions

  state = {
    isPin1Inputted: false,
    pin1: '',
    pin2: '',
  }

  onChangePin1 = (pin1: string) => {
    this.setState({ pin1 })
  }

  onChangePin2 = (pin2: string) => {
    this.setState({ pin2 })
  }

  isPin1Valid = (pin: string) => {
    return isPinValid(pin)
  }

  isPin2Valid = (pin: string) => {
    return this.state.pin1 === pin
  }

  onPressPin1Continue = () => {
    CeloAnalytics.track(CustomEventNames.pin_value)
    this.setState({
      isPin1Inputted: true,
    })
  }

  onPressPin2Continue = () => {
    CeloAnalytics.track(CustomEventNames.pin_create_button)
    const { pin1, pin2 } = this.state
    if (this.isPin1Valid(pin1) && this.isPin2Valid(pin2)) {
      this.props.setPincode(PincodeType.CustomPin, this.state.pin1)
      navigate(Screens.EnterInviteCode)
    } else {
      this.props.showError(ErrorMessages.INCORRECT_PIN)
    }
  }

  render() {
    const { t } = this.props
    const { isPin1Inputted, pin1, pin2 } = this.state

    return (
      <SafeAreaView style={style.container}>
        <DevSkipButton nextScreen={Screens.EnterInviteCode} />
        {isPin1Inputted ? (
          // Verify
          <Pincode
            title={t('verifyPin.title')}
            placeholder={t('createPin.yourPin')}
            buttonText={t('global:save')}
            isPinValid={this.isPin2Valid}
            onPress={this.onPressPin2Continue}
            pin={pin2}
            onChangePin={this.onChangePin2}
            maxLength={PIN_LENGTH}
          />
        ) : (
          // Create
          <Pincode
            title={t('createPin.title')}
            placeholder={t('createPin.yourPin')}
            buttonText={t('global:continue')}
            isPinValid={this.isPin1Valid}
            onPress={this.onPressPin1Continue}
            pin={pin1}
            onChangePin={this.onChangePin1}
            maxLength={PIN_LENGTH}
          />
        )}
      </SafeAreaView>
    )
  }
}

const style = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'space-between',
  },
})

export default componentWithAnalytics(
  connect<{}, DispatchProps>(
    null,
    mapDispatchToProps
  )(withTranslation(Namespaces.nuxNamePin1)(PincodeSet))
)
