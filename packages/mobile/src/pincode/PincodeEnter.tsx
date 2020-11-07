/**
 * This is a reactnavigation SCREEN to which we navigate,
 * when we need to fetch a PIN from a user.
 */
import { StackCardInterpolationProps, StackScreenProps } from '@react-navigation/stack'
import * as React from 'react'
import { WithTranslation } from 'react-i18next'
import { StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { connect } from 'react-redux'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { Namespaces, withTranslation } from 'src/i18n'
import { headerWithBackButton } from 'src/navigator/Headers'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import { checkPin } from 'src/pincode/authentication'
import Pincode from 'src/pincode/Pincode'
import { RootState } from 'src/redux/reducers'
import { currentAccountSelector } from 'src/web3/selectors'

interface State {
  pin: string
  errorText: string | undefined
  pinIsCorrect: boolean
}

interface StateProps {
  currentAccount: string | null
}

type Props = StateProps & WithTranslation & StackScreenProps<StackParamList, Screens.PincodeEnter>

class PincodeEnter extends React.Component<Props, State> {
  static navigationOptions = {
    ...headerWithBackButton,
    gestureEnabled: false,
    cardStyleInterpolator: ({ current }: StackCardInterpolationProps) => ({
      containerStyle: {
        opacity: current.progress,
      },
    }),
  }

  state = {
    pin: '',
    errorText: undefined,
    pinIsCorrect: false,
  }

  componentWillUnmount() {
    const onCancel = this.props.route.params.onCancel
    if (onCancel && !this.state.pinIsCorrect) {
      onCancel()
    }
  }

  onChangePin = (pin: string) => {
    this.setState({ pin, errorText: undefined })
  }

  onCorrectPin = (pin: string) => {
    this.setState({ pinIsCorrect: true })
    const onSuccess = this.props.route.params.onSuccess
    if (onSuccess) {
      onSuccess(pin)
    }
  }

  onWrongPin = () => {
    this.setState({
      pin: '',
      errorText: this.props.t(`${Namespaces.global}:${ErrorMessages.INCORRECT_PIN}`),
    })
  }

  onPressConfirm = async () => {
    const { route, currentAccount } = this.props
    const { pin } = this.state
    const withVerification = route.params.withVerification
    if (withVerification && currentAccount) {
      if (await checkPin(pin, currentAccount)) {
        this.onCorrectPin(pin)
      } else {
        this.onWrongPin()
      }
    } else {
      this.onCorrectPin(pin)
    }
  }

  render() {
    const { t } = this.props
    const { pin, errorText } = this.state
    return (
      <SafeAreaView style={styles.container}>
        <Pincode
          title={t('confirmPin.title')}
          errorText={errorText}
          pin={pin}
          onChangePin={this.onChangePin}
          onCompletePin={this.onPressConfirm}
        />
      </SafeAreaView>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },
})

const mapStateToProps = (state: RootState): StateProps => ({
  currentAccount: currentAccountSelector(state),
})

export default connect(mapStateToProps)(
  withTranslation<Props>(Namespaces.nuxNamePin1)(PincodeEnter)
)
