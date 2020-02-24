import firebase from 'react-native-firebase'
import { generateShortInviteLink } from 'src/firebase/dynamicLinks'

const mockKey = '0x1129eb2fbccdc663f4923a6495c35b096249812b589f7c4cd1dba01e1edaf724'

describe(generateShortInviteLink, () => {
  it('succeeds', async () => {
    ;(firebase.links().createShortDynamicLink as jest.Mock).mockResolvedValueOnce('shortLink')
    const result = await generateShortInviteLink({
      link: `https://celo.org/build/wallet`,
      playStoreUrl: `https://play.store.link&referrer=invite-code%3D${mockKey}`,
      appStoreUrl: 'https://app.store.link',
      bundleId: 'org.celo.mobile.integration',
    })
    expect(result).toEqual('shortLink')
  })

  it('fails and falls back to link', async () => {
    ;(firebase.links().createShortDynamicLink as jest.Mock).mockRejectedValueOnce('test')
    const link = `https://celo.org/build/wallet`
    const result = await generateShortInviteLink({
      link,
      playStoreUrl: `https://play.store.link&referrer=invite-code%3D${mockKey}`,
      appStoreUrl: 'https://app.store.link',
      bundleId: 'org.celo.mobile.integration',
    })
    expect(result).toEqual(link)
  })
})
