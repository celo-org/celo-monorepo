import mockButton from '@celo/react-components/components/Button'
import * as React from 'react'
import { fireEvent, render } from 'react-native-testing-library'
import { Provider } from 'react-redux'
import * as renderer from 'react-test-renderer'
import InviteReviewConnected, { InviteReview } from 'src/account/InviteReview'
import { createMockStore, getMockI18nProps } from 'test/utils'
import { mockCountryCode, mockNavigation } from 'test/values'

jest.mock('src/geth/GethAwareButton', () => {
  return mockButton
})

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
        {/*
          // @ts-ignore */}
        <InviteReviewConnected navigation={mockNavigation} />
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
          inviteInProgress={false}
          defaultCountryCode={mockCountryCode}
          dollarBalance={'100'}
          fetchDollarBalance={jest.fn()}
          hideAlert={hideAlert}
          showError={jest.fn()}
          sendInvite={sendInvite}
          {...getMockI18nProps()}
          // @ts-ignore
          navigation={mockNavigation}
        />
      </Provider>
    )

    fireEvent.press(inviteReview.getByTestId('inviteWhatsApp'))
    expect(hideAlert).toHaveBeenCalled()
    expect(sendInvite).toHaveBeenCalledWith('John Doe', '+14155550000', 'WhatsApp')
  })
})
