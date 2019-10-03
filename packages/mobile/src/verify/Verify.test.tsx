import * as React from 'react'
import 'react-native'
import { Provider } from 'react-redux'
import * as renderer from 'react-test-renderer'
import { Input } from 'src/verify/Input'
import { Verified } from 'src/verify/Verified'
import Verifying from 'src/verify/Verifying'
import { VerifyPhoneEducation } from 'src/verify/VerifyPhoneEducation'
import { createMockStore, getMockI18nProps } from 'test/utils'
import { mockAttestationMessage } from 'test/values'

const store = createMockStore({})

jest.mock('src/web3/contracts', () => ({
  isZeroSyncMode: jest.fn().mockReturnValueOnce(false),
}))

it('renders the Education step correctly', () => {
  const tree = renderer.create(
    <Provider store={store}>
      <VerifyPhoneEducation {...getMockI18nProps()} />
    </Provider>
  )
  expect(tree).toMatchSnapshot()
})

it('renders the Input step correctly', () => {
  const tree = renderer.create(
    <Provider store={store}>
      <Input
        devModeActive={false}
        showError={jest.fn()}
        hideAlert={jest.fn()}
        setPhoneNumber={jest.fn()}
        startVerification={jest.fn()}
        {...getMockI18nProps()}
      />
    </Provider>
  )
  expect(tree).toMatchSnapshot()
})

describe('Verifying process', () => {
  it('renders the initial verifying state correctly', () => {
    const tree = renderer.create(
      <Provider store={store}>
        <Verifying />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })

  it('renders the partially verified state correctly', () => {
    const mockStore = createMockStore({
      identity: {
        attestationCodes: [mockAttestationMessage],
        numCompleteAttestations: 1,
      },
    })
    const tree = renderer.create(
      <Provider store={mockStore}>
        <Verifying />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })

  it('renders the fully verified state correctly', () => {
    const mockStore = createMockStore({
      identity: {
        attestationCodes: [mockAttestationMessage, mockAttestationMessage, mockAttestationMessage],
        numCompleteAttestations: 3,
      },
    })
    const tree = renderer.create(
      <Provider store={mockStore}>
        <Verifying />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })

  it('renders the verification error state correctly', () => {
    const mockStore = createMockStore({
      identity: {
        attestationCodes: [mockAttestationMessage, mockAttestationMessage],
        numCompleteAttestations: 1,
        verificationFailed: true,
      },
    })
    const tree = renderer.create(
      <Provider store={mockStore}>
        <Verifying />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })
})

it('renders the Verified step correctly', () => {
  const tree = renderer.create(
    <Provider store={store}>
      <Verified {...getMockI18nProps()} />
    </Provider>
  )
  expect(tree).toMatchSnapshot()
})
