/**
 * This is a reactnavigation SCREEN, which we use to set a PIN.
 */
import colors from '@celo/react-components/styles/colors.v2'
import { StackScreenProps } from '@react-navigation/stack'
import * as React from 'react'
import { WithTranslation } from 'react-i18next'
import { StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { connect } from 'react-redux'
import { setPincode } from 'src/account/actions'
import { PincodeType } from 'src/account/reducer'
import CeloAnalytics from 'src/analytics/CeloAnalytics'
import { CustomEventNames } from 'src/analytics/constants'
import DevSkipButton from 'src/components/DevSkipButton'
import { Namespaces, withTranslation } from 'src/i18n'
import { nuxNavigationOptions } from 'src/navigator/Headers'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import Pincode from 'src/pincode/Pincode'
import { isPinValid } from 'src/pincode/utils'

interface DispatchProps {
  setPincode: typeof setPincode
}

interface State {
  pin1: string
  pin2: string
  errorText: string | undefined
}

type ScreenProps = StackScreenProps<StackParamList, Screens.PincodeSet>

type Props = ScreenProps & DispatchProps & WithTranslation

const mapDispatchToProps = {
  setPincode,
}

export class PincodeSet extends React.Component<Props, State> {
  static navigationOptions = nuxNavigationOptions

  state = {
    pin1: '',
    pin2: '',
    errorText: undefined,
  }

  onChangePin1 = (pin1: string) => {
    this.setState({ pin1, errorText: undefined })
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

  onCompletePin1 = () => {
    CeloAnalytics.track(CustomEventNames.pin_value)
    this.props.navigation.setParams({ isVerifying: true })
  }

  onCompletePin2 = (pin2: string) => {
    CeloAnalytics.track(CustomEventNames.pin_create_button)
    const { pin1 } = this.state
    if (this.isPin1Valid(pin1) && this.isPin2Valid(pin2)) {
      this.props.setPincode(PincodeType.CustomPin, this.state.pin1)
      navigate(Screens.EnterInviteCode)
    } else {
      this.props.navigation.setParams({ isVerifying: false })
      this.setState({
        pin1: '',
        pin2: '',
        errorText: this.props.t('pincodeSet.pinsDontMatch'),
      })
    }
  }

  render() {
    const { route } = this.props
    const isVerifying = route.params?.isVerifying
    const { pin1, pin2, errorText } = this.state

    return (
      <SafeAreaView style={style.container}>
        <DevSkipButton nextScreen={Screens.EnterInviteCode} />
        {isVerifying ? (
          // Verify
          <Pincode
            errorText={errorText}
            pin={pin2}
            onChangePin={this.onChangePin2}
            onCompletePin={this.onCompletePin2}
          />
        ) : (
          // Create
          <Pincode
            errorText={errorText}
            pin={pin1}
            onChangePin={this.onChangePin1}
            onCompletePin={this.onCompletePin1}
          />
        )}
      </SafeAreaView>
    )
  }
}

const style = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.onboardingBackground,
    justifyContent: 'space-between',
  },
})

export default connect<{}, DispatchProps>(
  null,
  mapDispatchToProps
)(withTranslation<Props>(Namespaces.onboarding)(PincodeSet))
