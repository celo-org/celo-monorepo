import {
  assertEqualBN,
  isSameAddress,
  stripHexEncoding,
  timeTravel,
} from '@celo/protocol/lib/test-utils'
import { getDeployedProxiedContract } from '@celo/protocol/lib/web3-utils'
import { config } from '@celo/protocol/migrationsConfig'
import BigNumber from 'bignumber.js'
import {
  ExchangeInstance,
  GoldTokenInstance,
  GovernanceInstance,
  LockedGoldInstance,
  RegistryInstance,
  ReserveInstance,
  StableTokenInstance,
} from 'types'

enum VoteValue {
  None = 0,
  Abstain,
  No,
  Yes,
}

contract('Integration: Governance', (accounts: string[]) => {
  const proposalId = 1
  const dequeuedIndex = 0
  let lockedGold: LockedGoldInstance
  let governance: GovernanceInstance
  let registry: RegistryInstance
  let proposalTransactions: any
  let weight: BigNumber

  before(async () => {
    lockedGold = await getDeployedProxiedContract('LockedGold', artifacts)
    governance = await getDeployedProxiedContract('Governance', artifacts)
    registry = await getDeployedProxiedContract('Registry', artifacts)
    // Set up a LockedGold account with which we can vote.
    await lockedGold.createAccount()
    const noticePeriod = 60 * 60 * 24 // 1 day
    const value = new BigNumber('1000000000000000000')
    // @ts-ignore
    await lockedGold.newCommitment(noticePeriod, { value })
    weight = await lockedGold.getAccountWeight(accounts[0])
    proposalTransactions = [
      {
        value: 0,
        destination: registry.address,
        data: Buffer.from(
          stripHexEncoding(
            // @ts-ignore
            registry.contract.methods.setAddressFor('test1', accounts[1]).encodeABI()
          ),
          'hex'
        ),
      },
      {
        value: 0,
        destination: registry.address,
        data: Buffer.from(
          stripHexEncoding(
            // @ts-ignore
            registry.contract.methods.setAddressFor('test2', accounts[2]).encodeABI()
          ),
          'hex'
        ),
      },
    ]
  })

  describe('When making a governance proposal', async () => {
    before(async () => {
      await governance.propose(
        proposalTransactions.map((x: any) => x.value),
        proposalTransactions.map((x: any) => x.destination),
        // @ts-ignore
        Buffer.concat(proposalTransactions.map((x: any) => x.data)),
        proposalTransactions.map((x: any) => x.data.length),
        // @ts-ignore: TODO(mcortesi) fix typings for TransactionDetails
        { value: web3.utils.toWei(config.governance.minDeposit.toString(), 'ether') }
      )
    })

    it('should increment the proposal count', async () => {
      assert.equal((await governance.proposalCount()).toNumber(), proposalId)
    })
  })

  describe('When upvoting that proposal', async () => {
    before(async () => {
      await governance.upvote(proposalId, 0, 0)
    })

    it('should increase the number of upvotes for the proposal', async () => {
      assertEqualBN(await governance.getUpvotes(proposalId), weight)
    })
  })

  describe('When approving that proposal', async () => {
    before(async () => {
      await timeTravel(config.governance.dequeueFrequency, web3)
      await governance.approve(proposalId, dequeuedIndex)
    })

    it('should set the proposal to approved', async () => {
      assert.isTrue(await governance.isApproved(proposalId))
    })
  })

  describe('When voting on that proposal', async () => {
    before(async () => {
      await timeTravel(config.governance.approvalStageDuration, web3)
      await governance.vote(proposalId, dequeuedIndex, VoteValue.Yes)
    })

    it('should increment the vote totals', async () => {
      const [yes, ,] = await governance.getVoteTotals(proposalId)
      assertEqualBN(yes, weight)
    })
  })

  describe('When executing that proposal', async () => {
    before(async () => {
      await timeTravel(config.governance.referendumStageDuration, web3)
      await governance.execute(proposalId, dequeuedIndex)
    })

    it('should execute the proposal', async () => {
      assert.equal(await registry.getAddressForOrDie(web3.utils.soliditySha3('test1')), accounts[1])
      assert.equal(await registry.getAddressForOrDie(web3.utils.soliditySha3('test2')), accounts[2])
    })
  })
})

contract('Integration: Exchange', (accounts: string[]) => {
  const sellAmount = new BigNumber('1000000000000000000')
  const minBuyAmount = 1
  let exchange: ExchangeInstance
  let reserve: ReserveInstance
  let goldToken: GoldTokenInstance
  let stableToken: StableTokenInstance
  let originalStable
  let originalGold
  let originalReserve

  const decimals = 18

  before(async () => {
    exchange = await getDeployedProxiedContract('Exchange', artifacts)
    reserve = await getDeployedProxiedContract('Reserve', artifacts)
    goldToken = await getDeployedProxiedContract('GoldToken', artifacts)
    stableToken = await getDeployedProxiedContract('StableToken', artifacts)
  })

  describe('When selling gold', () => {
    beforeEach(async () => {
      await goldToken.approve(exchange.address, sellAmount)
      originalStable = await stableToken.balanceOf(accounts[0])
      originalGold = await goldToken.balanceOf(accounts[0])
      originalReserve = await goldToken.balanceOf(reserve.address)
    })

    it(`should increase user's stable`, async () => {
      await exchange.exchange(sellAmount, minBuyAmount, true)
      const finalStable = await stableToken.balanceOf(accounts[0])

      assert.isTrue(finalStable.gt(originalStable))
    })

    it(`should reduce user's gold`, async () => {
      await exchange.exchange(sellAmount, minBuyAmount, true)
      const finalGold = await goldToken.balanceOf(accounts[0])

      const block = await web3.eth.getBlock('latest')
      if (isSameAddress(block.miner, accounts[0])) {
        const blockReward = new BigNumber(2).times(new BigNumber(10).pow(decimals))
        assert.isTrue(finalGold.lt(originalGold.plus(blockReward)))
      } else {
        assert.isTrue(finalGold.lt(originalGold))
      }
    })

    it(`should increase Reserve's gold`, async () => {
      await exchange.exchange(sellAmount, minBuyAmount, true)
      const finalReserve = await goldToken.balanceOf(reserve.address)

      assert.isTrue(finalReserve.gt(originalReserve))
    })
  })

  describe('When selling stable token', () => {
    beforeEach(async () => {
      originalStable = await stableToken.balanceOf(accounts[0])
      originalGold = await goldToken.balanceOf(accounts[0])
      originalReserve = await goldToken.balanceOf(reserve.address)
      await stableToken.approve(exchange.address, sellAmount)
    })

    it(`should reduce user's stable`, async () => {
      await exchange.exchange(sellAmount, minBuyAmount, false)
      const finalStable = await stableToken.balanceOf(accounts[0])

      assert.isTrue(finalStable.lt(originalStable))
    })

    it(`should increase user's gold`, async () => {
      await exchange.exchange(sellAmount, minBuyAmount, false)
      const finalGold = await goldToken.balanceOf(accounts[0])

      assert.isTrue(finalGold.gt(originalGold))
    })

    it(`should reduce Reserve's gold`, async () => {
      await exchange.exchange(sellAmount, minBuyAmount, false)
      const finalReserve = await goldToken.balanceOf(reserve.address)

      assert.isTrue(finalReserve.lt(originalReserve))
    })
  })
})
