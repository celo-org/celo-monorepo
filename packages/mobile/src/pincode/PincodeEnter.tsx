import colors from '@celo/react-components/styles/colors'
import * as React from 'react'
import { WithTranslation } from 'react-i18next'
import { BackHandler, NativeEventSubscription, StyleSheet } from 'react-native'
import RNExitApp from 'react-native-exit-app'
import SafeAreaView from 'react-native-safe-area-view'
import { NavigationInjectedProps } from 'react-navigation'
import { connect } from 'react-redux'
import { showError } from 'src/alert/actions'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { Namespaces, withTranslation } from 'src/i18n'
import { nuxNavigationOptions } from 'src/navigator/Headers'
import Pincode from 'src/pincode/Pincode'
import { RootState } from 'src/redux/reducers'
import { web3 } from 'src/web3/contracts'
import { readPrivateKeyFromLocalDisk } from 'src/web3/privateKey'
import { currentAccountSelector, fornoSelector } from 'src/web3/selectors'

interface State {
  pin: string
}

interface StateProps {
  currentAccount: string | null
  fornoMode: boolean
}

interface DispatchProps {
  showError: typeof showError
}

interface NavProps {
  onSuccess: (pin: string) => void
  disableGoingBack: null | boolean
  withVerification: boolean
}

type Props = StateProps & DispatchProps & WithTranslation & NavigationInjectedProps

class PincodeEnter extends React.Component<Props, State> {
  static navigationOptions = ({ navigation }: NavigationInjectedProps<NavProps>) => {
    let options
    if (navigation.getParam('disableGoingBack')) {
      options = {
        headerLeft: null,
      }
    } else {
      options = nuxNavigationOptions
    }
    return { gesturesEnabled: false, ...options }
  }
  backHandler: null | NativeEventSubscription = null

  state = {
    pin: '',
  }

  componentDidMount() {
    if (this.props.navigation.getParam('disableGoingBack')) {
      this.backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
        RNExitApp.exitApp()
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

  onCorrectPin = (pin: string) => {
    const onSuccess = this.props.navigation.getParam('onSuccess')
    if (onSuccess) {
      onSuccess(pin)
    }
  }

  onWrongPin = () => {
    this.props.showError(ErrorMessages.INCORRECT_PIN)
    this.setState({ pin: '' })
  }

  onPressConfirm = () => {
    const { fornoMode, navigation, currentAccount } = this.props
    const { pin } = this.state
    const withVerification = navigation.getParam('withVerification')
    if (withVerification && currentAccount) {
      if (fornoMode) {
        readPrivateKeyFromLocalDisk(currentAccount, pin)
          .then(() => this.onCorrectPin(pin))
          .catch(this.onWrongPin)
      } else {
        web3.eth.personal
          .unlockAccount(currentAccount, pin, 1)
          .then((result: boolean) => (result ? this.onCorrectPin(pin) : this.onWrongPin()))
          .catch(this.onWrongPin)
      }
    } else {
      this.onCorrectPin(pin)
    }
  }

  render() {
    const { t } = this.props
    const { pin } = this.state
    return (
      <SafeAreaView style={style.container}>
        <Pincode
          title={t('confirmPin.title')}
          placeholder={t('createPin.yourPin')}
          buttonText={t('global:submit')}
          isPinValid={this.isPinValid}
          onPress={this.onPressConfirm}
          pin={pin}
          onChangePin={this.onChangePin}
          maxLength={6}
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
})

const mapStateToProps = (state: RootState): StateProps => ({
  currentAccount: currentAccountSelector(state),
  fornoMode: fornoSelector(state),
})

export default connect(mapStateToProps, { showError })(
  withTranslation(Namespaces.nuxNamePin1)(PincodeEnter)
)
