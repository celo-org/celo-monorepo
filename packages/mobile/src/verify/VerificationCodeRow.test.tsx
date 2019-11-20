import * as React from 'react'
import 'react-native'
import { render } from 'react-native-testing-library'
import VerificationCodeRow from 'src/verify/VerificationCodeRow'
import { mockAttestationMessage } from 'test/values'

describe('VerificationCodeRow', () => {
  it('renders correctly for input', () => {
    const { toJSON } = render(
      <VerificationCodeRow
        index={0}
        inputValue={mockAttestationMessage.code}
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
      <VerificationCodeRow
        index={0}
        inputValue={mockAttestationMessage.code}
        onInputChange={jest.fn()}
        isCodeSubmitting={true}
        attestationCodes={[mockAttestationMessage]}
        numCompleteAttestations={1}
      />
    )
    expect(toJSON()).toMatchSnapshot()
  })
})
