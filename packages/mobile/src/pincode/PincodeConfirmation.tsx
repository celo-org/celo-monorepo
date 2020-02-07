import Button, { BtnTypes } from '@celo/react-components/components/Button'
import HorizontalLine from '@celo/react-components/components/HorizontalLine'
import NumberKeypad from '@celo/react-components/components/NumberKeypad'
import colors from '@celo/react-components/styles/colors'
import { fontStyles } from '@celo/react-components/styles/fonts'
import { componentStyles } from '@celo/react-components/styles/styles'
import * as React from 'react'
import { WithTranslation } from 'react-i18next'
import {
  BackHandler,
  NativeEventSubscription,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import SafeAreaView from 'react-native-safe-area-view'
import { NavigationInjectedProps } from 'react-navigation'
import { connect } from 'react-redux'
import { showError } from 'src/alert/actions'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { Namespaces, withTranslation } from 'src/i18n'
import { nuxNavigationOptions } from 'src/navigator/Headers'
import { navigateBack } from 'src/navigator/NavigationService'
import PincodeTextbox from 'src/pincode/PincodeTextbox'

interface State {
  pin: string
}

interface DispatchProps {
  showError: typeof showError
}

interface NavProps {
  resolve: () => void
  reject: () => void
  pinVerifier: null | ((password: string) => Promise<boolean>)
  hideBackButton: null | boolean
  shouldNavigateBack: null | boolean
}

type Props = DispatchProps & WithTranslation & NavigationInjectedProps

class PincodeConfirmation extends React.Component<Props, State> {
  static navigationOptions = ({ navigation }: NavigationInjectedProps<NavProps>) => {
    if (navigation.getParam('hideBackButton')) {
      return {
        headerLeft: null,
      }
    } else {
      return nuxNavigationOptions
    }
  }
  backHandler: null | NativeEventSubscription = null

  state = {
    pin: '',
  }

  componentDidMount() {
    if (this.props.navigation.getParam('hideBackButton')) {
      this.backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
        BackHandler.exitApp()
        return true
      })
    }
  }

  componentWillUnmount() {
    if (this.backHandler) {
      this.backHandler.remove()
    }
  }

  onChangePin = (pin: string) => {
    this.setState({ pin })
  }

  isPinValid = () => {
    return this.state.pin.length === 6
  }

  onDigitPress = (digit: number) => {
    const { pin } = this.state
    this.setState({
      pin: (pin + digit).substr(0, 6),
    })
  }

  onBackspacePress = () => {
    const { pin } = this.state
    this.setState({
      pin: pin.substr(0, pin.length - 1),
    })
  }

  onCorrectPin = (pin: string) => {
    const resolve = this.props.navigation.getParam('resolve')
    const shouldNavigateBack = this.props.navigation.getParam('shouldNavigateBack')
    resolve(pin)
    if (shouldNavigateBack) {
      navigateBack()
    }
  }

  onWrongPin = () => {
    this.props.showError(ErrorMessages.INCORRECT_PIN)
    this.setState({ pin: '' })
  }

  onPressConfirm = () => {
    const { pin } = this.state
    const pinVerifier = this.props.navigation.getParam('pinVerifier')
    if (pinVerifier) {
      pinVerifier(pin)
        .then((result: boolean) => (result ? this.onCorrectPin(pin) : this.onWrongPin()))
        .catch(this.onWrongPin)
    } else {
      this.onCorrectPin(pin)
    }
  }

  render() {
    const { t } = this.props
    const { pin } = this.state
    return (
      <SafeAreaView style={style.container}>
        <ScrollView contentContainerStyle={style.scrollContainer}>
          <View>
            <Text style={[fontStyles.h1, componentStyles.marginTop15]}>
              {t('confirmPin.title')}
            </Text>
            <View style={style.pincodeContainer}>
              <PincodeTextbox pin={pin} placeholder={t('createPin.yourPin')} />
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
        <Button
          testID="Pincode-Enter"
          text={t('global:submit')}
          standard={false}
          type={BtnTypes.PRIMARY}
          onPress={this.onPressConfirm}
          disabled={!this.isPinValid()}
        />
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

export default connect(null, { showError })(
  withTranslation(Namespaces.nuxNamePin1)(PincodeConfirmation)
)
