import getConfig from 'next/config'
import * as React from 'react'
import ReCAPTCHA from 'react-google-recaptcha'
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native'
import { TextInput } from 'src/forms/FormComponents'
import Button, { BTN, SIZE } from 'src/shared/Button.3'
import { postForm } from 'src/shared/Form'
import { colors, fonts, standardStyles, textStyles } from 'src/styles'
import { RequestRecord, RequestStatus } from '../../server/FirebaseClient'

function invite(number: string, captchaToken: string) {
  return postForm('/invite', { captchaToken, beneficiary: number })
}

function formatNumber(number: string) {
  if (number.length === 1 && number.startsWith('+')) {
    return ''
  }
  if (number.startsWith('+')) {
    return number
  } else {
    return `+${number}`
  }
}

function validateNumber(number: string) {
  //  TODO use our phone utils from @celo/utils
  const E164RegEx = /^\+[1-9][0-9]{1,14}$/
  return E164RegEx.test(number)
}

interface State {
  number: string
  error: boolean
  country: string
  captchaOK: boolean
  requestStatus: RequestStatus | null
}

export default class Invite extends React.PureComponent<{}, State> {
  state: State = {
    number: '',
    country: '',
    error: false,
    requestStatus: null,
    captchaOK: false,
  }
  recaptchaRef = React.createRef<ReCAPTCHA>()

  setNumber = ({ nativeEvent }) => {
    const { value } = nativeEvent.target
    const number = formatNumber(value)
    this.setState({ number, error: false })
  }

  e164Number = () => {
    return this.state.number
  }

  onCaptcha = (value: string | null) => {
    this.setState({ captchaOK: !!value })
  }
  resetCaptcha = () => {
    this.recaptchaRef.current.reset()
  }

  onSubmit = async () => {
    const captcha = this.recaptchaRef.current.getValue()

    if (validateNumber(this.state.number)) {
      this.setState({ requestStatus: RequestStatus.Working })
      try {
        const inviteResponse = await invite(this.e164Number(), captcha)
        const record = await inviteResponse.json()
        const status = (record as RequestRecord).status

        this.setState({ requestStatus: status })
      } catch {
        this.setState({ requestStatus: RequestStatus.Failed })
      }
      this.resetCaptcha()
    } else {
      this.setState({ error: true })
    }
  }

  getCaptchaKey = () => {
    return getConfig().publicRuntimeConfig.RECAPTCHA
  }

  render() {
    const isWorking = this.state.requestStatus === RequestStatus.Working
    return (
      <View style={standardStyles.elementalMargin}>
        <TextInput
          type="tel"
          focusStyle={standardStyles.inputDarkFocused}
          style={[
            standardStyles.input,
            standardStyles.inputDarkMode,
            this.state.error && styles.error,
          ]}
          placeholder={'+1 555 555 5555'}
          onChange={this.setNumber}
          value={this.state.number}
        />
        {this.state.error && (
          <Text style={[fonts.small, textStyles.error]}>Must be an e164Number</Text>
        )}
        {this.state.requestStatus === RequestStatus.Done && (
          <Text style={[fonts.small]}>Complete: Check your texts</Text>
        )}
        <View style={standardStyles.elementalMargin}>
          <ReCAPTCHA
            sitekey={this.getCaptchaKey()}
            onChange={this.onCaptcha}
            ref={this.recaptchaRef}
          />
        </View>
        <Button
          disabled={this.state.error || !this.state.captchaOK || isWorking}
          kind={BTN.SECONDARY}
          text="Request Invite"
          onPress={this.onSubmit}
          iconLeft={isWorking && <ActivityIndicator color={colors.primary} size={'large'} />}
          align="flex-start"
          size={SIZE.big}
        />
      </View>
    )
  }
}

const styles = StyleSheet.create({
  error: {
    borderColor: colors.error,
    borderWidth: 1,
  },
})
