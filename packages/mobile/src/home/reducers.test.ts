import { Actions } from 'src/home/actions'
import { homeReducer as reducer, initialState } from 'src/home/reducers'

const createTestNotification = (body: string) => ({
  ctaUri: 'https://celo.org',
  darkMode: true,
  content: {
    en: {
      body,
      cta: 'Start',
      dismiss: 'Dismiss',
    },
  },
})

describe('home reducer', () => {
  it('should return the initial state', () => {
    // @ts-ignore
    expect(reducer(undefined, {})).toEqual(initialState)
  })

  it('UPDATE_NOTIFICATIONS should override based on the id', () => {
    const notification1 = createTestNotification('Notification 1')
    const notification2 = createTestNotification('Notification 2')
    let updatedState = reducer(undefined, {
      type: Actions.UPDATE_NOTIFICATIONS,
      notifications: {
        notification1,
        notification2,
      },
    })
    expect(updatedState).toEqual({
      ...initialState,
      notifications: {
        notification1,
        notification2,
      },
    })

    updatedState = reducer(updatedState, {
      type: Actions.UPDATE_NOTIFICATIONS,
      notifications: {
        notification1: {
          ...notification1,
          ctaUri: 'https://valoraapp.com',
          minVersion: '1.8.0',
        },
      },
    })
    // Notification 2 deleted, notification 1 updated.
    expect(updatedState).toEqual({
      ...initialState,
      notifications: {
        notification1: {
          ...notification1,
          ctaUri: 'https://valoraapp.com',
          minVersion: '1.8.0',
        },
      },
    })

    // Now we remove one of the optional fields
    updatedState = reducer(updatedState, {
      type: Actions.UPDATE_NOTIFICATIONS,
      notifications: {
        notification1,
      },
    })
    // The optional field is now removed
    expect(updatedState).toEqual({
      ...initialState,
      notifications: {
        notification1,
      },
    })

    // Now we update an already dismissed notification
    updatedState = reducer(
      {
        ...updatedState,
        notifications: {
          ...updatedState.notifications,
          notification1: {
            ...updatedState.notifications.notification1,
            dismissed: true,
          },
        },
      },
      {
        type: Actions.UPDATE_NOTIFICATIONS,
        notifications: {
          notification1: {
            ...notification1,
            iconUrl: 'http://example.com/icon.png',
          },
        },
      }
    )
    // The notification remains dismissed
    expect(updatedState).toEqual({
      ...initialState,
      notifications: {
        notification1: {
          ...notification1,
          iconUrl: 'http://example.com/icon.png',
          dismissed: true,
        },
      },
    })
  })

  it('should dismiss notifications', () => {
    const notification1 = createTestNotification('Notification 1')
    const notification2 = createTestNotification('Notification 2')
    expect(
      reducer(
        {
          ...initialState,
          notifications: {
            notification1,
            notification2,
          },
        },
        {
          type: Actions.DISMISS_NOTIFICATION,
          id: 'notification1',
        }
      )
    ).toEqual({
      ...initialState,
      notifications: {
        notification1: {
          ...notification1,
          dismissed: true,
        },
        notification2,
      },
    })
  })
})
