import * as React from 'react'
import 'react-native'
import { Provider } from 'react-redux'
import * as renderer from 'react-test-renderer'
import configureMockStore from 'redux-mock-store'
import { VerificationReviewScreen } from 'src/components/TransactionReview/VerificationReviewScreen'
import i18n from 'src/i18n'

jest.mock('src/components/TransactionReview/VerificationConfirmationCard')

const mockStore = configureMockStore([])

const tProps = {
  tReady: false,
  i18n,
  t: i18n.t,
}

it('renders correctly', () => {
  const store = mockStore({ app: { language: 'en', name: 'Foo Bar', e164Number: '+11111111111' } })
  const navigation: any = {
    getParam: jest.fn(() => {
      return {
        timestamp: 1548691876959,
        value: '0.1',
        phoneNumbers: ['+XXX XXX XXXX'],
      }
    }),
  }
  const tree = renderer.create(
    <Provider store={store}>
      <VerificationReviewScreen navigation={navigation} {...tProps} />
    </Provider>
  )
  expect(tree).toMatchSnapshot()
})
