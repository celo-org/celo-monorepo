import { getPerformedQueryCount } from '../../src/database/wrappers/account'
import { getRemainingQueryCount } from '../../src/salt-generation/query-quota'
import { getContractKit } from '../../src/web3/contracts'
import {
  ContractRetrieval,
  createMockAttestation,
  createMockContractKit,
  createMockWeb3,
} from '../utils'
import { mockAccount, mockPhoneNumber } from '../values'

jest.mock('../../src/web3/contracts')
const mockGetContractKit = getContractKit as jest.Mock
jest.mock('../../src/database/wrappers/account')
const mockPerformedQueryCount = getPerformedQueryCount as jest.Mock

describe(getRemainingQueryCount, () => {
  it('Calculates remaining query count for verified account', async () => {
    const contractKitVerifiedNoTx = createMockContractKit(
      {
        [ContractRetrieval.getAttestations]: createMockAttestation(3, 3),
      },
      createMockWeb3(5)
    )
    mockPerformedQueryCount.mockImplementation(() => new Promise((resolve) => resolve(2)))
    mockGetContractKit.mockImplementation(() => contractKitVerifiedNoTx)
    expect(await getRemainingQueryCount(mockAccount, mockPhoneNumber)).toEqual(40)
  })
  it('Calculates remaining query count for unverified account', async () => {
    const contractKitVerifiedNoTx = createMockContractKit(
      {
        [ContractRetrieval.getAttestations]: createMockAttestation(0, 0),
      },
      createMockWeb3(0)
    )
    mockPerformedQueryCount.mockImplementation(() => new Promise((resolve) => resolve(1)))
    mockGetContractKit.mockImplementation(() => contractKitVerifiedNoTx)
    expect(await getRemainingQueryCount(mockAccount, mockPhoneNumber)).toEqual(1)
  })
  it('Calculates remaining query count for verified account with many txs', async () => {
    const contractKitVerifiedNoTx = createMockContractKit(
      {
        [ContractRetrieval.getAttestations]: createMockAttestation(3, 3),
      },
      createMockWeb3(100)
    )
    mockPerformedQueryCount.mockImplementation(() => new Promise((resolve) => resolve(10)))
    mockGetContractKit.mockImplementation(() => contractKitVerifiedNoTx)
    expect(await getRemainingQueryCount(mockAccount, mockPhoneNumber)).toEqual(222)
  })
  it('Calculates remaining query count for unverified account with many txs', async () => {
    const contractKitVerifiedNoTx = createMockContractKit(
      {
        [ContractRetrieval.getAttestations]: createMockAttestation(0, 0),
      },
      createMockWeb3(100)
    )
    mockPerformedQueryCount.mockImplementation(() => new Promise((resolve) => resolve(0)))
    mockGetContractKit.mockImplementation(() => contractKitVerifiedNoTx)
    expect(await getRemainingQueryCount(mockAccount, mockPhoneNumber)).toEqual(2)
  })
})
