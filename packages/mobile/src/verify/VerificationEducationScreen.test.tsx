import * as React from 'react'
import 'react-native'
import { render } from 'react-native-testing-library'
import { Provider } from 'react-redux'
import { Screens } from 'src/navigator/Screens'
import VerificationEducationScreen from 'src/verify/VerificationEducationScreen'
import { createMockStore, getMockStackScreenProps } from 'test/utils'

describe('VerificationEducationScreen', () => {
  it('renders correctly', () => {
    const store = createMockStore({
      identity: {
        verificationState: {
          status: {
            numAttestationsRemaining: 2,
          },
          isBalanceSufficient: true,
          actionableAttestations: [{}, {}],
        },
      },
    })
    const { toJSON } = render(
      <Provider store={store}>
        <VerificationEducationScreen
          {...getMockStackScreenProps(Screens.VerificationEducationScreen)}
        />
      </Provider>
    )
    expect(toJSON()).toMatchSnapshot()
  })

  it('renders correctly without already received button', () => {
    const store = createMockStore({})
    const { toJSON } = render(
      <Provider store={store}>
        <VerificationEducationScreen
          {...getMockStackScreenProps(Screens.VerificationEducationScreen)}
        />
      </Provider>
    )
    expect(toJSON()).toMatchSnapshot()
  })
})
