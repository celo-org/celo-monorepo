import { assertRevert } from '@celo/protocol/lib/test-utils'
import { CeloContractName } from '@celo/protocol/lib/registry-utils'
import {
    FeeCurrencyWhitelistContract,
    FeeCurrencyWhitelistInstance,
    RegistryContract,
    RegistryInstance,
    MockSortedOraclesContract,
    MockSortedOraclesInstance,
} from 'types'

const FeeCurrencyWhitelist: FeeCurrencyWhitelistContract = artifacts.require('FeeCurrencyWhitelist')
const Registry: RegistryContract = artifacts.require('Registry')
const MockSortedOracles: MockSortedOraclesContract = artifacts.require('MockSortedOracles')

contract('FeeCurrencyWhitelist', (accounts: string[]) => {
    let feeCurrencyWhitelist: FeeCurrencyWhitelistInstance
    let registry: RegistryInstance
    let mockSortedOracles: MockSortedOraclesInstance
    const aTokenAddress = '0x000000000000000000000000000000000000ce10'

    const nonOwner = accounts[1]

    beforeEach(async () => {
        registry = await Registry.new()
        mockSortedOracles = await MockSortedOracles.new()
        await registry.setAddressFor(CeloContractName.SortedOracles, mockSortedOracles.address)
        feeCurrencyWhitelist = await FeeCurrencyWhitelist.new()
        await feeCurrencyWhitelist.initialize(registry.address)
    })

    describe('#initialize()', () => {
        it('should have set the owner', async () => {
            const owner: string = await feeCurrencyWhitelist.owner()
            assert.equal(owner, accounts[0])
        })

        it('should not be callable again', async () => {
            await assertRevert(feeCurrencyWhitelist.initialize(registry.address))
        })
    })

    describe('#addToken()', () => {
        it('should allow the owner to add a token', async () => {
            await feeCurrencyWhitelist.addToken(aTokenAddress)
            const tokens = await feeCurrencyWhitelist.getWhitelist()
            assert.sameMembers(tokens, [aTokenAddress])
        })

        it('should not allow a non-owner to add a token', async () => {
            await assertRevert(feeCurrencyWhitelist.addToken(aTokenAddress, { from: nonOwner }))
        })

        it('should not allow to add a token with an invalid oracle price', async () => {
            await assertRevert(feeCurrencyWhitelist.addToken(aTokenAddress))
        })
    })
})
