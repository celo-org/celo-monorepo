import * as React from 'react'
import ReCAPTCHA from 'react-google-recaptcha'
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native'
import {
  getCaptchaKey,
  RequestState,
  requestStatusToState,
  validateBeneficary,
} from 'src/fauceting/utils'
import { TextInput } from 'src/forms/FormComponents'
import { I18nProps, NameSpaces, withNamespaces } from 'src/i18n'
import Button, { BTN, SIZE } from 'src/shared/Button.3'
import { postForm } from 'src/shared/Form'
import { colors, fonts, standardStyles, textStyles } from 'src/styles'
import {
  RequestRecord,
  RequestStatus,
  RequestType,
  subscribeRequest,
} from '../../server/FirebaseClient'

function send(beneficiary: string, kind: RequestType, captchaToken: string) {
  const route = kind === RequestType.Invite ? '/invite' : '/faucet'
  return postForm(route, { captchaToken, beneficiary })
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

interface State {
  beneficiary: string
  country: string
  captchaOK: boolean
  requestState: RequestState
  dollarTxHash?: string
  goldTxHash?: string
}

interface Props {
  kind: RequestType
}

class RequestFunds extends React.PureComponent<Props & I18nProps, State> {
  state: State = {
    beneficiary: '',
    country: '',
    requestState: RequestState.Initial,
    captchaOK: false,
  }
  recaptchaRef = React.createRef<ReCAPTCHA>()

  setBeneficiary = ({ nativeEvent }) => {
    const { value } = nativeEvent.target
    const beneficiary = this.props.kind === RequestType.Invite ? formatNumber(value) : value
    this.setState({
      beneficiary,
      requestState:
        this.state.requestState !== RequestState.Working
          ? RequestState.Initial
          : this.state.requestState,
    })
  }

  onCaptcha = (value: string | null) => {
    this.setState({ captchaOK: !!value })
  }
  resetCaptcha = () => {
    this.recaptchaRef.current.reset()
  }
  getCaptchaToken = () => {
    return this.recaptchaRef.current.getValue()
  }

  onSubmit = async () => {
    if (!validateBeneficary(this.state.beneficiary, this.props.kind)) {
      this.setState({ requestState: RequestState.Invalid })
      return
    }
    const res = await this.startRequest()
    const { status, key } = await res.json()

    this.updateStatus(status)
    this.subscribe(key)
    this.resetCaptcha()
  }

  startRequest = () => {
    this.setState({ requestState: RequestState.Queued })
    return send(this.state.beneficiary, this.props.kind, this.getCaptchaToken())
  }

  updateStatus = (status: RequestStatus) => {
    this.setState({ requestState: requestStatusToState(status) })
  }

  subscribe = (key: string) => {
    subscribeRequest(key, this.onUpdates)
  }

  onUpdates = (record: RequestRecord) => {
    const { status, dollarTxHash, goldTxHash } = record
    this.setState({ requestState: requestStatusToState(status), dollarTxHash, goldTxHash })
  }

  isFaucet = () => {
    return this.props.kind === RequestType.Faucet
  }

  getPlaceholder = () => {
    return this.isFaucet() ? this.props.t('testnetAddress') : '+1 555 555 5555'
  }
  buttonText = () => {
    const { requestState } = this.state
    const { t } = this.props

    if (this.isFaucet()) {
      return faucetButtonText({ requestState, t })
    } else {
      return inviteButtonText({ requestState, t })
    }
  }

  render() {
    const { requestState } = this.state
    const isInvalid = requestState === RequestState.Invalid
    const isStarted = requestState === RequestState.Working
    return (
      <View style={standardStyles.elementalMargin}>
        <View style={standardStyles.elementalMarginBottom}>
          <ReCAPTCHA sitekey={getCaptchaKey()} onChange={this.onCaptcha} ref={this.recaptchaRef} />
        </View>
        <TextInput
          type={this.isFaucet() ? 'tel' : 'text'}
          focusStyle={
            this.isFaucet() ? standardStyles.inputFocused : standardStyles.inputDarkFocused
          }
          name="beneficiary"
          style={[
            standardStyles.input,
            !this.isFaucet() && standardStyles.inputDarkMode,
            isInvalid && styles.error,
          ]}
          placeholder={this.getPlaceholder()}
          onChange={this.setBeneficiary}
          value={this.state.beneficiary}
        />
        <ContextualInfo
          requestState={this.state.requestState}
          t={this.props.t}
          isFaucet={this.isFaucet()}
        />
        <View style={[standardStyles.row, standardStyles.elementalMarginTop]}>
          <Button
            disabled={isInvalid || !this.state.captchaOK || isStarted}
            kind={isStarted ? BTN.SECONDARY : BTN.PRIMARY}
            text={this.buttonText()}
            onPress={this.onSubmit}
            iconLeft={isStarted && <ActivityIndicator color={colors.primary} size={'large'} />}
            align="flex-start"
            size={this.isFaucet() ? SIZE.normal : SIZE.big}
          />
        </View>
      </View>
    )
  }
}

export default withNamespaces(NameSpaces.faucet)(RequestFunds)

interface InfoProps {
  requestState: RequestState
  t: I18nProps['t']
  isFaucet: boolean
}

const BAD_STATES = new Set([RequestState.Failed, RequestState.Invalid])

function ContextualInfo({ requestState, t, isFaucet }: InfoProps) {
  const contextStyle = [
    fonts.small,
    !isFaucet && textStyles.invert,
    BAD_STATES.has(requestState) && textStyles.error,
  ]

  const text = isFaucet ? faucetText({ requestState, t }) : inviteText({ requestState, t })

  return <Text style={contextStyle}>{text}</Text>
}

function faucetButtonText({ requestState, t }) {
  switch (requestState) {
    case RequestState.Queued:
    case RequestState.Working:
      return t('funding')
    case RequestState.Completed:
      return t('funded')
    default:
      return t('getDollars')
  }
}

function inviteButtonText({ requestState, t }) {
  switch (requestState) {
    case RequestState.Queued:
    case RequestState.Working:
      return ''
    case RequestState.Completed:
      return t('accountCreated')
    default:
      return t('requestInvite')
  }
}

function faucetText({ requestState, t }) {
  return (
    {
      [RequestState.Failed]: t('faucetError'),
      [RequestState.Invalid]: t('invalidAddress'),
      [RequestState.Completed]: t('faucetCompleted'),
    }[requestState] || 'eg. a0000aaa00a0000000000a00a0a0000a00a00aaa'
  )
}

function inviteText({ requestState, t }) {
  return (
    {
      [RequestState.Failed]: t('inviteError'),
      [RequestState.Invalid]: t('invalidNumber'),
      [RequestState.Completed]: t('accountCreated'),
    }[requestState] || ''
  )
}

const styles = StyleSheet.create({
  error: {
    borderColor: colors.error,
    borderWidth: 1,
  },
})
