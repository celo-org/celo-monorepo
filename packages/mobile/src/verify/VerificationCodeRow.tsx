import TextInput from '@celo/react-components/components/TextInput'
import withTextInputPasteAware from '@celo/react-components/components/WithTextInputPasteAware'
import Checkmark from '@celo/react-components/icons/Checkmark'
import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import { stripHexLeader } from '@celo/utils/src/address'
import { extractAttestationCodeFromMessage } from '@celo/walletkit'
import * as React from 'react'
import { withNamespaces, WithNamespaces } from 'react-i18next'
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native'
import i18n, { Namespaces } from 'src/i18n'
import { ATTESTATION_CODE_PLACEHOLDER } from 'src/identity/reducer'
import { AttestationCode } from 'src/identity/verification'
import Logger from 'src/utils/Logger'

const TAG = 'VerificationCodeRow'

export const CODE_INPUT_PLACEHOLDER = '<#> m9oASm/3g7aZ...'

const CodeInput = withTextInputPasteAware(TextInput)

interface OwnProps {
  index: number // index of code in attestationCodes array
  attestationCodes: AttestationCode[] // The codes in the redux store
  isInputEnabled: boolean // input disabled until previous code is in
  inputValue: string // the raw code inputed by the user
  isCodeSubmitting: boolean // is the inputted code being processed
  isCodeAccepted: boolean // has the code been accepted and completed
  onInputChange: (value: string) => void
}

type Props = OwnProps & WithNamespaces

function VerificationCodeRow({
  index,
  attestationCodes,
  isInputEnabled,
  inputValue,
  onInputChange,
  isCodeSubmitting,
  isCodeAccepted,
  t,
}: Props) {
  if (attestationCodes[index]) {
    return (
      <View style={styles.codeContainer}>
        <Text style={styles.codeValue} numberOfLines={1} ellipsizeMode={'tail'}>
          {getRecodedAttestationValue(attestationCodes[index], t)}
        </Text>
        {isCodeAccepted && (
          <View style={styles.checkmarkContainer}>
            <Checkmark height={20} width={20} />
          </View>
        )}
      </View>
    )
  }

  if (!isInputEnabled) {
    return (
      <View style={styles.codeInputDisabledContainer}>
        <Text style={styles.codeValue}>{CODE_INPUT_PLACEHOLDER}</Text>
      </View>
    )
  }

  return (
    <View style={styles.codeInputContainer}>
      <CodeInput
        value={inputValue}
        placeholder={CODE_INPUT_PLACEHOLDER}
        shouldShowClipboard={shouldShowClipboard(attestationCodes)}
        onChangeText={onInputChange}
        style={styles.codeInput}
      />
      {isCodeSubmitting && (
        <ActivityIndicator size="small" color={colors.celoGreen} style={styles.codeInputSpinner} />
      )}
    </View>
  )
}

function shouldShowClipboard(attestationCodes: AttestationCode[]) {
  return (value: string) => {
    const extractedCode = extractAttestationCodeFromMessage(value)
    return !!extractedCode && !attestationCodes.find((c) => c.code === extractedCode)
  }
}

function getRecodedAttestationValue(attestationCode: AttestationCode, t: i18n.TranslationFunction) {
  try {
    if (!attestationCode.code || attestationCode.code === ATTESTATION_CODE_PLACEHOLDER) {
      return t('input.codeAccepted')
    }
    return Buffer.from(stripHexLeader(attestationCode.code), 'hex').toString('base64')
  } catch (error) {
    Logger.warn(TAG, 'Could not recode verification code to base64')
    return t('input.codeAccepted')
  }
}

const styles = StyleSheet.create({
  codeContainer: {
    justifyContent: 'center',
    marginVertical: 5,
    paddingHorizontal: 10,
    backgroundColor: colors.darkLightest,
    borderRadius: 3,
    height: 50,
  },
  checkmarkContainer: {
    backgroundColor: colors.darkLightest,
    position: 'absolute',
    top: 3,
    right: 3,
    padding: 10,
  },
  codeInputContainer: {
    position: 'relative',
  },
  codeInput: {
    flex: 0,
    backgroundColor: '#FFF',
    borderColor: colors.inputBorder,
    borderRadius: 3,
    borderWidth: 1,
    height: 50,
    marginVertical: 5,
  },
  codeInputSpinner: {
    backgroundColor: '#FFF',
    position: 'absolute',
    top: 9,
    right: 3,
    padding: 10,
  },
  codeInputDisabledContainer: {
    justifyContent: 'center',
    paddingHorizontal: 10,
    marginVertical: 5,
    borderColor: colors.inputBorder,
    borderRadius: 3,
    borderWidth: 1,
    height: 50,
    backgroundColor: '#F0F0F0',
  },
  codeValue: {
    ...fontStyles.body,
    fontSize: 15,
    color: colors.darkSecondary,
  },
})

export default withNamespaces(Namespaces.nuxVerification2)(VerificationCodeRow)
