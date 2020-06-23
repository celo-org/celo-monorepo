import { CeloContractName } from '@celo/protocol/lib/registry-utils'
import {
  assertBalance,
  assertEqualBN,
  assertRevert,
  NULL_ADDRESS,
} from '@celo/protocol/lib/test-utils'
import { BigNumber } from 'bignumber.js'
import * as _ from 'lodash'
import {
  FreezerContract,
  FreezerInstance,
  CeloTokenContract,
  CeloTokenInstance,
  RegistryContract,
  RegistryInstance,
} from 'types'

const Freezer: FreezerContract = artifacts.require('Freezer')
const CeloToken: CeloTokenContract = artifacts.require('CeloToken')
const Registry: RegistryContract = artifacts.require('Registry')

// @ts-ignore
// TODO(mcortesi): Use BN
CeloToken.numberFormat = 'BigNumber'

contract('CeloToken', (accounts: string[]) => {
  let freezer: FreezerInstance
  let celoToken: CeloTokenInstance
  let registry: RegistryInstance
  const ONE_CELOTOKEN = new BigNumber('1000000000000000000')
  const TWO_CELOTOKEN = new BigNumber('2000000000000000000')
  const sender = accounts[0]
  const receiver = accounts[1]

  beforeEach(async () => {
    freezer = await Freezer.new()
    celoToken = await CeloToken.new()
    registry = await Registry.new()
    await registry.setAddressFor(CeloContractName.Freezer, freezer.address)
    await celoToken.initialize(registry.address)
  })

  describe('#name()', () => {
    it('should have a name', async () => {
      const name: string = await celoToken.name()
      assert.equal(name, 'Celo Gold')
    })
  })

  describe('#symbol()', () => {
    it('should have a symbol', async () => {
      const name: string = await celoToken.symbol()
      assert.equal(name, 'CELO')
    })
  })

  describe('#decimals()', () => {
    it('should have decimals', async () => {
      const decimals: BigNumber = await celoToken.decimals()
      assert.equal(decimals.toNumber(), 18)
    })
  })

  describe('#balanceOf()', () => {
    it('should match the balance returned by web3', async () => {
      assertEqualBN(await celoToken.balanceOf(receiver), await web3.eth.getBalance(receiver))
    })
  })

  describe('#approve()', () => {
    it('should set "allowed"', async () => {
      await celoToken.approve(receiver, ONE_CELOTOKEN)
      assert.equal((await celoToken.allowance(sender, receiver)).valueOf(), ONE_CELOTOKEN.valueOf())
    })
  })

  describe('#increaseAllowance()', () => {
    it('should increase "allowed"', async () => {
      await celoToken.increaseAllowance(receiver, ONE_CELOTOKEN)
      await celoToken.increaseAllowance(receiver, ONE_CELOTOKEN)
      assert.equal((await celoToken.allowance(sender, receiver)).valueOf(), TWO_CELOTOKEN.valueOf())
    })
  })

  describe('#decreaseAllowance()', () => {
    it('should decrease "allowed"', async () => {
      await celoToken.approve(receiver, TWO_CELOTOKEN)
      await celoToken.decreaseAllowance(receiver, ONE_CELOTOKEN)
      assert.equal((await celoToken.allowance(sender, receiver)).valueOf(), ONE_CELOTOKEN.valueOf())
    })
  })

  describe('#allowance()', () => {
    it('should return the allowance', async () => {
      await celoToken.approve(receiver, ONE_CELOTOKEN)
      assert.equal((await celoToken.allowance(sender, receiver)).valueOf(), ONE_CELOTOKEN.valueOf())
    })
  })

  describe('#transfer()', () => {
    it('should transfer balance from one user to another', async () => {
      const startBalanceFrom = await celoToken.balanceOf(sender)
      const startBalanceTo = await celoToken.balanceOf(receiver)
      await celoToken.transfer(receiver, ONE_CELOTOKEN)
      await assertBalance(sender, startBalanceFrom.minus(ONE_CELOTOKEN))
      await assertBalance(receiver, startBalanceTo.plus(ONE_CELOTOKEN))
    })

    it('should transfer balance with a comment', async () => {
      const comment = 'tacos at lunch'
      const startBalanceFrom = await celoToken.balanceOf(sender)
      const startBalanceTo = await celoToken.balanceOf(receiver)
      const res = await celoToken.transferWithComment(receiver, ONE_CELOTOKEN, comment)
      const transferEvent = _.find(res.logs, { event: 'Transfer' })
      const transferCommentEvent = _.find(res.logs, { event: 'TransferComment' })
      assert.exists(transferEvent)
      assert.equal(transferCommentEvent.args.comment, comment)
      await assertBalance(sender, startBalanceFrom.minus(ONE_CELOTOKEN))
      await assertBalance(receiver, startBalanceTo.plus(ONE_CELOTOKEN))
    })

    it('should not allow transferring to the null address', async () => {
      await assertRevert(celoToken.transfer(NULL_ADDRESS, ONE_CELOTOKEN))
    })

    it('should not allow transferring more than the sender has', async () => {
      // We try to send four more gold tokens than the sender has, in case they happen to mine the
      // block with this transaction, which will reward them with 3 gold tokens.
      const value = web3.utils.toBN(
        (await celoToken.balanceOf(sender)).plus(ONE_CELOTOKEN.times(4))
      )
      await assertRevert(celoToken.transfer(receiver, value))
    })
  })

  describe('#transferFrom()', () => {
    beforeEach(async () => {
      await celoToken.approve(receiver, ONE_CELOTOKEN)
    })

    it('should transfer balance from one user to another', async () => {
      const startBalanceFrom = await celoToken.balanceOf(sender)
      const startBalanceTo = await celoToken.balanceOf(receiver)
      await celoToken.transferFrom(sender, receiver, ONE_CELOTOKEN, { from: receiver })
      await assertBalance(sender, startBalanceFrom.minus(ONE_CELOTOKEN))
      await assertBalance(receiver, startBalanceTo.plus(ONE_CELOTOKEN))
    })

    it('should not allow transferring to the null address', async () => {
      await assertRevert(
        celoToken.transferFrom(sender, NULL_ADDRESS, ONE_CELOTOKEN, { from: receiver })
      )
    })

    it('should not allow transferring more than the sender has', async () => {
      // We try to send four more gold tokens than the sender has, in case they happen to mine the
      // block with this transaction, which will reward them with 3 gold tokens.
      const value = web3.utils.toBN(
        (await celoToken.balanceOf(sender)).plus(ONE_CELOTOKEN.times(4))
      )
      await celoToken.approve(receiver, value)
      await assertRevert(celoToken.transferFrom(sender, receiver, value, { from: receiver }))
    })

    it('should not allow transferring more than the spender is allowed', async () => {
      await assertRevert(
        celoToken.transferFrom(sender, receiver, ONE_CELOTOKEN.plus(1), {
          from: receiver,
        })
      )
    })
  })
})
