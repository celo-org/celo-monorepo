import RNInstallReferrer from 'react-native-install-referrer'
import {
  createInviteCode,
  extractValidInviteCode,
  getInviteCodeFromReferrerData,
  isValidPrivateKey,
} from 'src/invite/utils'

export const VALID_INVITE =
  'Something something pFCr5NAAf/vUcWypJiQFnF6DHI+6vCGxMhhShki07ow= another thing else'
export const VALID_INVITE_KEY = '0xa450abe4d0007ffbd4716ca92624059c5e831c8fbabc21b13218528648b4ee8c'
export const PARTIAL_INVITE =
  'Hi! I would like to invite you to join the Celo payments network. Your invite code is: ndoILWBXFR1+C59M3QKcEA7rWP7+2u5XQKC1gTemXBo= You can install the C'
export const PARTIAL_INVITE_KEY =
  '0x9dda082d6057151d7e0b9f4cdd029c100eeb58fefedaee5740a0b58137a65c1a'
describe(extractValidInviteCode, () => {
  it('extracts invite code correctly', () => {
    expect(extractValidInviteCode('nothing')).toBeNull()
    expect(
      extractValidInviteCode(
        'Something something pFCr5NAAf/vUcWypJiQFnF6DHI+6vCGxMhhShki07ow= another thing else'
      )
    ).toBe('0xa450abe4d0007ffbd4716ca92624059c5e831c8fbabc21b13218528648b4ee8c')
    expect(
      extractValidInviteCode(
        'Something something pFCr5NAAf/vUcWypJiQFnF6DHI+6vCGxMhhShki07ow=another thing else'
      )
    ).toBe('0xa450abe4d0007ffbd4716ca92624059c5e831c8fbabc21b13218528648b4ee8c')
    // Old SMS format
    expect(
      extractValidInviteCode(
        'Hi Lorem Ipsum! I would like to invite you to join the Celo payments network.' +
          ' Your invite code is: pFCr5NAAf/vUcWypJiQFnF6DHI+6vCGxMhhShki07ow='
      )
    ).toBe('0xa450abe4d0007ffbd4716ca92624059c5e831c8fbabc21b13218528648b4ee8c')
    // New SMS format
    expect(
      extractValidInviteCode(
        'Hi Ashish! I would like to invite you to join the Celo payments network.' +
          ' Your invite code is: ndoILWBXFR1+C59M3QKcEA7rWP7+2u5XQKC1gTemXBo=. You can install the Celo ' +
          'application from the following link: https://celo.page.link/ogoJowDDP5wi1BZN7'
      )
    ).toBe('0x9dda082d6057151d7e0b9f4cdd029c100eeb58fefedaee5740a0b58137a65c1a')
    // Source of https://github.com/celo-org/celo-monorepo/issues/1487 ?
    expect(
      extractValidInviteCode(
        'Hi Izzy! I would like to invite you to join the Celo payments network.' +
          ' Your invite code is: ESnrL7zNxmP0kjpklcNbCWJJgStYn3xM0dugHh7a9yQ=. ' +
          'You can install the Celo application from the following link: https://celo.page.link/XYyu9Mi7sz4YNsiM7'
      )
    ).toBe('0x1129eb2fbccdc663f4923a6495c35b096249812b589f7c4cd1dba01e1edaf724')
    // And now in es_419
    expect(
      extractValidInviteCode(
        'Hola Izzy! Me gustaría invitarte a que te unas a la red de pagos de Celo. ' +
          'Tu código de invitación es: ESnrL7zNxmP0kjpklcNbCWJJgStYn3xM0dugHh7a9yQ=. ' +
          'Podés instalarte la aplicación Celo desde el siguiente vínculo: https://celo.page.link/XYyu9Mi7sz4YNsiM7'
      )
    ).toBe('0x1129eb2fbccdc663f4923a6495c35b096249812b589f7c4cd1dba01e1edaf724')
  })
})

describe(createInviteCode, () => {
  it('generates a private key', () => {
    expect(
      createInviteCode('0x1129eb2fbccdc663f4923a6495c35b096249812b589f7c4cd1dba01e1edaf724')
    ).toBe('ESnrL7zNxmP0kjpklcNbCWJJgStYn3xM0dugHh7a9yQ=')
  })
})

describe(isValidPrivateKey, () => {
  it('checks for valid private key', () => {
    expect(
      isValidPrivateKey('0x1129eb2fbccdc663f4923a6495c35b096249812b589f7c4cd1dba01e1edaf724')
    ).toBe(true)
  })

  it('fails on too long private key', () => {
    expect(
      isValidPrivateKey('0x1129eb2fbccdc663f4923a6495c35b096249812b589f7c4cd1dba01e1edaf724123423')
    ).toBe(false)
  })

  it('fails on not 0x private key', () => {
    expect(
      isValidPrivateKey('121129eb2fbccdc663f4923a6495c35b096249812b589f7c4cd1dba01e1edaf724')
    ).toBe(false)
  })
})

const referrerData = {
  clickTimestamp: '0',
  installTimestamp: '0',
}

describe(getInviteCodeFromReferrerData, () => {
  it('returns null with invalid data', async () => {
    RNInstallReferrer.getReferrer.mockResolvedValue({ ...referrerData, installReferrer: '' })
    expect(await getInviteCodeFromReferrerData()).toBeNull()

    RNInstallReferrer.getReferrer.mockResolvedValue({ ...referrerData, installReferrer: 'x=a' })
    expect(await getInviteCodeFromReferrerData()).toBeNull()
  })

  it('gets a valid code from referrer data', async () => {
    RNInstallReferrer.getReferrer.mockResolvedValue({
      ...referrerData,
      installReferrer:
        'invite-code=0xa450abe4d0007ffbd4716ca92624059c5e831c8fbabc21b13218528648b4ee8c',
    })
    expect(await getInviteCodeFromReferrerData()).toBe(
      '0xa450abe4d0007ffbd4716ca92624059c5e831c8fbabc21b13218528648b4ee8c'
    )

    RNInstallReferrer.getReferrer.mockResolvedValue({
      ...referrerData,
      installReferrer:
        'invite-code%3D0xa450abe4d0007ffbd4716ca92624059c5e831c8fbabc21b13218528648b4ee8c',
    })
    expect(await getInviteCodeFromReferrerData()).toBe(
      '0xa450abe4d0007ffbd4716ca92624059c5e831c8fbabc21b13218528648b4ee8c'
    )

    RNInstallReferrer.getReferrer.mockResolvedValue({
      ...referrerData,
      installReferrer: 'invite-code%3D0ZdSckCiUkiUy5cQMuEv7DucMR%2BEewMx7fmyDd3rm4U%3D',
    })
    expect(await getInviteCodeFromReferrerData()).toBe(
      '0ZdSckCiUkiUy5cQMuEv7DucMR+EewMx7fmyDd3rm4U='
    )
  })
})
