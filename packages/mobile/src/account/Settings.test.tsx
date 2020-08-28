import * as React from 'react'
import 'react-native'
import { Provider } from 'react-redux'
import * as renderer from 'react-test-renderer'
import Settings from 'src/account/Settings'
import { Screens } from 'src/navigator/Screens'
import { createMockStore, getMockStackScreenProps } from 'test/utils'
import { mockE164Number, mockE164NumberPepper } from 'test/values'

describe('Account', () => {
  beforeAll(() => {
    jest.useFakeTimers()
  })

  afterAll(() => {
    jest.useRealTimers()
  })

  it('renders correctly', () => {
    const tree = renderer.create(
      <Provider
        store={createMockStore({
          account: {
            e164PhoneNumber: mockE164Number,
          },
          identity: { e164NumberToSalt: { [mockE164Number]: mockE164NumberPepper } },
          stableToken: { balance: '0.00' },
          goldToken: { balance: '0.00' },
        })}
      >
        <Settings {...getMockStackScreenProps(Screens.Settings)} />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })

  it('renders correctly when dev mode active', () => {
    const tree = renderer.create(
      <Provider
        store={createMockStore({
          identity: { e164NumberToSalt: { [mockE164Number]: mockE164NumberPepper } },
          stableToken: { balance: '0.00' },
          goldToken: { balance: '0.00' },
          account: {
            devModeActive: true,
            e164PhoneNumber: mockE164Number,
          },
        })}
      >
        <Settings {...getMockStackScreenProps(Screens.Settings)} />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })
  it('renders correctly when verification is not possible', () => {
    const tree = renderer.create(
      <Provider store={createMockStore({})}>
        <Settings {...getMockStackScreenProps(Screens.Settings)} />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })
})
