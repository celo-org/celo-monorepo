// /* eslint:disable */

// TODO remove magic numbers
import { CeloContractName } from '@celo/protocol/lib/registry-utils'
import { assertTransactionRevertWithReason } from '@celo/protocol/lib/test-utils'
import {
  GoldTokenContract,
  GoldTokenInstance,
  RegistryContract,
  RegistryInstance,
  UniswapFeeHandlerSellerContract,
  UniswapFeeHandlerSellerInstance,
} from 'types'

const UniswapFeeHandlerSeller: UniswapFeeHandlerSellerContract =
  artifacts.require('UniswapFeeHandlerSeller')

const GoldToken: GoldTokenContract = artifacts.require('GoldToken')
const Registry: RegistryContract = artifacts.require('Registry')

contract('UniswapFeeHandlerSeller', (accounts: string[]) => {
  let uniswapFeeHandlerSeller: UniswapFeeHandlerSellerInstance
  let goldToken: GoldTokenInstance
  let registry: RegistryInstance

  const addressA = '0xFA907Ed32fC6Ca20408214C0DC8734403738AbDb'
  const addressB = '0x61eb0a82C8802090b61381853e7Ec34b985e9b85'
  const addressC = '0xb7c771B22A983e19fE7aCAB574F7dF5A6C65cAB1'
  const addressD = '0x866284bd3946882CFc23e2F14942f5c293fb5742'

  const user = accounts[1]

  beforeEach(async () => {
    registry = await Registry.new(true)

    goldToken = await GoldToken.new(true)
    await goldToken.initialize(registry.address)
    await registry.setAddressFor(CeloContractName.GoldToken, goldToken.address)

    uniswapFeeHandlerSeller = await UniswapFeeHandlerSeller.new(true)
  })

  describe('#setRouter()', () => {
    it('sets pool for exchange', async () => {
      await uniswapFeeHandlerSeller.setRouter(addressA, addressB)
      assert((await uniswapFeeHandlerSeller.getRoutersForToken(addressA))[0], addressB)
    })

    it('only owner can setRouter', async () => {
      await assertTransactionRevertWithReason(
        uniswapFeeHandlerSeller.setRouter(addressA, addressB, { from: user }),
        'Ownable: caller is not the owner'
      )
    })

    it("Can't set address zero", async () => {
      await assertTransactionRevertWithReason(
        uniswapFeeHandlerSeller.setRouter(addressA, '0x0000000000000000000000000000000000000000'),
        "Router can't be address zero."
      )
    })

    it("Can't add more than 4 routers", async () => {
      await uniswapFeeHandlerSeller.setRouter(addressA, addressB)
      await uniswapFeeHandlerSeller.setRouter(addressA, accounts[1])
      await uniswapFeeHandlerSeller.setRouter(addressA, accounts[2])
      await assertTransactionRevertWithReason(
        uniswapFeeHandlerSeller.setRouter(addressA, accounts[4]),
        'Max number of routers reached.'
      )
    })
  })

  describe('#removeRouter()', () => {
    beforeEach(async () => {
      await uniswapFeeHandlerSeller.setRouter(addressA, addressB)
    })

    it('removes a token', async () => {
      await uniswapFeeHandlerSeller.removeRouter(addressA, addressB)
      expect((await uniswapFeeHandlerSeller.getRoutersForToken(addressA)).toString()).to.equal(
        [].toString()
      )
    })

    it('removes when list is big', async () => {
      await uniswapFeeHandlerSeller.setRouter(addressA, addressD)
      await uniswapFeeHandlerSeller.setRouter(addressA, addressC)
      // list for token should be [uniswap, exchange, stabletoken]
      await uniswapFeeHandlerSeller.removeRouter(addressA, addressD)
      expect((await uniswapFeeHandlerSeller.getRoutersForToken(addressA)).toString()).to.equal(
        [addressB, addressC].toString()
      )
    })

    it('only owner can removeRouter', async () => {
      await assertTransactionRevertWithReason(
        uniswapFeeHandlerSeller.removeRouter(addressA, addressB, { from: user }),
        'Ownable: caller is not the owner.'
      )
    })
  })
})
