import * as React from 'react'
import 'react-native'
import { render } from 'react-native-testing-library'
import { Provider } from 'react-redux'
import { Screens } from 'src/navigator/Screens'
import VerificationEducationScreen from 'src/verify/VerificationEducationScreen'
import { createMockStore, getMockStackScreenProps } from 'test/utils'

describe('VerificationEducationScreen', () => {
  it('shows the `skip` button when already verified', () => {
    const store = createMockStore({
      app: { numberVerified: true },
    })
    const { toJSON, queryByTestId, queryByText } = render(
      <Provider store={store}>
        <VerificationEducationScreen
          {...getMockStackScreenProps(Screens.VerificationEducationScreen)}
        />
      </Provider>
    )
    expect(toJSON()).toMatchSnapshot()
    expect(queryByText('verificationEducation.bodyInsufficientBalance')).toBeFalsy()
    expect(queryByTestId('VerificationEducationSkip')).toBeTruthy()
    expect(queryByTestId('VerificationEducationContinue')).toBeFalsy()
    expect(queryByTestId('VerificationEducationAlready')).toBeFalsy()
  })

  it('shows the `continue` button when the user is not already verified and has enough balance', () => {
    const store = createMockStore({
      stableToken: {
        balance: '50',
      },
    })
    const { toJSON, queryByTestId, queryByText } = render(
      <Provider store={store}>
        <VerificationEducationScreen
          {...getMockStackScreenProps(Screens.VerificationEducationScreen)}
        />
      </Provider>
    )
    expect(toJSON()).toMatchSnapshot()
    expect(queryByText('verificationEducation.bodyInsufficientBalance')).toBeFalsy()
    expect(queryByTestId('VerificationEducationSkip')).toBeFalsy()
    expect(queryByTestId('VerificationEducationContinue')).toBeTruthy()
    expect(queryByTestId('VerificationEducationAlready')).toBeFalsy()
  })

  it('shows the `continue` and `already received` buttons when there are actionable attestations', () => {
    const store = createMockStore({
      stableToken: {
        balance: '50',
      },
      identity: {
        verificationState: {
          phoneHashDetails: {
            e164Number: '',
            phoneHash: '',
            pepper: '',
          },
          status: {
            numAttestationsRemaining: 2,
          },
          actionableAttestations: [{}, {}],
        },
      },
    })
    const { toJSON, queryByTestId, queryByText } = render(
      <Provider store={store}>
        <VerificationEducationScreen
          {...getMockStackScreenProps(Screens.VerificationEducationScreen)}
        />
      </Provider>
    )
    expect(toJSON()).toMatchSnapshot()
    expect(queryByText('verificationEducation.bodyInsufficientBalance')).toBeFalsy()
    expect(queryByTestId('VerificationEducationSkip')).toBeFalsy()
    expect(queryByTestId('VerificationEducationContinue')).toBeTruthy()
    expect(queryByTestId('VerificationEducationAlready')).toBeTruthy()
  })

  it('shows the `skip` button when user is not already verified and has NOT enough balance', () => {
    const store = createMockStore({
      stableToken: {
        balance: '0',
      },
    })
    const { toJSON, queryByTestId, queryByText } = render(
      <Provider store={store}>
        <VerificationEducationScreen
          {...getMockStackScreenProps(Screens.VerificationEducationScreen)}
        />
      </Provider>
    )
    expect(toJSON()).toMatchSnapshot()
    expect(queryByText('verificationEducation.bodyInsufficientBalance')).toBeTruthy()
    expect(queryByTestId('VerificationEducationSkip')).toBeTruthy()
    expect(queryByTestId('VerificationEducationContinue')).toBeFalsy()
    expect(queryByTestId('VerificationEducationAlready')).toBeFalsy()
  })
})
