import Button, { BtnTypes } from '@celo/react-components/components/Button'
import HorizontalLine from '@celo/react-components/components/HorizontalLine'
import NumberKeypad from '@celo/react-components/components/NumberKeypad'
import colors from '@celo/react-components/styles/colors'
import { fontStyles } from '@celo/react-components/styles/fonts'
import { componentStyles } from '@celo/react-components/styles/styles'
import * as React from 'react'
import { WithNamespaces, withNamespaces } from 'react-i18next'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { connect } from 'react-redux'
import { setPincode } from 'src/account/actions'
import { PincodeType } from 'src/account/reducer'
import { hideAlert, showError } from 'src/alert/actions'
import CeloAnalytics from 'src/analytics/CeloAnalytics'
import { CustomEventNames } from 'src/analytics/constants'
import { componentWithAnalytics } from 'src/analytics/wrapper'
import { ErrorMessages } from 'src/app/ErrorMessages'
import DevSkipButton from 'src/components/DevSkipButton'
import { Namespaces } from 'src/i18n'
import { nuxNavigationOptions } from 'src/navigator/Headers'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import PincodeTextbox from 'src/pincode/PincodeTextbox'

interface DispatchProps {
  showError: typeof showError
  hideAlert: typeof hideAlert
  setPincode: typeof setPincode
}

interface State {
  isPin1Inputted: boolean
  pin1: string
  pin2: string
}

type Props = DispatchProps & WithNamespaces

const mapDispatchToProps = {
  showError,
  hideAlert,
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

  isPin1Valid = () => {
    return this.state.pin1.length === 6
  }

  isPin2Valid = () => {
    return this.state.pin1 === this.state.pin2
  }

  onPressPin1Continue = () => {
    CeloAnalytics.track(CustomEventNames.pin_value)
    this.setState({
      isPin1Inputted: true,
    })
  }

  onPressPin2Continue = () => {
    CeloAnalytics.track(CustomEventNames.pin_create_button)
    if (this.isPin1Valid() && this.isPin2Valid()) {
      this.props.setPincode(PincodeType.CustomPin, this.state.pin1)
      navigate(Screens.EnterInviteCode)
    } else {
      this.props.showError(ErrorMessages.INCORRECT_PIN)
    }
  }

  onDigitPress = (digit: number) => {
    const { pin1, pin2, isPin1Inputted } = this.state
    if (!isPin1Inputted) {
      this.setState({
        pin1: (pin1 + digit).substr(0, 6),
      })
    } else {
      this.setState({
        pin2: (pin2 + digit).substr(0, 6),
      })
    }
  }

  onBackspacePress = () => {
    const { pin1, pin2, isPin1Inputted } = this.state
    if (!isPin1Inputted) {
      this.setState({
        pin1: pin1.substr(0, pin1.length - 1),
      })
    } else {
      this.setState({
        pin2: pin2.substr(0, pin2.length - 1),
      })
    }
  }

  render() {
    const { t } = this.props
    const { isPin1Inputted, pin1, pin2 } = this.state

    return (
      <View style={style.container}>
        <DevSkipButton nextScreen={Screens.EnterInviteCode} />
        <ScrollView contentContainerStyle={style.scrollContainer}>
          <View>
            <Text style={[fontStyles.h1, componentStyles.marginTop15]}>
              {isPin1Inputted ? t('verifyPin.title') : t('createPin.title')}
            </Text>
            <View style={style.pincodeContainer}>
              <PincodeTextbox
                pin={isPin1Inputted ? pin2 : pin1}
                placeholder={t('createPin.yourPin')}
              />
            </View>
          </View>
          <View>
            <HorizontalLine />
            <View style={style.keypadContainer}>
              <NumberKeypad
                showDecimal={false}
                onDigitPress={this.onDigitPress}
                onBackspacePress={this.onBackspacePress}
              />
            </View>
          </View>
        </ScrollView>
        {!isPin1Inputted && (
          <Button
            testID="Pincode-Enter"
            text={t('global:continue')}
            standard={true}
            type={BtnTypes.PRIMARY}
            onPress={this.onPressPin1Continue}
            disabled={!this.isPin1Valid()}
          />
        )}
        {isPin1Inputted && (
          <Button
            testID="Pincode-ReEnter"
            text={t('global:save')}
            standard={true}
            type={BtnTypes.PRIMARY}
            onPress={this.onPressPin2Continue}
            disabled={!this.isPin2Valid()}
          />
        )}
      </View>
    )
  }
}

const style = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'space-between',
  },
  scrollContainer: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 0,
  },
  pincodeContainer: {
    marginBottom: 20,
    alignItems: 'center',
  },
  keypadContainer: {
    marginVertical: 15,
    paddingHorizontal: 20,
  },
})

export default componentWithAnalytics(
  connect<{}, DispatchProps>(
    null,
    mapDispatchToProps
  )(withNamespaces(Namespaces.nuxNamePin1)(PincodeSet))
)
