import * as React from 'react'
import ReCAPTCHA from 'react-google-recaptcha'
import { StyleSheet, View } from 'react-native'
import { ButtonWithFeedback, ContextualInfo, HashingStatus } from 'src/fauceting/MicroComponents'
import {
  formatNumber,
  getCaptchaKey,
  RequestState,
  requestStatusToState,
  validateBeneficary,
} from 'src/fauceting/utils'
import { postForm } from 'src/forms/Form'
import { TextInput } from 'src/forms/FormComponents'
import { I18nProps, NameSpaces, withNamespaces } from 'src/i18n'
import { colors, standardStyles } from 'src/styles'
import { RequestRecord, RequestType, subscribeRequest } from '../../server/FirebaseClient'

function send(beneficiary: string, kind: RequestType, captchaToken: string) {
  const route = kind === RequestType.Invite ? '/invite' : '/faucet'
  return postForm(route, { captchaToken, beneficiary })
}

interface State {
  beneficiary: string
  captchaOK: boolean
  requestState: RequestState
  dollarTxHash?: string | null
  goldTxHash?: string | null
  escrowTxHash?: string | null
}

interface Props {
  kind: RequestType
}

class RequestFunds extends React.PureComponent<Props & I18nProps, State> {
  state: State = {
    beneficiary: '',
    requestState: RequestState.Initial,
    captchaOK: false,
  }

  recaptchaRef = React.createRef<ReCAPTCHA>()

  setBeneficiary = ({ currentTarget }: React.SyntheticEvent<HTMLInputElement>) => {
    const { value } = currentTarget
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

    this.setState({ requestState: requestStatusToState(status) })
    if (key) {
      await this.subscribe(key)
    }
    this.resetCaptcha()
  }

  startRequest = () => {
    this.setState({ requestState: RequestState.Working })
    return send(this.state.beneficiary, this.props.kind, this.getCaptchaToken())
  }

  subscribe = async (key: string) => {
    await subscribeRequest(key, this.onUpdates)
  }

  onUpdates = (record: RequestRecord) => {
    const { status, dollarTxHash, goldTxHash, escrowTxHash } = record
    const requestState = requestStatusToState(status)

    if (requestState === RequestState.Completed || requestState === RequestState.Failed) {
      this.setState({
        requestState,
        dollarTxHash: null,
        goldTxHash: null,
        escrowTxHash: null,
      })
    } else {
      this.setState({
        requestState,
        dollarTxHash,
        goldTxHash,
        escrowTxHash,
      })
    }
  }

  isFaucet = () => {
    return this.props.kind === RequestType.Faucet
  }

  getPlaceholder = () => {
    return this.isFaucet() ? this.props.t('testnetAddress') : '+1 555 555 5555'
  }

  render() {
    const { requestState, dollarTxHash, goldTxHash, escrowTxHash } = this.state
    const isInvalid = requestState === RequestState.Invalid
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
          // TODO: is it normal that setBeneficiary is using React.SyntheticEvent<HTMLInputElement>
          // and not NativeSyntheticEvent<TextInputChangeEventData> ?
          // @ts-ignore
          onChange={this.setBeneficiary}
          value={this.state.beneficiary}
        />
        <ContextualInfo
          requestState={this.state.requestState}
          t={this.props.t}
          isFaucet={this.isFaucet()}
        />
        <View style={[this.isFaucet() && standardStyles.row, standardStyles.elementalMarginTop]}>
          <ButtonWithFeedback
            requestState={requestState}
            isFaucet={this.isFaucet()}
            captchaOK={this.state.captchaOK}
            onSubmit={this.onSubmit}
            t={this.props.t}
          />
          <View>
            <HashingStatus
              done={requestState === RequestState.Completed}
              isFaucet={this.isFaucet()}
              dollarTxHash={dollarTxHash}
              goldTxHash={goldTxHash}
              escrowTxHash={escrowTxHash}
              t={this.props.t}
            />
          </View>
        </View>
      </View>
    )
  }
}

export default withNamespaces(NameSpaces.faucet)(RequestFunds)

const styles = StyleSheet.create({
  error: {
    borderColor: colors.error,
    borderWidth: 1,
  },
})
