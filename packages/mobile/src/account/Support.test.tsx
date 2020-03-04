import * as React from 'react'
import 'react-native'
import { fireEvent, render } from 'react-native-testing-library'
import { Provider } from 'react-redux'
import * as renderer from 'react-test-renderer'
import Support from 'src/account/Support'
import { FAQ_LINK, FORUM_LINK } from 'src/config'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { navigateToURI } from 'src/utils/linking'
import { createMockStore } from 'test/utils'

describe('Support', () => {
  it('renders correctly', () => {
    const tree = renderer.create(
      <Provider store={createMockStore({})}>
        <Support />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })

  it('navigates to Web FAQ', () => {
    const contact = render(<Support />)
    fireEvent.press(contact.getByTestId('WebFAQLink'))
    expect(navigateToURI).toBeCalledWith(FAQ_LINK)
  })

  it('navigates to Forum', () => {
    const contact = render(<Support />)
    fireEvent.press(contact.getByTestId('ForumLink'))
    expect(navigateToURI).toBeCalledWith(FORUM_LINK)
  })

  it('navigates to Contact', () => {
    const contact = render(<Support />)
    fireEvent.press(contact.getByTestId('SupportContactLink'))
    expect(navigate).toBeCalledWith(Screens.SupportContact)
  })
})
