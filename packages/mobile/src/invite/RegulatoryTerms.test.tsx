import * as React from 'react'
import 'react-native'
import { fireEvent, render } from 'react-native-testing-library'
import { Provider } from 'react-redux'
import * as renderer from 'react-test-renderer'
import RegulatoryTerms from 'src/invite/RegulatoryTerms'
import { createMockStore } from 'test/utils'

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
    xit('records that in redux', () => {
      const store = createMockStore()
      const wrapper = render(
        <Provider store={store}>
          <RegulatoryTerms />
        </Provider>
      )
      fireEvent.press(wrapper.getByText('accept'))
      expect(store).toEqual({})
    })
  })
})
