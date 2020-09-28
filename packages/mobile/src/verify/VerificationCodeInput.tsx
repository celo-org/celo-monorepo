import { hexToBuffer } from '@celo/utils/src/address'
import { extractAttestationCodeFromMessage } from '@celo/utils/src/attestations'
import * as React from 'react'
import { StyleProp, ViewStyle } from 'react-native'
import CodeInput, { CodeInputStatus } from 'src/components/CodeInput'
import { ATTESTATION_CODE_PLACEHOLDER } from 'src/identity/reducer'
import { AttestationCode } from 'src/identity/verification'
import Logger from 'src/utils/Logger'

interface Props {
  label: string
  index: number // index of code in attestationCodes array
  inputValue: string // the raw code inputed by the user
  inputPlaceholder: string
  inputPlaceholderWithClipboardContent: string
  isCodeSubmitting: boolean // is the inputted code being processed
  onInputChange: (value: string) => void
  attestationCodes: AttestationCode[] // The codes in the redux store
  numCompleteAttestations: number // has the code been accepted and completed
  style?: StyleProp<ViewStyle>
  testID?: string
}

function VerificationCodeInput({
  label,
  index,
  inputValue,
  inputPlaceholder,
  inputPlaceholderWithClipboardContent,
  onInputChange,
  isCodeSubmitting,
  attestationCodes,
  numCompleteAttestations,
  style,
  testID,
}: Props) {
  let codeStatus: CodeInputStatus = CodeInputStatus.DISABLED
  if (numCompleteAttestations > index) {
    codeStatus = CodeInputStatus.ACCEPTED
    inputValue = getRecodedAttestationValue(attestationCodes[index])
  } else if (attestationCodes.length > index) {
    codeStatus = CodeInputStatus.RECEIVED
    inputValue = getRecodedAttestationValue(attestationCodes[index])
  } else if (isCodeSubmitting) {
    codeStatus = CodeInputStatus.PROCESSING
  } else if (attestationCodes.length === index) {
    codeStatus = CodeInputStatus.INPUTTING
  }

  return (
    <CodeInput
      label={label}
      status={codeStatus}
      inputValue={inputValue}
      inputPlaceholder={inputPlaceholder}
      inputPlaceholderWithClipboardContent={inputPlaceholderWithClipboardContent}
      onInputChange={onInputChange}
      shouldShowClipboard={shouldShowClipboard(attestationCodes)}
      style={style}
      testID={testID}
    />
  )
}

function getRecodedAttestationValue(attestationCode: AttestationCode) {
  try {
    if (!attestationCode.code || attestationCode.code === ATTESTATION_CODE_PLACEHOLDER) {
      return ''
    }
    return hexToBuffer(attestationCode.code).toString('base64')
  } catch (error) {
    Logger.warn('VerificationCodeRow', 'Could not recode verification code to base64')
    return ''
  }
}

function shouldShowClipboard(attestationCodes: AttestationCode[]) {
  return (value: string) => {
    const extractedCode = extractAttestationCodeFromMessage(value)
    return !!extractedCode && !attestationCodes.find((c) => c.code === extractedCode)
  }
}

export default VerificationCodeInput
