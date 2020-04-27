import { getPerformedQueryCount } from '../../src/database/wrappers/account'
import QueryQuota from '../../src/salt-generation/query-quota'

const ACCOUNT = '0x78dc5D2D739606d31509C31d654056A45185ECb6'
const PHONE_NUMBER = '+1234567890'
const queryQuota: QueryQuota = new QueryQuota()

jest.mock('../../src/database/wrappers/account')
const mockPerformedQueryCount = getPerformedQueryCount as jest.Mock

jest.mock('@celo/contractkit', () => {
  const utils = require('../utils')
  const attestation = utils.createMockAttestation(3, 3)
  const kit = utils.createMockContractKit({
    [utils.ContractRetrieval.getAttestations]: attestation,
  })

  return {
    ...jest.requireActual('@celo/contractkit'),
    newKit: () => kit,
  }
})

describe('get remaining query count', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })
  it('calculates remaining query count', async () => {
    mockPerformedQueryCount.mockImplementation(() => new Promise((resolve) => resolve(2)))
    jest.spyOn(queryQuota, 'getQueryQuota').mockResolvedValue(32)
    expect(await queryQuota.getRemainingQueryCount(ACCOUNT, PHONE_NUMBER)).toEqual(30)
  })
})

describe(`Retrieve Transaction Count`, () => {
  beforeEach(() => {
    jest.restoreAllMocks()
  })
  it('verified without any transactions', async () => {
    jest.spyOn(queryQuota, 'isVerified').mockResolvedValue(true)
    jest.spyOn(queryQuota, 'getTransactionCountFromAccount').mockResolvedValue(0)
    expect(await queryQuota.getQueryQuota(ACCOUNT, PHONE_NUMBER)).toEqual(32)
  })
  it('verified without transactions', async () => {
    jest.spyOn(queryQuota, 'isVerified').mockResolvedValue(true)
    jest.spyOn(queryQuota, 'getTransactionCountFromAccount').mockResolvedValue(2)
    expect(await queryQuota.getQueryQuota(ACCOUNT, PHONE_NUMBER)).toEqual(36)
  })
  it('unverified', async () => {
    jest.spyOn(queryQuota, 'isVerified').mockResolvedValue(false)
    expect(await queryQuota.getQueryQuota(ACCOUNT, PHONE_NUMBER)).toEqual(2)
  })
})

describe(`Assert phone number is verified`, () => {
  beforeEach(() => {
    jest.restoreAllMocks()
  })
  it('happy path returns true', async () => {
    expect(await queryQuota.isVerified(ACCOUNT, PHONE_NUMBER)).toEqual(true)
  })
})
