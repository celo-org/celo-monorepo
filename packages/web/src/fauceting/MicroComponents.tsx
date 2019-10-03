import * as React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import Fade from 'react-reveal/Fade'
import { EXAMPLE_ADDRESS, RequestState } from 'src/fauceting/utils'
import { I18nProps } from 'src/i18n'
import Checkmark from 'src/icons/Checkmark'
import Button, { BTN, SIZE } from 'src/shared/Button.3'
import Spinner from 'src/shared/Spinner'
import { colors, fonts, standardStyles as std, textStyles } from 'src/styles'
interface InfoProps {
  requestState: RequestState
  t: I18nProps['t']
  isFaucet: boolean
}

const BAD_STATES = new Set([RequestState.Failed, RequestState.Invalid])

export function ContextualInfo({ requestState, t, isFaucet }: InfoProps) {
  const contextStyle = [
    fonts.small,
    !isFaucet && textStyles.invert,
    BAD_STATES.has(requestState) && textStyles.error,
  ]

  const text = isFaucet ? faucetText({ requestState, t }) : inviteText({ requestState, t })

  return <Text style={contextStyle}>{text}</Text>
}

interface HashProps {
  isFaucet: boolean
  dollarTxHash: string | null
  goldTxHash: string | null
  escrowTxHash: string | null
  done: boolean
  t: I18nProps['t']
}

export function HashingStatus({
  isFaucet,
  dollarTxHash,
  goldTxHash,
  escrowTxHash,
  t,
  done,
}: HashProps) {
  return (
    <View
      style={isFaucet ? [std.row, styles.statusesContainerTicker] : styles.statusesContainerLog}
    >
      {[
        goldTxHash && t('cGLDsent'),
        dollarTxHash && t('cUSDsent'),
        escrowTxHash && t('walletBuilt'),
      ]
        .filter((x) => !!x)
        .map((message) => (
          <Fade key={message} when={!done} appear={true}>
            <View style={isFaucet ? styles.ticker : styles.log}>
              <Text style={[fonts.h5, !isFaucet && textStyles.invert]}>
                <Checkmark size={12} color={colors.primary} /> {message}
              </Text>
            </View>
          </Fade>
        ))}
    </View>
  )
}

interface ButtonProps {
  requestState: RequestState
  isFaucet: boolean
  t: I18nProps['t']
  onSubmit: () => void
  captchaOK: boolean
  disabled?: boolean
}

export function ButtonWithFeedback({
  requestState,
  isFaucet,
  t,
  onSubmit,
  captchaOK,
  disabled,
}: ButtonProps) {
  const isNotStarted =
    requestState === RequestState.Initial || requestState === RequestState.Invalid
  const isInvalid = requestState === RequestState.Invalid
  const isStarted = requestState === RequestState.Working
  const isEnded = requestState === RequestState.Completed || requestState === RequestState.Failed
  const icon = isStarted && <Spinner color={colors.primary} size="small" />

  return (
    <Button
      disabled={isInvalid || !captchaOK || isStarted || isEnded || disabled}
      kind={isNotStarted ? BTN.PRIMARY : BTN.SECONDARY}
      text={buttonText({ requestState, t })}
      onPress={onSubmit}
      iconLeft={icon}
      align={'flex-start'}
      style={!isFaucet && isEnded && [textStyles.invert, styles.message]}
      size={isFaucet ? SIZE.normal : SIZE.big}
    />
  )
}

interface TextFuncArgs {
  t: I18nProps['t']
  requestState: RequestState
}

function buttonText({ requestState, t }: TextFuncArgs) {
  switch (requestState) {
    case RequestState.Working:
      return ''
    case RequestState.Completed:
      return t('done')
    default:
      return t('getStarted')
  }
}
function faucetText({ requestState, t }: TextFuncArgs) {
  return (
    {
      [RequestState.Failed]: t('faucetError'),
      [RequestState.Invalid]: t('invalidAddress'),
    }[requestState] || `eg. ${EXAMPLE_ADDRESS}`
  )
}

function inviteText({ requestState, t }: TextFuncArgs) {
  return RequestState.Failed === requestState ? t('inviteError') : ''
}

const styles = StyleSheet.create({
  log: {
    marginLeft: 10,
    marginTop: 20,
  },
  ticker: {
    marginLeft: 20,
    justifyContent: 'center',
    height: '100%',
  },
  statusesContainerLog: {
    position: 'absolute',
    width: '100%',
    marginTop: 10,
  },
  statusesContainerTicker: {
    alignContent: 'center',
    height: '100%',
  },
  message: {
    lineHeight: 20,
  },
})
