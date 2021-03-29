import { assertRevert } from '@celo/protocol/lib/test-utils'
import { CeloContractName } from '@celo/protocol/lib/registry-utils'
import { fixed1 } from '@celo/utils/lib/fixidity'
import BigNumber from 'bignumber.js'
import {
    FeeCurrencyWhitelistContract,
    FeeCurrencyWhitelistInstance,
    RegistryContract,
    RegistryInstance,
    MockSortedOraclesContract,
    MockSortedOraclesInstance,
    StableTokenContract,
    StableTokenInstance,
} from 'types'

const FeeCurrencyWhitelist: FeeCurrencyWhitelistContract = artifacts.require('FeeCurrencyWhitelist')
const Registry: RegistryContract = artifacts.require('Registry')
const MockSortedOracles: MockSortedOraclesContract = artifacts.require('MockSortedOracles')
const StableToken: StableTokenContract = artifacts.require('StableToken')

// @ts-ignore
StableToken.numberFormat = 'BigNumber'

contract('FeeCurrencyWhitelist', (accounts: string[]) => {
    let feeCurrencyWhitelist: FeeCurrencyWhitelistInstance
    let registry: RegistryInstance
    let stableToken: StableTokenInstance
    let mockSortedOracles: MockSortedOraclesInstance

    const nonOwner = accounts[1]

    const decimals = 18
    const SECONDS_IN_A_WEEK = 604800
    const goldAmountForRate = new BigNumber('0x10000000000000000')
    const stableAmountForRate = new BigNumber(2).times(goldAmountForRate)
    beforeEach(async () => {
        stableToken = await StableToken.new()
        registry = await Registry.new()

        await stableToken.initialize(
            'Celo Dollar',
            'cUSD',
            decimals,
            registry.address,
            fixed1,
            SECONDS_IN_A_WEEK,
            [],
            [],
            'Exchange'
        )

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
        it('should not allow to add a token with an invalid oracle price', async () => {
            await assertRevert(feeCurrencyWhitelist.addToken(stableToken.address))
        })

        it('should allow the owner to add a token', async () => {
            await mockSortedOracles.setMedianRate(stableToken.address, stableAmountForRate)
            await mockSortedOracles.setMedianTimestampToNow(stableToken.address)
            await mockSortedOracles.setNumRates(stableToken.address, 2)
            await feeCurrencyWhitelist.addToken(stableToken.address)
            const tokens = await feeCurrencyWhitelist.getWhitelist()
            assert.sameMembers(tokens, [stableToken.address])
        })

        it('should not allow a non-owner to add a token', async () => {
            await assertRevert(feeCurrencyWhitelist.addToken(stableToken.address, { from: nonOwner }))
        })

    })
})
