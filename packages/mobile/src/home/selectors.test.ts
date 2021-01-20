import DeviceInfo from 'react-native-device-info'
import { getExtraNotifications } from 'src/home/selectors'
import { getMockStoreData } from 'test/utils'

describe(getExtraNotifications, () => {
  const mockedVersion = DeviceInfo.getVersion as jest.MockedFunction<typeof DeviceInfo.getVersion>
  mockedVersion.mockImplementation(() => '1.8.0')

  it('only returns notifications that are not dismissed, compatible with the current app version and country', () => {
    const state = getMockStoreData({
      account: {
        defaultCountryCode: '+63', // PH
      },
      home: {
        notifications: {
          notif1: {
            ctaUri: 'https://celo.org',
            content: {
              en: { body: 'A notification', cta: 'Start', dismiss: 'Dismiss' },
            },
          },
          notif2: {
            ctaUri: 'https://celo.org',
            content: {
              en: { body: 'A dismissed notification', cta: 'Start', dismiss: 'Dismiss' },
            },
            dismissed: true,
          },
          notif3: {
            ctaUri: 'https://celo.org',
            content: {
              en: {
                body: 'A notification within the version range',
                cta: 'Start',
                dismiss: 'Dismiss',
              },
            },
            minVersion: '1.8.0',
            maxVersion: '2.0.0',
          },
          notif4: {
            ctaUri: 'https://celo.org',
            content: {
              en: {
                body: 'A notification above the app version',
                cta: 'Start',
                dismiss: 'Dismiss',
              },
            },
            minVersion: '1.9.0',
          },
          notif5: {
            ctaUri: 'https://celo.org',
            content: {
              en: {
                body: 'A notification below the app version',
                cta: 'Start',
                dismiss: 'Dismiss',
              },
            },
            maxVersion: '1.7.9',
          },
          notif6: {
            ctaUri: 'https://celo.org',
            content: {
              en: {
                body: 'A notification only for France',
                cta: 'Start',
                dismiss: 'Dismiss',
              },
            },
            countries: ['FR'],
          },
          notif7: {
            ctaUri: 'https://celo.org',
            content: {
              en: {
                body: 'A notification only for the Philippines',
                cta: 'Start',
                dismiss: 'Dismiss',
              },
            },
            countries: ['PH'],
          },
        },
      },
    })

    const extraNotifications = getExtraNotifications(state)
    expect(Object.keys(extraNotifications)).toEqual(['notif1', 'notif3', 'notif7'])
  })
})
