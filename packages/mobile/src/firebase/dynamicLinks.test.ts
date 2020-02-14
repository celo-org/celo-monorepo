import { generateShortInviteLink } from 'src/firebase/dynamicLinks'

const mockKey = '0x1129eb2fbccdc663f4923a6495c35b096249812b589f7c4cd1dba01e1edaf724'

describe(generateShortInviteLink, () => {
  it('succeeds', async () => {
    const result = await generateShortInviteLink({
      link: `celo://wallet/invitation/invite-code%3D${mockKey}`,
      playStoreUrl: `https://play.store.link&referrer=invite-code%3D${mockKey}`,
      appStoreUrl: 'https://app.store.link',
      bundleId: 'org.celo.mobile.integration',
    })
    expect(result).toEqual('shortLink')
  })

  it('fails and falls back to link', async () => {
    const link = `celo://wallet/invitation/invite-code%3D${mockKey}`
    const result = await generateShortInviteLink({
      link,
      playStoreUrl: `https://play.store.link&referrer=invite-code%3D${mockKey}`,
      appStoreUrl: 'https://app.store.link',
      bundleId: '',
    })
    expect(result).toEqual(link)
  })
})
