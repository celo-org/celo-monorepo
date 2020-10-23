import { normalizeAddressWith0x } from '@celo/base'
import { Err, Ok } from '@celo/base/lib/result'
import { ContractKit } from '@celo/contractkit'
import Web3 from 'web3'
import { ActionTypes } from './actions'
import { AuthenticationFailed, ServiceUnavailable, Unauthorised } from './errors'
import { KomenciKit, KomenciOptionsInput } from './kit'

jest.mock('@celo/contractkit')
// @ts-ignore mocked by jest
const contractKit = new ContractKit()
// @ts-ignore
contractKit.web3 = { eth: { sign: jest.fn() } }

describe('KomenciKit', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const account = Web3.utils.randomHex(20)
  const implAddress = Web3.utils.randomHex(20)
  const defaults: KomenciOptionsInput = {
    url: 'http://komenci.com/',
  }

  const kitWithOptions = (options?: Partial<KomenciOptionsInput>) => {
    return new KomenciKit(contractKit, account, {
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
    beforeEach(() => {
      jest.spyOn(contractKit.web3.eth, 'sign').mockResolvedValue(`${account}:signature`)
    })

    it('constructs the payload and calls exec', async () => {
      const kit = kitWithOptions()
      const execSpy = jest
        .spyOn((kit as any).client, 'exec')
        .mockResolvedValue(Err(new Unauthorised()))
      await kit.startSession('captcha-token')
      expect(execSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'POST',
          action: ActionTypes.StartSession,
          payload: {
            captchaResponseToken: 'captcha-token',
            externalAccount: normalizeAddressWith0x(account),
            signature: `${account}:signature`,
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

        await expect(kit.startSession('captcha-token')).resolves.toEqual(
          Err(new AuthenticationFailed())
        )
        expect(execSpy).toHaveBeenCalled()
      })
    })

    describe('when another error type occurs', () => {
      it('returns the error', async () => {
        const kit = kitWithOptions()
        jest.spyOn((kit as any).client, 'exec').mockResolvedValue(Err(new ServiceUnavailable()))

        await expect(kit.startSession('captcha-token')).resolves.toEqual(
          Err(new ServiceUnavailable())
        )
      })
    })

    describe('when the request succeeds', () => {
      it('records the token and returns Ok', async () => {
        const kit = kitWithOptions()
        jest.spyOn((kit as any).client, 'exec').mockResolvedValue(Ok({ token: 'komenci-token' }))
        const setTokenSpy = jest.spyOn((kit as any).client, 'setToken')

        await expect(kit.startSession('captcha-token')).resolves.toEqual(Ok('komenci-token'))
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
          .mockResolvedValue(Ok({ identifier: 'pn-identifier', pepper: 'pn-pepper' }))

        await expect(
          kit.getDistributedBlindedPepper('phone-number', 'client-version')
        ).resolves.toEqual(
          Ok({
            identifier: 'pn-identifier',
            pepper: 'pn-pepper',
          })
        )
      })
    })
  })

  describe('#deployWallet', () => {
    it('constructs the payload and calls exec', async () => {
      const kit = kitWithOptions()
      const execSpy = jest
        .spyOn((kit as any).client, 'exec')
        .mockResolvedValue(Ok({ status: 'deployed', walletAddress: '0x0' }))

      await kit.deployWallet(implAddress)

      expect(execSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'POST',
          action: ActionTypes.DeployWallet,
          payload: {
            implementationAddress: implAddress,
          },
        })
      )
    })
  })
})
