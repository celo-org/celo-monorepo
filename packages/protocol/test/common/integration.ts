import { constitution } from '@celo/protocol/governanceConstitution'
import {
  assertEqualBN,
  isSameAddress,
  stripHexEncoding,
  timeTravel,
} from '@celo/protocol/lib/test-utils'
import {
  getDeployedProxiedContract,
  getFunctionSelectorsForContract,
} from '@celo/protocol/lib/web3-utils'
import { config } from '@celo/protocol/migrationsConfig'
import { linkedListChanges, zip } from '@celo/utils/lib/collections'
import { toFixed } from '@celo/utils/lib/fixidity'
import BigNumber from 'bignumber.js'
import {
  ElectionInstance,
  ExchangeInstance,
  GoldTokenInstance,
  GovernanceApproverMultiSigInstance,
  GovernanceInstance,
  GovernanceSlasherInstance,
  LockedGoldInstance,
  RegistryInstance,
  ReserveInstance,
  ReserveSpenderMultiSigInstance,
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
  for (let i = groups.length - 1; i >= 0; i--) {
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

contract('Integration: Running elections', (_accounts: string[]) => {
  let election: ElectionInstance

  before(async () => {
    election = await getDeployedProxiedContract('Election', artifacts)
  })

  describe('When getting the elected validators', () => {
    it('should elect all 30 validators', async () => {
      const elected = await election.electValidatorSigners()
      assert.equal(elected.length, 30)
    })
    it('should elect specified number validators with electNValidatorSigners', async () => {
      const elected = await election.electNValidatorSigners(1, 20)
      assert.equal(elected.length, 20)
    })
  })
})

contract('Integration: Governance slashing', (accounts: string[]) => {
  const proposalId = 1
  const dequeuedIndex = 0
  let lockedGold: LockedGoldInstance
  let election: ElectionInstance
  let multiSig: GovernanceApproverMultiSigInstance
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

    multiSig = await getDeployedProxiedContract('GovernanceApproverMultiSig', artifacts)
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
        'URL',
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
      // @ts-ignore
      const txData = governance.contract.methods.approve(proposalId, dequeuedIndex).encodeABI()
      await multiSig.submitTransaction(governance.address, 0, txData, {
        from: accounts[0],
      })
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
  let multiSig: GovernanceApproverMultiSigInstance
  let governance: GovernanceInstance
  let registry: RegistryInstance
  let proposalTransactions: any
  let value: BigNumber

  before(async () => {
    lockedGold = await getDeployedProxiedContract('LockedGold', artifacts)
    // @ts-ignore
    await lockedGold.lock({ value: '10000000000000000000000000' })
    value = await lockedGold.getAccountTotalLockedGold(accounts[0])
    multiSig = await getDeployedProxiedContract('GovernanceApproverMultiSig', artifacts)
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

  describe('Checking governance thresholds', () => {
    for (const contractName of Object.keys(constitution).filter((k) => k !== 'proxy')) {
      it('should have correct thresholds for ' + contractName, async () => {
        const contract: any = await getDeployedProxiedContract<Truffle.ContractInstance>(
          contractName,
          artifacts
        )

        const selectors = getFunctionSelectorsForContract(contract, contractName, artifacts)
        selectors.default = ['0x00000000']

        const thresholds = { ...constitution.proxy, ...constitution[contractName] }
        await Promise.all(
          Object.keys(thresholds).map((func) =>
            Promise.all(
              selectors[func].map(async (selector) => {
                assertEqualBN(
                  await governance.getConstitution(contract.address, selector),
                  toFixed(thresholds[func]),
                  'Threshold set incorrectly for function ' + func
                )
              })
            )
          )
        )
      })
    }
  })

  describe('When making a governance proposal', () => {
    before(async () => {
      await governance.propose(
        proposalTransactions.map((x: any) => x.value),
        proposalTransactions.map((x: any) => x.destination),
        // @ts-ignore
        Buffer.concat(proposalTransactions.map((x: any) => x.data)),
        proposalTransactions.map((x: any) => x.data.length),
        'URL',
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
      // @ts-ignore
      const txData = governance.contract.methods.approve(proposalId, dequeuedIndex).encodeABI()
      await multiSig.submitTransaction(governance.address, 0, txData, {
        from: accounts[0],
      })
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
  const transferAmount = 10
  let exchange: ExchangeInstance
  let multiSig: ReserveSpenderMultiSigInstance
  let reserve: ReserveInstance
  let goldToken: GoldTokenInstance
  let stableToken: StableTokenInstance
  let originalStable
  let originalGold
  let originalReserve
  let finalStable: BigNumber
  let finalGold: BigNumber
  let finalReserve: BigNumber

  const decimals = 18

  before(async () => {
    exchange = await getDeployedProxiedContract('Exchange', artifacts)
    multiSig = await getDeployedProxiedContract('ReserveSpenderMultiSig', artifacts)
    reserve = await getDeployedProxiedContract('Reserve', artifacts)
    goldToken = await getDeployedProxiedContract('GoldToken', artifacts)
    stableToken = await getDeployedProxiedContract('StableToken', artifacts)
  })

  describe('When selling gold', () => {
    before(async () => {
      originalStable = await stableToken.balanceOf(accounts[0])
      originalGold = await goldToken.balanceOf(accounts[0])
      originalReserve = await goldToken.balanceOf(reserve.address)
      await goldToken.approve(exchange.address, sellAmount)
      await exchange.exchange(sellAmount, minBuyAmount, true)
      finalStable = await stableToken.balanceOf(accounts[0])
      finalGold = await goldToken.balanceOf(accounts[0])
      finalReserve = await goldToken.balanceOf(reserve.address)
    })

    it(`should increase user's stable`, async () => {
      assert.isTrue(finalStable.gt(originalStable))
    })

    it(`should reduce user's gold`, async () => {
      const block = await web3.eth.getBlock('latest')
      if (isSameAddress(block.miner, accounts[0])) {
        const blockReward = new BigNumber(2).times(new BigNumber(10).pow(decimals))
        assert.isTrue(finalGold.lt(originalGold.plus(blockReward)))
      } else {
        assert.isTrue(finalGold.lt(originalGold))
      }
    })

    it(`should increase Reserve's gold`, async () => {
      assert.isTrue(finalReserve.gt(originalReserve))
    })
  })

  // Note that this test relies on having purchased cUSD in the previous test.
  describe('When selling stable token', () => {
    before(async () => {
      originalStable = await stableToken.balanceOf(accounts[0])
      originalGold = await goldToken.balanceOf(accounts[0])
      originalReserve = await goldToken.balanceOf(reserve.address)
      await stableToken.approve(exchange.address, sellAmount)
      // Cannot sell more than was purchased in the previous test.
      await exchange.exchange(sellAmount.div(20), minBuyAmount, false)
      finalStable = await stableToken.balanceOf(accounts[0])
      finalGold = await goldToken.balanceOf(accounts[0])
      finalReserve = await goldToken.balanceOf(reserve.address)
    })

    it(`should reduce user's stable`, async () => {
      assert.isTrue(finalStable.lt(originalStable))
    })

    it(`should increase user's gold`, async () => {
      assert.isTrue(finalGold.gt(originalGold))
    })

    it(`should reduce Reserve's gold`, async () => {
      assert.isTrue(finalReserve.lt(originalReserve))
    })
  })

  describe('When transferring gold', () => {
    const otherReserveAddress = '0x7457d5E02197480Db681D3fdF256c7acA21bDc12'
    let originalOtherAccount
    beforeEach(async () => {
      originalReserve = await goldToken.balanceOf(reserve.address)
      originalOtherAccount = await goldToken.balanceOf(otherReserveAddress)
    })

    it(`should transfer gold`, async () => {
      // @ts-ignore
      const txData = reserve.contract.methods
        .transferGold(otherReserveAddress, transferAmount)
        .encodeABI()
      await multiSig.submitTransaction(reserve.address, 0, txData, {
        from: accounts[0],
      })
      assert.isTrue(
        (await goldToken.balanceOf(reserve.address)).isEqualTo(
          originalReserve.minus(transferAmount)
        )
      )
      assert.isTrue(
        (await goldToken.balanceOf(otherReserveAddress)).isEqualTo(
          originalOtherAccount.plus(transferAmount)
        )
      )
    })
  })
})
