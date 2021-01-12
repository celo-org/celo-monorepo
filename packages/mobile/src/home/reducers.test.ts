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
