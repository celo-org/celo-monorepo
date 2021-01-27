import * as React from 'react'
import 'react-native'
import { render } from 'react-native-testing-library'
import VerificationCodeInput from 'src/verify/VerificationCodeInput'
import { mockAttestationMessage } from 'test/values'

describe('VerificationCodeRow', () => {
  it('renders correctly for input', () => {
    const { toJSON } = render(
      <VerificationCodeInput
        label="Test label"
        index={0}
        inputValue={mockAttestationMessage.code}
        inputPlaceholder="Test placeholder"
        inputPlaceholderWithClipboardContent="Test clipboard"
        onInputChange={jest.fn()}
        isCodeSubmitting={true}
        attestationCodes={[]}
        numCompleteAttestations={0}
      />
    )
    expect(toJSON()).toMatchSnapshot()
  })
  it('renders correctly for accepted code', () => {
    const { toJSON } = render(
      <VerificationCodeInput
        label="Test label"
        index={0}
        inputValue={mockAttestationMessage.code}
        inputPlaceholder="Test placeholder"
        inputPlaceholderWithClipboardContent="Test clipboard"
        onInputChange={jest.fn()}
        isCodeSubmitting={true}
        attestationCodes={[mockAttestationMessage]}
        numCompleteAttestations={1}
      />
    )
    expect(toJSON()).toMatchSnapshot()
  })
})
