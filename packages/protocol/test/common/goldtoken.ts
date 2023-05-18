import { NULL_ADDRESS } from '@celo/base/lib/address'
import { CeloContractName } from '@celo/protocol/lib/registry-utils'
import { assertBalance, assertEqualBN, assertRevertWithReason } from '@celo/protocol/lib/test-utils'
import { BigNumber } from 'bignumber.js'
import _ from 'lodash'
import {
  FreezerContract,
  FreezerInstance,
  GoldTokenContract,
  GoldTokenInstance,
  MockGoldTokenContract,
  MockGoldTokenInstance,
  RegistryContract,
  RegistryInstance,
} from 'types'

const Freezer: FreezerContract = artifacts.require('Freezer')
const GoldToken: GoldTokenContract = artifacts.require('GoldToken')
const Registry: RegistryContract = artifacts.require('Registry')
const MockGoldToken: MockGoldTokenContract = artifacts.require('MockGoldToken')

// @ts-ignore
// TODO(mcortesi): Use BN
GoldToken.numberFormat = 'BigNumber'

contract('GoldToken', (accounts: string[]) => {
  let freezer: FreezerInstance
  let goldToken: GoldTokenInstance
  let registry: RegistryInstance
  const ONE_GOLDTOKEN = new BigNumber('1000000000000000000')
  const TWO_GOLDTOKEN = new BigNumber('2000000000000000000')
  const burnAddress = '0x000000000000000000000000000000000000dEaD'

  const sender = accounts[0]
  const receiver = accounts[1]

  beforeEach(async () => {
    freezer = await Freezer.new(true)
    goldToken = await GoldToken.new(true)
    registry = await Registry.new(true)
    await registry.setAddressFor(CeloContractName.Freezer, freezer.address)
    await goldToken.initialize(registry.address)
  })

  describe('#name()', () => {
    it('should have a name', async () => {
      const name: string = await goldToken.name()
      assert.equal(name, 'Celo native asset')
    })
  })

  describe('#symbol()', () => {
    it('should have a symbol', async () => {
      const name: string = await goldToken.symbol()
      assert.equal(name, 'CELO')
    })
  })

  describe('#burn()', () => {
    let startBurn: BigNumber

    beforeEach(async () => {
      startBurn = await goldToken.getBurnedAmount()
    })

    it('burn address starts with zero balance', async () => {
      assertEqualBN(await goldToken.balanceOf(burnAddress), 0)
    })

    it('burn starts as start burn amount', async () => {
      assertEqualBN(await goldToken.getBurnedAmount(), startBurn)
    })

    it('Burned amount equals the balance of the burn address', async () => {
      assertEqualBN(await goldToken.getBurnedAmount(), await goldToken.balanceOf(burnAddress))
    })

    it('returns right burned amount', async () => {
      await goldToken.burn(ONE_GOLDTOKEN)

      assertEqualBN(await goldToken.getBurnedAmount(), ONE_GOLDTOKEN.plus(startBurn))
    })
  })

  describe('#circulatingSupply()', () => {
    let mockGoldToken: MockGoldTokenInstance

    beforeEach(async () => {
      mockGoldToken = await MockGoldToken.new()
      // set supply to 1K
      await mockGoldToken.setTotalSupply(ONE_GOLDTOKEN.multipliedBy(1000))
    })

    it('matches circulatingSupply() when there was no burn', async () => {
      assertEqualBN(await mockGoldToken.circulatingSupply(), await mockGoldToken.totalSupply())
    })

    it('decreases when there was a burn', async () => {
      // mock a burn
      await mockGoldToken.setBalanceOf(burnAddress, ONE_GOLDTOKEN)

      const circulatingSupply = await mockGoldToken.circulatingSupply()
      // circulatingSupply got reduced to 999 after burning 1 Celo
      assertEqualBN(circulatingSupply, ONE_GOLDTOKEN.multipliedBy(999))
      assertEqualBN(
        circulatingSupply,
        new BigNumber(await mockGoldToken.totalSupply()).plus(ONE_GOLDTOKEN.multipliedBy(-1))
      )
    })
  })

  describe('#decimals()', () => {
    it('should have decimals', async () => {
      const decimals: BigNumber = await goldToken.decimals()
      assert.equal(decimals.toNumber(), 18)
    })
  })

  describe('#balanceOf()', () => {
    it('should match the balance returned by web3', async () => {
      assertEqualBN(await goldToken.balanceOf(receiver), await web3.eth.getBalance(receiver))
    })
  })

  describe('#approve()', () => {
    it('should set "allowed"', async () => {
      await goldToken.approve(receiver, ONE_GOLDTOKEN)
      assert.equal((await goldToken.allowance(sender, receiver)).valueOf(), ONE_GOLDTOKEN.valueOf())
    })
  })

  describe('#increaseAllowance()', () => {
    it('should increase "allowed"', async () => {
      await goldToken.increaseAllowance(receiver, ONE_GOLDTOKEN)
      await goldToken.increaseAllowance(receiver, ONE_GOLDTOKEN)
      assert.equal((await goldToken.allowance(sender, receiver)).valueOf(), TWO_GOLDTOKEN.valueOf())
    })
  })

  describe('#decreaseAllowance()', () => {
    it('should decrease "allowed"', async () => {
      await goldToken.approve(receiver, TWO_GOLDTOKEN)
      await goldToken.decreaseAllowance(receiver, ONE_GOLDTOKEN)
      assert.equal((await goldToken.allowance(sender, receiver)).valueOf(), ONE_GOLDTOKEN.valueOf())
    })
  })

  describe('#allowance()', () => {
    it('should return the allowance', async () => {
      await goldToken.approve(receiver, ONE_GOLDTOKEN)
      assert.equal((await goldToken.allowance(sender, receiver)).valueOf(), ONE_GOLDTOKEN.valueOf())
    })
  })

  describe('#transfer()', () => {
    it('should transfer balance from one user to another', async () => {
      const startBalanceFrom = await goldToken.balanceOf(sender)
      const startBalanceTo = await goldToken.balanceOf(receiver)
      await goldToken.transfer(receiver, ONE_GOLDTOKEN)
      await assertBalance(sender, startBalanceFrom.minus(ONE_GOLDTOKEN))
      await assertBalance(receiver, startBalanceTo.plus(ONE_GOLDTOKEN))
    })

    it('should transfer balance with a comment', async () => {
      const comment = 'tacos at lunch'
      const startBalanceFrom = await goldToken.balanceOf(sender)
      const startBalanceTo = await goldToken.balanceOf(receiver)
      const res = await goldToken.transferWithComment(receiver, ONE_GOLDTOKEN, comment)
      const transferEvent = _.find(res.logs, { event: 'Transfer' })
      const transferCommentEvent = _.find(res.logs, { event: 'TransferComment' })
      assert.exists(transferEvent)
      assert.equal(transferCommentEvent.args.comment, comment)
      await assertBalance(sender, startBalanceFrom.minus(ONE_GOLDTOKEN))
      await assertBalance(receiver, startBalanceTo.plus(ONE_GOLDTOKEN))
    })

    it('should not allow transferring to the null address', async () => {
      await assertRevertWithReason(
        goldToken.transfer(NULL_ADDRESS, ONE_GOLDTOKEN, { gasPrice: 0 }),
        'transfer attempted to reserved address 0x0'
      )
    })

    it('should not allow transferring more than the sender has', async () => {
      // We try to send four more gold tokens than the sender has, in case they happen to mine the
      // block with this transaction, which will reward them with 3 gold tokens.
      const value = web3.utils.toBN(
        (await goldToken.balanceOf(sender)).plus(ONE_GOLDTOKEN.times(4))
      )
      await assertRevertWithReason(
        goldToken.transfer(receiver, value),
        'transfer value exceeded balance of sender'
      )
    })
  })

  describe('#transferFrom()', () => {
    beforeEach(async () => {
      await goldToken.approve(receiver, ONE_GOLDTOKEN)
    })

    it('should transfer balance from one user to another', async () => {
      const startBalanceFrom = await goldToken.balanceOf(sender)
      const startBalanceTo = await goldToken.balanceOf(receiver)
      await goldToken.transferFrom(sender, receiver, ONE_GOLDTOKEN, { from: receiver })
      await assertBalance(sender, startBalanceFrom.minus(ONE_GOLDTOKEN))
      await assertBalance(receiver, startBalanceTo.plus(ONE_GOLDTOKEN))
    })

    it('should not allow transferring to the null address', async () => {
      await assertRevertWithReason(
        goldToken.transferFrom(sender, NULL_ADDRESS, ONE_GOLDTOKEN, { from: receiver }),
        'transfer attempted to reserved address 0x0'
      )
    })

    it('should not allow transferring more than the sender has', async () => {
      // We try to send four more gold tokens than the sender has, in case they happen to mine the
      // block with this transaction, which will reward them with 3 gold tokens.
      const value = web3.utils.toBN(
        (await goldToken.balanceOf(sender)).plus(ONE_GOLDTOKEN.times(4))
      )
      await goldToken.approve(receiver, value)
      await assertRevertWithReason(
        goldToken.transferFrom(sender, receiver, value, { from: receiver }),
        'transfer value exceeded balance of sender'
      )
    })

    it('should not allow transferring more than the spender is allowed', async () => {
      await assertRevertWithReason(
        goldToken.transferFrom(sender, receiver, ONE_GOLDTOKEN.plus(1), {
          from: receiver,
        }),
        "transfer value exceeded sender's allowance for recipient"
      )
    })
  })
})
