import * as React from 'react'
import 'react-native'
import { fireEvent, render } from 'react-native-testing-library'
import { Provider } from 'react-redux'
import * as renderer from 'react-test-renderer'
import RegulatoryTerms, {
  RegulatoryTerms as RegulatoryTermsClass,
} from 'src/invite/RegulatoryTerms'
import { createMockStore, getMockI18nProps } from 'test/utils'

describe('RegulatoryTermsScreen', () => {
  it('renders correctly', () => {
    const store = createMockStore()
    const tree = renderer.create(
      <Provider store={store}>
        <RegulatoryTerms />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })

  describe('when accept button is pressed', () => {
    it('stores that info', async () => {
      const store = createMockStore({})
      const acceptTerms = jest.fn()
      const wrapper = render(
        <Provider store={store}>
          <RegulatoryTermsClass {...getMockI18nProps()} acceptTerms={acceptTerms} />
        </Provider>
      )
      fireEvent.press(wrapper.getByTestId('AcceptTermsButton'))
      expect(acceptTerms).toHaveBeenCalled()
    })
  })
})
