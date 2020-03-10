import dynamicLinks from '@react-native-firebase/dynamic-links'
import { generateShortInviteLink } from 'src/firebase/dynamicLinks'

describe(generateShortInviteLink, () => {
  const buildShortLink = dynamicLinks().buildShortLink as jest.Mock
  it('succeeds', async () => {
    buildShortLink.mockResolvedValueOnce('shortLink')
    const result = await generateShortInviteLink({
      link: `https://celo.org/build/wallet`,
      appStoreId: '123456789',
      bundleId: 'org.celo.mobile.integration',
    })
    expect(result).toEqual('shortLink')
  })

  it('fails and falls back to link', async () => {
    buildShortLink.mockRejectedValueOnce('test')
    const link = `https://celo.org/build/wallet`
    const result = await generateShortInviteLink({
      link,
      appStoreId: '123456789',
      bundleId: 'org.celo.mobile.integration',
    })
    expect(result).toEqual(link)
  })
})
