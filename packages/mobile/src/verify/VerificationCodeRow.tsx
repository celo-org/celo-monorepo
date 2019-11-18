import { extractAttestationCodeFromMessage } from '@celo/walletkit'
import * as React from 'react'
import CodeRow, { CodeRowStatus } from 'src/components/CodeRow'
import { AttestationCode } from 'src/identity/verification'

export const CODE_INPUT_PLACEHOLDER = '<#> m9oASm/3g7aZ...'

interface OwnProps {
  index: number // index of code in attestationCodes array
  inputValue: string // the raw code inputed by the user
  isCodeSubmitting: boolean // is the inputted code being processed
  onInputChange: (value: string) => void
  attestationCodes: AttestationCode[] // The codes in the redux store
  numCompleteAttestations: number // has the code been accepted and completed
}

function VerificationCodeRow({
  index,
  inputValue,
  onInputChange,
  isCodeSubmitting,
  attestationCodes,
  numCompleteAttestations,
}: OwnProps) {
  let codeStatus: CodeRowStatus = CodeRowStatus.DISABLED
  if (numCompleteAttestations > index) {
    codeStatus = CodeRowStatus.ACCEPTED
  } else if (attestationCodes.length > index) {
    codeStatus = CodeRowStatus.RECEIVED
  } else if (isCodeSubmitting) {
    codeStatus = CodeRowStatus.PROCESSING
  } else if (attestationCodes.length === index) {
    codeStatus = CodeRowStatus.INPUTTING
  }

  return (
    <CodeRow
      status={codeStatus}
      inputValue={inputValue}
      inputPlaceholder={CODE_INPUT_PLACEHOLDER}
      onInputChange={onInputChange}
      shouldShowClipboard={shouldShowClipboard(attestationCodes)}
    />
  )
}

function shouldShowClipboard(attestationCodes: AttestationCode[]) {
  return (value: string) => {
    const extractedCode = extractAttestationCodeFromMessage(value)
    return !!extractedCode && !attestationCodes.find((c) => c.code === extractedCode)
  }
}

export default VerificationCodeRow
