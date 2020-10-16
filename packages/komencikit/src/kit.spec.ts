import { Err, Ok } from '@celo/base/lib/result'
import { ContractKit } from '@celo/contractkit'
import Web3 from 'web3'
import { ActionTypes } from './actions'
import { AuthenticationFailed, ServiceUnavailable, Unauthorised } from './errors'
import { KomenciKit, KomenciOptionsInput } from './kit'

jest.mock('@celo/contractkit')
// @ts-ignore mocked by jest
const contractKit = new ContractKit()

describe('KomenciKit', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const account = Web3.utils.randomHex(20)
  const defaults: KomenciOptionsInput = {
    url: 'http://komenci.com/',
    platform: 'ios',
    account,
  }

  const kitWithOptions = (options?: Partial<KomenciOptionsInput>) => {
    return new KomenciKit(contractKit, {
      ...defaults,
      ...options,
    })
  }

  describe('#constructor', () => {
    it('creates an instance of KomenciKit with the given options', () => {
      const kit = kitWithOptions()
      // @ts-ignore
      expect(kit.options).toMatchObject(defaults)
      // @ts-ignore
      expect(kit.client.url).toEqual(defaults.url)
    })
  })

  describe('startSession', () => {
    it('constructs the payload and calls exec', async () => {
      const kit = kitWithOptions()
      const execSpy = jest
        .spyOn((kit as any).client, 'exec')
        .mockResolvedValue(Err(new Unauthorised()))
      await kit.startSession('captcha-token', 'device-token')
      expect(execSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'POST',
          action: ActionTypes.StartSession,
          payload: {
            captchaResponseToken: 'captcha-token',
            externalAccount: account,
            deviceType: 'ios',
            iosDeviceToken: 'device-token',
          },
        })
      )
    })

    describe('when the authentication fails', () => {
      it('returns an AuthenticationFailed error', async () => {
        const kit = kitWithOptions()
        const execSpy = jest
          .spyOn((kit as any).client, 'exec')
          .mockResolvedValue(Err(new Unauthorised()))

        await expect(kit.startSession('captcha-token', 'device-token')).resolves.toEqual(
          Err(new AuthenticationFailed())
        )
        expect(execSpy).toHaveBeenCalled()
      })
    })

    describe('when another error type occurs', () => {
      it('returns the error', async () => {
        const kit = kitWithOptions()
        jest.spyOn((kit as any).client, 'exec').mockResolvedValue(Err(new ServiceUnavailable()))

        await expect(kit.startSession('captcha-token', 'device-token')).resolves.toEqual(
          Err(new ServiceUnavailable())
        )
      })
    })

    describe('when the request succeeds', () => {
      it('records the token and returns Ok', async () => {
        const kit = kitWithOptions()
        jest.spyOn((kit as any).client, 'exec').mockResolvedValue(Ok({ token: 'komenci-token' }))
        const setTokenSpy = jest.spyOn((kit as any).client, 'setToken')

        await expect(kit.startSession('captcha-token', 'device-token')).resolves.toEqual(Ok(true))
        expect(setTokenSpy).toHaveBeenCalledWith('komenci-token')
      })
    })
  })

  describe('#getDistributedBlindedPepper', () => {
    it('constructs the payload and calls exec', async () => {
      const kit = kitWithOptions()
      const execSpy = jest
        .spyOn((kit as any).client, 'exec')
        .mockResolvedValue(Err(new Unauthorised()))

      await kit.getDistributedBlindedPepper('phone-number', 'client-version')

      expect(execSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'POST',
          action: ActionTypes.DistributedBlindedPepper,
          payload: {
            e164Number: 'phone-number',
            clientVersion: 'client-version',
          },
        })
      )
    })

    describe('when the call fails', () => {
      it('returns the error', async () => {
        const kit = kitWithOptions()
        jest.spyOn((kit as any).client, 'exec').mockResolvedValue(Err(new Unauthorised()))

        await expect(
          kit.getDistributedBlindedPepper('phone-number', 'client-version')
        ).resolves.toEqual(Err(new Unauthorised()))
      })
    })

    describe('when the call succeeds', () => {
      it('returns the identifier', async () => {
        const kit = kitWithOptions()
        jest
          .spyOn((kit as any).client, 'exec')
          .mockResolvedValue(Ok({ identifier: 'pn-identifier' }))

        await expect(
          kit.getDistributedBlindedPepper('phone-number', 'client-version')
        ).resolves.toEqual(Ok('pn-identifier'))
      })
    })
  })

  describe('#deployWallet', () => {
    it('constructs the payload and calls exec', async () => {
      const kit = kitWithOptions()
      const execSpy = jest
        .spyOn((kit as any).client, 'exec')
        .mockResolvedValue(Ok({ status: 'deployed', walletAddress: '0x0' }))

      await kit.deployWallet()

      expect(execSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'POST',
          action: ActionTypes.DeployWallet,
          payload: {},
        })
      )
    })
  })
})
