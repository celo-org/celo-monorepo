import * as React from 'react'
import { render } from 'react-native-testing-library'
import { Provider } from 'react-redux'
import { ContactSyncBanner } from 'src/send/ContactSyncBanner'
import { createMockStore } from 'test/utils'

describe('ContactSyncBanner', () => {
  it('renders correctly during sync', () => {
    const store = createMockStore({
      identity: {
        isLoadingImportContacts: true,
        contactMappingProgress: {
          current: 100,
          total: 200,
        },
      },
    })
    const { getByText, toJSON } = render(
      <Provider store={store}>
        <ContactSyncBanner />
      </Provider>
    )
    expect(getByText('contactSyncProgress.header')).toBeTruthy()
    expect(toJSON()).toMatchSnapshot()
  })

  it('hides when not syncing', () => {
    const store = createMockStore({
      identity: {
        isLoadingImportContacts: false,
        contactMappingProgress: {
          current: 0,
          total: 0,
        },
      },
    })
    const { toJSON } = render(
      <Provider store={store}>
        <ContactSyncBanner />
      </Provider>
    )
    expect(toJSON()).toBeFalsy()
  })

  it('shows error when sync failed', () => {
    const store = createMockStore({
      identity: {
        isLoadingImportContacts: false,
        contactMappingProgress: {
          current: 50,
          total: 100,
        },
      },
    })
    const { getByTestId, toJSON } = render(
      <Provider store={store}>
        <ContactSyncBanner />
      </Provider>
    )
    expect(getByTestId('ErrorIcon')).toBeTruthy()
    expect(toJSON()).toMatchSnapshot()
  })
})
