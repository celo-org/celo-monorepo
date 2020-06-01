import mockButton from '@celo/react-components/components/Button'
import * as React from 'react'
import { fireEvent, render } from 'react-native-testing-library'
import { Provider } from 'react-redux'
import * as renderer from 'react-test-renderer'
import InviteReviewConnected, { InviteReview } from 'src/account/InviteReview'
import { Screens } from 'src/navigator/Screens'
import { createMockStore, getMockI18nProps, getMockStackScreenProps } from 'test/utils'
import { mockRecipient } from 'test/values'

jest.mock('src/geth/GethAwareButton', () => {
  return mockButton
})

const mockScreenProps = getMockStackScreenProps(Screens.InviteReview, { recipient: mockRecipient })

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
        <InviteReviewConnected {...mockScreenProps} />
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
          {...mockScreenProps}
        />
      </Provider>
    )

    fireEvent.press(inviteReview.getByTestId('inviteWhatsApp'))
    expect(hideAlert).toHaveBeenCalled()
    expect(sendInvite).toHaveBeenCalledWith('+14155550000', 'WhatsApp')
  })
})
