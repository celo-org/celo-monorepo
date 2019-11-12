import * as React from 'react'
import 'react-native'
import { render } from 'react-native-testing-library'
import VerificationCodeRow from 'src/verify/VerificationCodeRow'
import { mockAttestationMessage } from 'test/values'

describe('VerificationCodeRow', () => {
  it('renders correctly when input enabled', () => {
    const { toJSON } = render(
      <VerificationCodeRow
        index={0}
        attestationCodes={[]}
        isInputEnabled={true}
        inputValue={'test'}
        onInputChange={jest.fn()}
        isCodeSubmitting={false}
        isCodeAccepted={false}
      />
    )
    expect(toJSON()).toMatchSnapshot()
  })
  it('renders correctly when input disabled', () => {
    const { toJSON } = render(
      <VerificationCodeRow
        index={0}
        attestationCodes={[]}
        isInputEnabled={false}
        inputValue={'test'}
        onInputChange={jest.fn()}
        isCodeSubmitting={false}
        isCodeAccepted={false}
      />
    )
    expect(toJSON()).toMatchSnapshot()
  })
  it('renders correctly when submitting', () => {
    const { toJSON } = render(
      <VerificationCodeRow
        index={0}
        attestationCodes={[]}
        isInputEnabled={true}
        inputValue={'test'}
        onInputChange={jest.fn()}
        isCodeSubmitting={true}
        isCodeAccepted={false}
      />
    )
    expect(toJSON()).toMatchSnapshot()
  })
  it('renders correctly when code received', () => {
    const { toJSON } = render(
      <VerificationCodeRow
        index={0}
        attestationCodes={[mockAttestationMessage]}
        isInputEnabled={true}
        inputValue={'test'}
        onInputChange={jest.fn()}
        isCodeSubmitting={false}
        isCodeAccepted={false}
      />
    )
    expect(toJSON()).toMatchSnapshot()
  })
  it('renders correctly when code accepted', () => {
    const { toJSON } = render(
      <VerificationCodeRow
        index={0}
        attestationCodes={[mockAttestationMessage]}
        isInputEnabled={true}
        inputValue={'test'}
        onInputChange={jest.fn()}
        isCodeSubmitting={false}
        isCodeAccepted={true}
      />
    )
    expect(toJSON()).toMatchSnapshot()
  })
})
