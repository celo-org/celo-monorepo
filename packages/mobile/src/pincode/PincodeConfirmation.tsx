import Button, { BtnTypes } from '@celo/react-components/components/Button'
import HorizontalLine from '@celo/react-components/components/HorizontalLine'
import NumberKeypad from '@celo/react-components/components/NumberKeypad'
import colors from '@celo/react-components/styles/colors'
import { fontStyles } from '@celo/react-components/styles/fonts'
import { componentStyles } from '@celo/react-components/styles/styles'
import * as React from 'react'
import { WithNamespaces, withNamespaces } from 'react-i18next'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { NavigationInjectedProps } from 'react-navigation'
import { Namespaces } from 'src/i18n'
import { nuxNavigationOptions } from 'src/navigator/Headers'
import { navigateBack } from 'src/navigator/NavigationService'
import PincodeTextbox from 'src/pincode/PincodeTextbox'

interface State {
  pin: string
}

type Props = WithNamespaces & NavigationInjectedProps

class PincodeConfirmation extends React.Component<Props, State> {
  static navigationOptions = nuxNavigationOptions

  state = {
    pin: '',
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

  onPressCancel = () => {
    const reject = this.props.navigation.getParam('reject')
    reject()
    navigateBack()
  }

  onPressConfirm = () => {
    const { pin } = this.state
    const resolver = this.props.navigation.getParam('resolve')
    resolver(pin)
    navigateBack()
  }

  render() {
    const { t } = this.props
    const { pin } = this.state
    return (
      <View style={style.container}>
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
          standard={true}
          type={BtnTypes.PRIMARY}
          onPress={this.onPressConfirm}
          disabled={!this.isPinValid()}
        />
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

export default withNamespaces(Namespaces.nuxNamePin1)(PincodeConfirmation)
