import * as React from 'react'
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native'
import Fade from 'react-reveal/Fade'
import { EXAMPLE_ADDRESS, RequestState } from 'src/fauceting/utils'
import { I18nProps } from 'src/i18n'
import Checkmark from 'src/icons/Checkmark'
import Button, { BTN, SIZE } from 'src/shared/Button.3'
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

export function HashingStatus({ isFaucet, dollarTxHash, goldTxHash, escrowTxHash, t, done }) {
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

export function ButtonWithFeedback({ requestState, isFaucet, t, onSubmit, captchaOK }) {
  const isNotStarted =
    requestState === RequestState.Initial || requestState === RequestState.Invalid
  const isInvalid = requestState === RequestState.Invalid
  const isStarted = requestState === RequestState.Working

  const icon = isStarted && <ActivityIndicator color={colors.primary} size={'small'} />

  return (
    <Button
      disabled={isInvalid || !captchaOK || isStarted}
      kind={isNotStarted ? BTN.PRIMARY : BTN.SECONDARY}
      text={buttonText({ requestState, t })}
      onPress={onSubmit}
      iconLeft={icon}
      align={'flex-start'}
      size={isFaucet ? SIZE.normal : SIZE.big}
    />
  )
}

function buttonText({ requestState, t }) {
  switch (requestState) {
    case RequestState.Working:
      return ''
    case RequestState.Completed:
      return t('done')
    default:
      return t('getStarted')
  }
}

function faucetText({ requestState, t }) {
  return (
    {
      [RequestState.Failed]: t('faucetError'),
      [RequestState.Invalid]: t('invalidAddress'),
      [RequestState.BadChecksum]: t('badChecksum'),
    }[requestState] || `eg. ${EXAMPLE_ADDRESS}`
  )
}

function inviteText({ requestState, t }) {
  return (
    {
      [RequestState.Failed]: t('inviteError'),
      [RequestState.Invalid]: t('invalidNumber'),
    }[requestState] || ''
  )
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
    marignTop: 10,
  },
  statusesContainerTicker: {
    alignContent: 'center',
    height: '100%',
  },
})
