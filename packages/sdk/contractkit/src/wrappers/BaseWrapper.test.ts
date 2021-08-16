import { NULL_ADDRESS } from '@celo/base'
import { CeloTxObject } from '@celo/connect'
import BigNumber from 'bignumber.js'
import Web3 from 'web3'
import {
  ICeloVersionedContract,
  newICeloVersionedContract,
} from '../generated/ICeloVersionedContract'
import { newKitFromWeb3 } from '../kit'
import { ContractVersion, newContractVersion } from '../versions'
import { BaseWrapper, unixSecondsTimestampToDateString } from './BaseWrapper'

const web3 = new Web3('http://localhost:8545')
const mockContract = newICeloVersionedContract(web3, NULL_ADDRESS)
const mockVersion = newContractVersion(1, 1, 1, 1)
// @ts-ignore
mockContract.methods.getVersionNumber = (): CeloTxObject<any> => ({
  call: async () => mockVersion.toRaw(),
})

class TestWrapper extends BaseWrapper<ICeloVersionedContract> {
  constructor() {
    super(newKitFromWeb3(web3), mockContract)
  }

  async protectedFunction(v: ContractVersion) {
    await this.onlyVersionOrGreater(v)
  }
}

describe('TestWrapper', () => {
  const tw = new TestWrapper()

  describe(`#onlyVersionOrGreater (actual = ${mockVersion})`, () => {
    const throwTests = [
      newContractVersion(2, 0, 0, 0),
      newContractVersion(1, 2, 0, 0),
      newContractVersion(1, 1, 2, 0),
    ]
    const resolveTests = [newContractVersion(1, 1, 1, 2), newContractVersion(1, 0, 0, 0)]

    throwTests.forEach((v) => {
      it(`should throw with incompatible version ${v}`, async () => {
        await expect(tw.protectedFunction(v)).rejects.toThrow(
          `Bytecode version ${mockVersion} is not compatible with ${v} yet`
        )
      })
    })

    resolveTests.forEach((v) => {
      it(`should resolve with compatible version ${v}`, async () => {
        await expect(tw.protectedFunction(v)).resolves.not.toThrow()
      })
    })
  })
})

describe('unixSecondsTimestampToDateString()', () => {
  const date = new BigNumber(1627489780)

  const timezoneMock = (zone: string) => {
    const DateTimeFormat = Intl.DateTimeFormat

    jest
      .spyOn(global.Intl, 'DateTimeFormat')
      .mockImplementation(
        (locale, options) => new DateTimeFormat(locale, { ...options, timeZone: zone })
      )
  }

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('when Brazil/East', () => {
    it('returns local time', () => {
      timezoneMock('Brazil/East')
      expect(unixSecondsTimestampToDateString(date)).toEqual('Wed, Jul 28, 2021, 1:29 PM GMT-3')
    })
  })

  describe('when UTC', () => {
    it('returns utc time', () => {
      timezoneMock('UTC')
      expect(unixSecondsTimestampToDateString(date)).toEqual('Wed, Jul 28, 2021, 4:29 PM UTC')
    })
  })
  describe('when Australia/Adelaide', () => {
    it('returns local time', () => {
      timezoneMock('Australia/Adelaide')
      expect(unixSecondsTimestampToDateString(date)).toEqual('Thu, Jul 29, 2021, 1:59 AM GMT+9:30')
    })
  })
  describe('when Europe/London', () => {
    it('returns local time', () => {
      timezoneMock('Europe/London')
      expect(unixSecondsTimestampToDateString(date)).toEqual('Wed, Jul 28, 2021, 5:29 PM GMT+1')
    })
  })
})
