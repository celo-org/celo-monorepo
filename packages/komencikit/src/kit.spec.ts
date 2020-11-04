import { normalizeAddressWith0x } from '@celo/base'
import { Err, Ok } from '@celo/base/lib/result'
import { ContractKit } from '@celo/contractkit'
import { WasmBlsBlindingClient } from '@celo/contractkit/lib/identity/odis/bls-blinding-client'
import Web3 from 'web3'
import { ActionTypes } from './actions'
import { AuthenticationFailed, KomenciErrorTypes, ServiceUnavailable, Unauthorised } from './errors'
import { KomenciKit, KomenciOptionsInput } from './kit'

jest.mock('@celo/contractkit')
jest.mock('./verifyWallet', () => ({
  verifyWallet: () => Promise.resolve(Ok(true)),
}))

const mockE164Number = '+14155550000'
const expectedPhoneHash = '0xf3ddadd1f488cdd42b9fa10354fdcae67c303ce182e71b30855733b50dce8301'
const expectedPepper = 'nHIvMC9B4j2+H'
const mockCombinedSignature = '0Uj+qoAu7ASMVvm6hvcUGx2eO/cmNdyEgGn0mSoZH8/dujrC1++SZ1N6IP6v2I8A'
const ODIS_PUB_KEY =
  '7FsWGsFnmVvRfMDpzz95Np76wf/1sPaK0Og9yiB+P8QbjiC8FV67NBans9hzZEkBaQMhiapzgMR6CkZIZPvgwQboAxl65JWRZecGe5V3XO4sdKeNemdAZ2TzQuWkuZoA'
// @ts-ignore mocked by jest
const contractKit = new ContractKit()
// @ts-ignore
contractKit.web3 = { eth: { sign: jest.fn() } }

jest.mock('@celo/contractkit/lib/identity/odis/bls-blinding-client', () => {
  // tslint:disable-next-line:no-shadowed-variable
  class WasmBlsBlindingClient {
    blindMessage = (m: string) => m
    unblindAndVerifyMessage = (m: string) => m
  }
  return {
    WasmBlsBlindingClient,
  }
})

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
      jest.spyOn(contractKit, 'signTypedData').mockResolvedValue({ v: 0, r: '0x0', s: '0x0' })
    })

    it('constructs the payload and calls exec', async () => {
      const kit = kitWithOptions()
      const execSpy = jest
        .spyOn((kit as any).client, 'exec')
        .mockResolvedValue(Err(new Unauthorised()))
      const resp = await kit.startSession('captcha-token')
      expect(execSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'POST',
          action: ActionTypes.StartSession,
          payload: {
            captchaResponseToken: 'captcha-token',
            externalAccount: normalizeAddressWith0x(account),
            signature: `0x000`,
          },
        })
      )

      expect(resp.ok).toBe(false)
      if (resp.ok === false) {
        expect(resp.error.errorType).toBe(KomenciErrorTypes.AuthenticationFailed)
      }
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

      const blsBlindingClient = new WasmBlsBlindingClient(ODIS_PUB_KEY)
      await kit.getDistributedBlindedPepper(mockE164Number, 'client-version', blsBlindingClient)

      expect(execSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'POST',
          action: ActionTypes.DistributedBlindedPepper,
          payload: {
            blindedPhoneNumber: Buffer.from(mockE164Number).toString('base64'),
            clientVersion: 'client-version',
          },
        })
      )
    })

    describe('when the call fails', () => {
      it('returns the error', async () => {
        const kit = kitWithOptions()
        jest.spyOn((kit as any).client, 'exec').mockResolvedValue(Err(new Unauthorised()))

        const blsBlindingClient = new WasmBlsBlindingClient(ODIS_PUB_KEY)
        await expect(
          kit.getDistributedBlindedPepper('phone-number', 'client-version', blsBlindingClient)
        ).resolves.toEqual(Err(new Unauthorised()))
      })
    })

    describe('when the call succeeds', () => {
      it('returns the identifier', async () => {
        const kit = kitWithOptions()
        jest
          .spyOn((kit as any).client, 'exec')
          .mockResolvedValue(Ok({ combinedSignature: mockCombinedSignature }))

        const blsBlindingClient = new WasmBlsBlindingClient(ODIS_PUB_KEY)
        await expect(
          kit.getDistributedBlindedPepper(mockE164Number, 'client-version', blsBlindingClient)
        ).resolves.toEqual(
          Ok({
            identifier: expectedPhoneHash,
            pepper: expectedPepper,
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
