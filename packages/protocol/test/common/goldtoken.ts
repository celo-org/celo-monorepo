import {
  assertBalance,
  assertEqualBN,
  assertRevert,
  NULL_ADDRESS,
} from '@celo/protocol/lib/test-utils'
import { BigNumber } from 'bignumber.js'
import * as _ from 'lodash'
import { GoldTokenInstance } from 'types'

const GoldToken: Truffle.Contract<GoldTokenInstance> = artifacts.require('GoldToken')

// @ts-ignore
// TODO(mcortesi): Use BN
GoldToken.numberFormat = 'BigNumber'

contract('GoldToken', (accounts: string[]) => {
  let goldToken: GoldTokenInstance
  const ONE_GOLDTOKEN = new BigNumber('1000000000000000000')
  const sender = accounts[0]
  const receiver = accounts[1]

  beforeEach(async () => {
    goldToken = await GoldToken.new()
  })

  describe('#name()', () => {
    it('should have a name', async () => {
      const name: string = await goldToken.name()
      assert.equal(name, 'Celo Gold')
    })
  })

  describe('#symbol()', () => {
    it('should have a symbol', async () => {
      const name: string = await goldToken.symbol()
      assert.equal(name, 'cGLD')
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
      await assertRevert(goldToken.transfer(NULL_ADDRESS, ONE_GOLDTOKEN))
    })

    it('should not allow transferring more than the sender has', async () => {
      // We try to send four more gold tokens than the sender has, in case they happen to mine the
      // block with this transaction, which will reward them with 3 gold tokens.
      const value = web3.utils.toBN(
        (await goldToken.balanceOf(sender)).plus(ONE_GOLDTOKEN.times(4))
      )
      await assertRevert(goldToken.transfer(receiver, value))
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
      await assertRevert(
        goldToken.transferFrom(sender, NULL_ADDRESS, ONE_GOLDTOKEN, { from: receiver })
      )
    })

    it('should not allow transferring more than the sender has', async () => {
      // We try to send four more gold tokens than the sender has, in case they happen to mine the
      // block with this transaction, which will reward them with 3 gold tokens.
      const value = web3.utils.toBN(
        (await goldToken.balanceOf(sender)).plus(ONE_GOLDTOKEN.times(4))
      )
      await goldToken.approve(receiver, value)
      await assertRevert(goldToken.transferFrom(sender, receiver, value, { from: receiver }))
    })

    it('should not allow transferring more than the spender is allowed', async () => {
      await assertRevert(
        goldToken.transferFrom(sender, receiver, ONE_GOLDTOKEN.plus(1), {
          from: receiver,
        })
      )
    })
  })
})
