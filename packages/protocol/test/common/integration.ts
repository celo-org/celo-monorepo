import {
  assertEqualBN,
  isSameAddress,
  stripHexEncoding,
  timeTravel,
} from '@celo/protocol/lib/test-utils'
import { getDeployedProxiedContract } from '@celo/protocol/lib/web3-utils'
import { config } from '@celo/protocol/migrationsConfig'
import { linkedListChanges, zip } from '@celo/utils/lib/collections'
import BigNumber from 'bignumber.js'
import {
  ElectionInstance,
  ExchangeInstance,
  GoldTokenInstance,
  GovernanceInstance,
  GovernanceSlasherInstance,
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

async function getGroups(election: ElectionInstance) {
  const [lst1, lst2] = await election.getTotalVotesForEligibleValidatorGroups()
  return zip(
    (address, value) => {
      return { address, value }
    },
    lst1,
    lst2
  )
}

// Returns how much voting gold will be decremented from the groups voted by an account
async function slashingOfGroups(
  account: string,
  penalty: BigNumber,
  lockedGold: LockedGoldInstance,
  election: ElectionInstance
) {
  // first check how much voting gold has to be slashed
  const nonVoting = await lockedGold.getAccountNonvotingLockedGold(account)
  if (penalty.isLessThan(nonVoting)) {
    return []
  }
  let difference = penalty.minus(nonVoting)
  // find voted groups
  const groups = await election.getGroupsVotedForByAccount(account)
  const res = []
  //
  for (let i = groups.length - 1; i >= 0; i++) {
    const group = groups[i]
    const totalVotes = await election.getTotalVotesForGroup(group)
    const votes = await election.getTotalVotesForGroupByAccount(group, account)
    const slashedVotes = votes.lt(difference) ? votes : difference
    res.push({ address: group, value: totalVotes.minus(slashedVotes), index: i })
    difference = difference.minus(slashedVotes)
    if (difference.eq(new BigNumber(0))) {
      break
    }
  }
  return res
}

async function findLessersAndGreaters(
  account: string,
  penalty: BigNumber,
  lockedGold: LockedGoldInstance,
  election: ElectionInstance
) {
  const groups = await getGroups(election)
  const changed = await slashingOfGroups(account, penalty, lockedGold, election)
  const changes = linkedListChanges(groups, changed)
  return { ...changes, indices: changed.map((a) => a.index) }
}

contract('Integration: Governance slashing', (accounts: string[]) => {
  const proposalId = 1
  const dequeuedIndex = 0
  let lockedGold: LockedGoldInstance
  let election: ElectionInstance
  let governance: GovernanceInstance
  let governanceSlasher: GovernanceSlasherInstance
  let proposalTransactions: any
  let value: BigNumber
  let valueOfSlashed: BigNumber
  const penalty = new BigNumber('100')
  const slashedAccount = accounts[9]

  before(async () => {
    lockedGold = await getDeployedProxiedContract('LockedGold', artifacts)
    election = await getDeployedProxiedContract('Election', artifacts)
    // @ts-ignore
    await lockedGold.lock({ value: '10000000000000000000000000' })

    governance = await getDeployedProxiedContract('Governance', artifacts)
    governanceSlasher = await getDeployedProxiedContract('GovernanceSlasher', artifacts)
    value = await lockedGold.getAccountTotalLockedGold(accounts[0])

    proposalTransactions = [
      {
        value: 0,
        destination: governanceSlasher.address,
        data: Buffer.from(
          stripHexEncoding(
            // @ts-ignore
            governanceSlasher.contract.methods.approveSlashing(slashedAccount, 100).encodeABI()
          ),
          'hex'
        ),
      },
    ]
  })

  describe('When making a governance proposal', () => {
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

  describe('When upvoting that proposal', () => {
    before(async () => {
      await governance.upvote(proposalId, 0, 0)
    })

    it('should increase the number of upvotes for the proposal', async () => {
      assertEqualBN(await governance.getUpvotes(proposalId), value)
    })
  })

  describe('When approving that proposal', () => {
    before(async () => {
      await timeTravel(config.governance.dequeueFrequency, web3)
      await governance.approve(proposalId, dequeuedIndex)
    })

    it('should set the proposal to approved', async () => {
      assert.isTrue(await governance.isApproved(proposalId))
    })
  })

  describe('When voting on that proposal', () => {
    before(async () => {
      await timeTravel(config.governance.approvalStageDuration, web3)
      await governance.vote(proposalId, dequeuedIndex, VoteValue.Yes)
    })

    it('should increment the vote totals', async () => {
      const [yes, ,] = await governance.getVoteTotals(proposalId)
      assertEqualBN(yes, value)
    })
  })

  describe('When executing that proposal', () => {
    before(async () => {
      await timeTravel(config.governance.referendumStageDuration, web3)
      await governance.execute(proposalId, dequeuedIndex)
    })

    it('should execute the proposal', async () => {
      assertEqualBN(await governanceSlasher.getApprovedSlashing(slashedAccount), penalty)
    })
  })

  describe('When performing slashing', () => {
    before(async () => {
      await timeTravel(config.governance.referendumStageDuration, web3)
      valueOfSlashed = await lockedGold.getAccountTotalLockedGold(slashedAccount)
      const { lessers, greaters, indices } = await findLessersAndGreaters(
        slashedAccount,
        penalty,
        lockedGold,
        election
      )
      await governanceSlasher.slash(slashedAccount, lessers, greaters, indices)
    })

    it('should set approved slashing to zero', async () => {
      assert.equal((await governanceSlasher.getApprovedSlashing(slashedAccount)).toNumber(), 0)
    })

    it('should slash the account', async () => {
      assertEqualBN(
        await lockedGold.getAccountTotalLockedGold(slashedAccount),
        valueOfSlashed.minus(penalty)
      )
    })
  })
})

contract('Integration: Governance', (accounts: string[]) => {
  const proposalId = 1
  const dequeuedIndex = 0
  let lockedGold: LockedGoldInstance
  let governance: GovernanceInstance
  let registry: RegistryInstance
  let proposalTransactions: any
  let value: BigNumber

  before(async () => {
    lockedGold = await getDeployedProxiedContract('LockedGold', artifacts)
    // @ts-ignore
    await lockedGold.lock({ value: '10000000000000000000000000' })
    value = await lockedGold.getAccountTotalLockedGold(accounts[0])
    governance = await getDeployedProxiedContract('Governance', artifacts)
    registry = await getDeployedProxiedContract('Registry', artifacts)
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

  describe('When making a governance proposal', () => {
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

  describe('When upvoting that proposal', () => {
    before(async () => {
      await governance.upvote(proposalId, 0, 0)
    })

    it('should increase the number of upvotes for the proposal', async () => {
      assertEqualBN(await governance.getUpvotes(proposalId), value)
    })
  })

  describe('When approving that proposal', () => {
    before(async () => {
      await timeTravel(config.governance.dequeueFrequency, web3)
      await governance.approve(proposalId, dequeuedIndex)
    })

    it('should set the proposal to approved', async () => {
      assert.isTrue(await governance.isApproved(proposalId))
    })
  })

  describe('When voting on that proposal', () => {
    before(async () => {
      await timeTravel(config.governance.approvalStageDuration, web3)
      await governance.vote(proposalId, dequeuedIndex, VoteValue.Yes)
    })

    it('should increment the vote totals', async () => {
      const [yes, ,] = await governance.getVoteTotals(proposalId)
      assertEqualBN(yes, value)
    })
  })

  describe('When executing that proposal', () => {
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
    await exchange.unfreeze()
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
