import firebase from 'react-native-firebase'
import { generateShortInviteLink } from 'src/firebase/dynamicLinks'

describe(generateShortInviteLink, () => {
  const createShortDynamicLink = firebase.links().createShortDynamicLink as jest.Mock
  it('succeeds', async () => {
    createShortDynamicLink.mockResolvedValueOnce('shortLink')
    const result = await generateShortInviteLink({
      link: `https://celo.org/build/wallet`,
      appStoreId: '123456789',
      bundleId: 'org.celo.mobile.integration',
    })
    expect(result).toEqual('shortLink')
  })

  it('fails and falls back to link', async () => {
    createShortDynamicLink.mockRejectedValueOnce('test')
    const link = `https://celo.org/build/wallet`
    const result = await generateShortInviteLink({
      link,
      appStoreId: '123456789',
      bundleId: 'org.celo.mobile.integration',
    })
    expect(result).toEqual(link)
  })
})
