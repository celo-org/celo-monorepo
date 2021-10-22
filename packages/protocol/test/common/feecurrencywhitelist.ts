import { CeloContractName } from '@celo/protocol/lib/registry-utils'
import { assertRevert, assumeOwnership } from '@celo/protocol/lib/test-utils'
import { getDeployedProxiedContract } from '@celo/protocol/lib/web3-utils'
import {
  FeeCurrencyWhitelistContract,
  FeeCurrencyWhitelistInstance,
  MockSortedOraclesContract,
  MockSortedOraclesInstance,
  MockStableTokenContract,
  MockStableTokenInstance,
  RegistryInstance,
} from 'types'

const FeeCurrencyWhitelist: FeeCurrencyWhitelistContract = artifacts.require('FeeCurrencyWhitelist')
const MockSortedOracles: MockSortedOraclesContract = artifacts.require('MockSortedOracles')
const MockStableToken: MockStableTokenContract = artifacts.require('MockStableToken')

contract('FeeCurrencyWhitelist', (accounts: string[]) => {
  let feeCurrencyWhitelist: FeeCurrencyWhitelistInstance
  let registry: RegistryInstance
  let mockStableToken: MockStableTokenInstance
  let mockSortedOracles: MockSortedOraclesInstance

  const nonOwner = accounts[1]

  before(async () => {
    mockStableToken = await MockStableToken.new()
    mockSortedOracles = await MockSortedOracles.new()

    registry = await getDeployedProxiedContract('Registry', artifacts)
    // Take ownership of the registry contract to point it to the mocks
    await assumeOwnership(['Registry'], accounts[0])
    await registry.setAddressFor(CeloContractName.SortedOracles, mockSortedOracles.address)
  })

  beforeEach(async () => {
    feeCurrencyWhitelist = await FeeCurrencyWhitelist.new(true)
    await feeCurrencyWhitelist.initialize()
  })

  describe('#initialize()', () => {
    it('should have set the owner', async () => {
      const owner: string = await feeCurrencyWhitelist.owner()
      assert.equal(owner, accounts[0])
    })

    it('should not be callable again', async () => {
      await assertRevert(feeCurrencyWhitelist.initialize())
    })
  })

  describe('#addToken()', () => {
    it('should revert when token has no oracle price', async () => {
      await assertRevert(feeCurrencyWhitelist.addToken(mockStableToken.address))
    })

    describe('when token has an oracle price', () => {
      beforeEach(async () => {
        await mockSortedOracles.setNumRates(mockStableToken.address, 1)
      })

      it('should allow the owner to add a token', async () => {
        await feeCurrencyWhitelist.addToken(mockStableToken.address)
        const tokens = await feeCurrencyWhitelist.getWhitelist()
        assert.sameMembers(tokens, [mockStableToken.address])
      })

      it('should not allow a non-owner to add a token', async () => {
        await assertRevert(
          feeCurrencyWhitelist.addToken(mockStableToken.address, { from: nonOwner })
        )
      })
    })
  })
})
