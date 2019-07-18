import * as React from 'react'
import 'react-native'
import { Provider } from 'react-redux'
import * as renderer from 'react-test-renderer'
import configureMockStore from 'redux-mock-store'
import { VerificationConfirmationCard } from 'src/components/TransactionReview/VerificationConfirmationCard'
import i18n from 'src/i18n'

const mockStore = configureMockStore([])

const tProps = {
  tReady: false,
  i18n,
  t: i18n.t,
}

jest.mock('@celo/react-components/components/PhoneNumberWithFlag', () => ({
  default: () => '<View>PhoneNumberWithFlag</View>',
}))

it('renders correctly', () => {
  const store = mockStore({
    app: {
      language: 'en',
      name: 'Foo Bar',
      e164Number: '+11111111111',
      accountAddress: '0x00000000000000',
    },
  })
  const tree = renderer.create(
    <Provider store={store}>
      <VerificationConfirmationCard
        value={'0.1'}
        phoneNumbers={['+XXX XXX XXXX']}
        name={'Foo Bar'}
        e164Number={'+11111111111'}
        accountAddress={'0x000000000000000000000000'}
        countryCode={'+1'}
        {...tProps}
      />
    </Provider>
  )
  expect(tree).toMatchSnapshot()
})
