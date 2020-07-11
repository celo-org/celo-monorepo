import BigNumber from 'bignumber.js'
import {
  ContractRetrieval,
  createMockAttestation,
  createMockContractKit,
  createMockStableToken,
  createMockWeb3,
} from '../../../common/test/utils'
import { mockAccount, mockPhoneNumber } from '../../../common/test/values'
import { getPerformedQueryCount } from '../../src/database/wrappers/account'
import { getRemainingQueryCount } from '../../src/salt-generation/query-quota'
import { getContractKit, isVerified } from '../../src/web3/contracts'

jest.mock('../../src/web3/contracts')
const mockGetContractKit = getContractKit as jest.Mock
jest.mock('../../src/database/wrappers/account')
const mockPerformedQueryCount = getPerformedQueryCount as jest.Mock
jest.mock('../../src/common/identity')
const mockIsVerified = isVerified as jest.Mock
// tslint:disable-next-line: no-object-literal-type-assertion

describe(getRemainingQueryCount, () => {
  it('Calculates remaining query count for verified account', async () => {
    const contractKitVerifiedNoTx = createMockContractKit(
      {
        [ContractRetrieval.getAttestations]: createMockAttestation(3, 3),
        [ContractRetrieval.getStableToken]: createMockStableToken(
          new BigNumber(200000000000000000)
        ),
      },
      createMockWeb3(5)
    )
    mockPerformedQueryCount.mockImplementation(() => new Promise((resolve) => resolve(2)))
    mockIsVerified.mockReturnValue(true)
    mockGetContractKit.mockImplementation(() => contractKitVerifiedNoTx)
    expect(await getRemainingQueryCount(mockAccount, mockPhoneNumber)).toEqual({
      performedQueryCount: 2,
      totalQuota: 42,
    })
  })
  it('Calculates remaining query count for unverified account', async () => {
    const contractKitVerifiedNoTx = createMockContractKit(
      {
        [ContractRetrieval.getAttestations]: createMockAttestation(0, 0),
        [ContractRetrieval.getStableToken]: createMockStableToken(
          new BigNumber(200000000000000000)
        ),
      },
      createMockWeb3(0)
    )
    mockPerformedQueryCount.mockImplementation(() => new Promise((resolve) => resolve(1)))
    mockIsVerified.mockReturnValue(false)
    mockGetContractKit.mockImplementation(() => contractKitVerifiedNoTx)
    expect(await getRemainingQueryCount(mockAccount, mockPhoneNumber)).toEqual({
      performedQueryCount: 1,
      totalQuota: 2,
    })
  })
  it('Calculates remaining query count for verified account with many txs', async () => {
    const contractKitVerifiedNoTx = createMockContractKit(
      {
        [ContractRetrieval.getAttestations]: createMockAttestation(3, 3),
        [ContractRetrieval.getStableToken]: createMockStableToken(
          new BigNumber(200000000000000000)
        ),
      },
      createMockWeb3(100)
    )
    mockPerformedQueryCount.mockImplementation(() => new Promise((resolve) => resolve(10)))
    mockIsVerified.mockReturnValue(true)
    mockGetContractKit.mockImplementation(() => contractKitVerifiedNoTx)
    expect(await getRemainingQueryCount(mockAccount, mockPhoneNumber)).toEqual({
      performedQueryCount: 10,
      totalQuota: 232,
    })
  })
  it('Calculates remaining query count for unverified account with many txs', async () => {
    const contractKitVerifiedNoTx = createMockContractKit(
      {
        [ContractRetrieval.getAttestations]: createMockAttestation(0, 0),
        [ContractRetrieval.getStableToken]: createMockStableToken(
          new BigNumber(200000000000000000)
        ),
      },
      createMockWeb3(100)
    )
    mockPerformedQueryCount.mockImplementation(() => new Promise((resolve) => resolve(0)))
    mockIsVerified.mockReturnValue(false)
    mockGetContractKit.mockImplementation(() => contractKitVerifiedNoTx)
    expect(await getRemainingQueryCount(mockAccount, mockPhoneNumber)).toEqual({
      performedQueryCount: 0,
      totalQuota: 202,
    })
  })
  it('Calculates remaining query count for unverified account without any balance', async () => {
    const contractKitVerifiedNoTx = createMockContractKit(
      {
        [ContractRetrieval.getAttestations]: createMockAttestation(0, 0),
        [ContractRetrieval.getStableToken]: createMockStableToken(new BigNumber(0)),
      },
      createMockWeb3(100)
    )
    mockPerformedQueryCount.mockImplementation(() => new Promise((resolve) => resolve(0)))
    mockIsVerified.mockReturnValue(false)
    mockGetContractKit.mockImplementation(() => contractKitVerifiedNoTx)
    expect(await getRemainingQueryCount(mockAccount, mockPhoneNumber)).toEqual({
      performedQueryCount: 0,
      totalQuota: 0,
    })
  })
  it('No phone number hash when request own phone number', async () => {
    const contractKitVerifiedNoTx = createMockContractKit(
      {
        [ContractRetrieval.getAttestations]: createMockAttestation(0, 0),
        [ContractRetrieval.getStableToken]: createMockStableToken(
          new BigNumber(200000000000000000)
        ),
      },
      createMockWeb3(0)
    )
    mockPerformedQueryCount.mockImplementation(() => new Promise((resolve) => resolve(0)))
    mockGetContractKit.mockImplementation(() => contractKitVerifiedNoTx)
    expect(await getRemainingQueryCount(mockAccount, undefined)).toEqual({
      performedQueryCount: 0,
      totalQuota: 2,
    })
  })
})
