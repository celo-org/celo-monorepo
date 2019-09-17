import Button, { BtnTypes } from '@celo/react-components/components/Button'
import Link from '@celo/react-components/components/Link'
import ValidatedTextInput from '@celo/react-components/components/ValidatedTextInput'
import colors from '@celo/react-components/styles/colors'
import { fontStyles } from '@celo/react-components/styles/fonts'
import { ValidatorKind } from '@celo/utils/src/inputValidation'
import * as React from 'react'
import { WithNamespaces, withNamespaces } from 'react-i18next'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { NavigationInjectedProps } from 'react-navigation'
import { componentWithAnalytics } from 'src/analytics/wrapper'
import DevSkipButton from 'src/components/DevSkipButton'
import { Namespaces } from 'src/i18n'
import Logo from 'src/icons/Logo'
import { navigateBack } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'

interface State {
  pin: string
}

type Props = WithNamespaces & NavigationInjectedProps

class PincodeConfirmation extends React.Component<Props, State> {
  state = {
    pin: '',
  }

  onChangePin = (pin: string) => {
    this.setState({ pin })
  }

  pinIsValid = () => {
    return this.state.pin.length === 6
  }

  cancel = () => {
    const reject = this.props.navigation.getParam('reject')
    reject()
    navigateBack()
  }
  confirmPin = () => {
    const { pin } = this.state
    const resolver = this.props.navigation.getParam('resolve')
    resolver(pin)
    navigateBack()
  }

  render() {
    const { t } = this.props
    return (
      <View style={style.pincodeContainer}>
        <DevSkipButton nextScreen={Screens.JoinCelo} />
        <ScrollView>
          <View style={style.header}>
            <View style={style.goBack}>
              <Link onPress={this.cancel}>{t('cancel')}</Link>
            </View>
          </View>
          <View style={style.pincodeLogo}>
            <Logo />
          </View>
          <View style={style.pincodeContent}>
            <Text style={[fontStyles.h1, style.h1]}>{t('confirmPin.title')}</Text>
            <ValidatedTextInput
              value={this.state.pin}
              validator={ValidatorKind.Integer}
              onChangeText={this.onChangePin}
              onSubmitEditing={this.confirmPin}
              autoFocus={true}
              keyboardType="numeric"
              placeholder={t('createPin.yourPin')}
              secureTextEntry={true}
              style={style.numberInput}
              textContentType="password"
              nativeInput={true}
            />
          </View>
        </ScrollView>
        <View style={style.pincodeFooter}>
          <Button
            text={t('confirmPin.submit')}
            style={style.button}
            onPress={this.confirmPin}
            disabled={!this.pinIsValid()}
            standard={false}
            type={BtnTypes.PRIMARY}
          />
        </View>
      </View>
    )
  }
}

const style = StyleSheet.create({
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
  pincodeContent: {
    paddingHorizontal: 25,
  },
  pincodeFooter: {
    alignItems: 'center',
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
    padding: 20,
    margin: 0,
    flexDirection: 'row',
  },
  goBack: {
    flex: 1,
  },
})

export default componentWithAnalytics(withNamespaces(Namespaces.nuxNamePin1)(PincodeConfirmation))
