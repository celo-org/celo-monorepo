import mockButton from '@celo/react-components/components/Button'
import * as React from 'react'
import { fireEvent, render } from 'react-native-testing-library'
import { Provider } from 'react-redux'
import * as renderer from 'react-test-renderer'
import InviteReviewConnected, { InviteReview } from 'src/account/InviteReview'
import { Screens } from 'src/navigator/Screens'
import { createMockStore, getMockI18nProps } from 'test/utils'
import { mockNavigation, mockRecipient } from 'test/values'

jest.mock('src/geth/GethAwareButton', () => {
  return mockButton
})

const mockRoute = {
  name: Screens.InviteReview as Screens.InviteReview,
  key: '1',
  params: {
    recipient: mockRecipient,
  },
}

describe('InviteReview', () => {
  beforeAll(() => {
    jest.useFakeTimers()
  })

  afterAll(() => {
    jest.useRealTimers()
  })

  it('renders correctly', () => {
    const tree = renderer.create(
      <Provider store={createMockStore()}>
        <InviteReviewConnected navigation={mockNavigation} route={mockRoute} />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })

  it('sends an invite and hides the alert when pressing the invite button', async () => {
    const hideAlert = jest.fn()
    hideAlert.mockName('hideAlert')
    const sendInvite = jest.fn()
    sendInvite.mockName('sendInvite')

    const inviteReview = render(
      <Provider store={createMockStore()}>
        <InviteReview
          account="0xabc"
          inviteInProgress={false}
          dollarBalance={'100'}
          fetchDollarBalance={jest.fn()}
          hideAlert={hideAlert}
          showError={jest.fn()}
          sendInvite={sendInvite}
          {...getMockI18nProps()}
          navigation={mockNavigation}
          route={mockRoute}
        />
      </Provider>
    )

    fireEvent.press(inviteReview.getByTestId('inviteWhatsApp'))
    expect(hideAlert).toHaveBeenCalled()
    expect(sendInvite).toHaveBeenCalledWith('+14155550000', 'WhatsApp')
  })
})
