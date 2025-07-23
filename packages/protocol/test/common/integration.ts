import { SOLIDITY_08_PACKAGE } from '@celo/protocol/contractPackages'
import {
  addressMinedLatestBlock,
  assertEqualBN,
  stripHexEncoding,
  timeTravel,
} from '@celo/protocol/lib/test-utils'
import { getDeployedProxiedContract } from '@celo/protocol/lib/web3-utils'
import { build_directory, config } from '@celo/protocol/migrationsConfig'
import { EpochManagerEnablerInstance, ValidatorsInstance } from '@celo/protocol/types/typechain-0.8'
import { linkedListChanges, zip } from '@celo/utils/lib/collections'
import BigNumber from 'bignumber.js'
import {
  ElectionInstance,
  GoldTokenInstance,
  GovernanceApproverMultiSigInstance,
  GovernanceInstance,
  GovernanceSlasherInstance,
  LockedGoldInstance,
} from 'types'
import {
  ExchangeInstance,
  ReserveInstance,
  ReserveSpenderMultiSigInstance,
  StableTokenInstance,
} from 'types/mento'
import { MENTO_PACKAGE } from '../../contractPackages'
import { ArtifactsSingleton } from '../../lib/artifactsSingleton'

const Artifactor = require('@truffle/artifactor')

enum VoteValue {
  None = 0,
  Abstain,
  No,
  Yes,
}

async function getGroups(election: ElectionInstance) {
  const response = await election.getTotalVotesForEligibleValidatorGroups()
  console.info('response', response)
  const lst1 = response[0]
  const lst2 = response[1]
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

// skipping this test, as it requires the L1 precompile to capture epoch before L2 migration.
// attempting to capture epoch is failing with `slicing out of range` error.
contract.skip('Integration: Governance slashing', (accounts: string[]) => {
  const proposalId = 1
  const dequeuedIndex = 0
  let lockedGold: LockedGoldInstance
  let election: ElectionInstance
  let validators: ValidatorsInstance
  let epochManagerEnabler: EpochManagerEnablerInstance
  let multiSig: GovernanceApproverMultiSigInstance
  let governance: GovernanceInstance
  let governanceSlasher: GovernanceSlasherInstance
  let proposalTransactions: any
  let value: BigNumber
  let valueOfSlashed: BigNumber
  const penalty = new BigNumber('100')
  const slashedAccount = accounts[9]

  before(async () => {
    const artifacts08 = ArtifactsSingleton.getInstance(SOLIDITY_08_PACKAGE, artifacts)
    lockedGold = await getDeployedProxiedContract('LockedGold', artifacts)
    election = await getDeployedProxiedContract('Election', artifacts)
    validators = await getDeployedProxiedContract('Validators', artifacts08)

    epochManagerEnabler = await getDeployedProxiedContract('EpochManagerEnabler', artifacts08)
    // @ts-ignore
    await lockedGold.lock({ value: '10000000000000000000000000' })

    multiSig = await getDeployedProxiedContract('GovernanceApproverMultiSig', artifacts)
    governance = await getDeployedProxiedContract('Governance', artifacts)
    governanceSlasher = await getDeployedProxiedContract('GovernanceSlasher', artifacts)
    value = await lockedGold.getAccountTotalLockedGold(accounts[0])

    await epochManagerEnabler.captureEpochAndValidators()

    // using the CalledByVm code to deploy to PROXY_ADMIN_ADDRESS to mock L2 on truffle.
    const ProxyAdminContract = artifacts.require('CalledByVm') as any
    await ProxyAdminContract.new({ from: accounts[0] }) // Deploy the contract

    const networkId = await web3.eth.net.getId()
    const artifact = ProxyAdminContract._json
    // Hack to create build artifact.

    artifact.networks[networkId] = {
      address: '0x4200000000000000000000000000000000000018',
      // @ts-ignore
      transactionHash: '0x',
    }
    const contractsDir = build_directory + '/contracts'
    const artifactor = new Artifactor(contractsDir)

    await artifactor.save(artifact)

    await epochManagerEnabler.initEpochManager()

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
      {
        value: 0,
        destination: governanceSlasher.address,
        data: Buffer.from(
          stripHexEncoding(
            // @ts-ignore
            governanceSlasher.contract.methods.setSlasherExecuter(accounts[0]).encodeABI()
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
      const response = await governance.getVoteTotals(proposalId)
      assertEqualBN(response[0], value)
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
      let group = await validators.getMembershipInLastEpochFromSigner(slashedAccount)

      await governanceSlasher.slash(slashedAccount, group, lessers, greaters, indices, {
        from: accounts[0],
      })
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

Array.from([
  ['Exchange', 'StableToken'], // USD
  ['ExchangeEUR', 'StableTokenEUR'], // EUR
  ['ExchangeBRL', 'StableTokenBRL'], // BRL (cREAL)
]).forEach(([exchangeId, stableTokenId]) =>
  contract(`Integration: ${exchangeId} ${stableTokenId}`, (accounts: string[]) => {
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
      exchange = await getDeployedProxiedContract(
        exchangeId,
        ArtifactsSingleton.getInstance(MENTO_PACKAGE)
      )
      stableToken = await getDeployedProxiedContract(
        stableTokenId,
        ArtifactsSingleton.getInstance(MENTO_PACKAGE)
      )
      multiSig = await getDeployedProxiedContract(
        'ReserveSpenderMultiSig',
        ArtifactsSingleton.getInstance(MENTO_PACKAGE)
      )
      reserve = await getDeployedProxiedContract(
        'Reserve',
        ArtifactsSingleton.getInstance(MENTO_PACKAGE)
      )
      goldToken = await getDeployedProxiedContract('GoldToken', artifacts)
    })

    describe('Selling', () => {
      const sellAmount = new BigNumber('1000000000000000000000')
      const minBuyAmount = 1

      describe('When selling gold', () => {
        before(async () => {
          originalStable = await stableToken.balanceOf(accounts[0])
          originalGold = await goldToken.balanceOf(accounts[0])
          originalReserve = await goldToken.balanceOf(reserve.address)
          await goldToken.approve(exchange.address, sellAmount)
          await exchange.sell(sellAmount, minBuyAmount, true)
          finalStable = await stableToken.balanceOf(accounts[0])
          finalGold = await goldToken.balanceOf(accounts[0])
          finalReserve = await goldToken.balanceOf(reserve.address)
        })

        it(`should increase user's stable`, async () => {
          assert.isTrue(finalStable.gt(originalStable))
        })

        it(`should reduce user's gold`, async () => {
          if (await addressMinedLatestBlock(accounts[0])) {
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

      // Note that this test relies on having purchased stable token in the previous test.
      describe('When selling stable token', () => {
        before(async () => {
          originalStable = await stableToken.balanceOf(accounts[0])
          originalGold = await goldToken.balanceOf(accounts[0])
          originalReserve = await goldToken.balanceOf(reserve.address)
          await stableToken.approve(exchange.address, sellAmount)
          // Cannot sell more than was purchased in the previous test.
          await exchange.sell(sellAmount.div(20), minBuyAmount, false)
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
    })

    describe('Buying', () => {
      const buyAmount = new BigNumber(10000000000000000000)
      const maxSellAmount = new BigNumber('10000000000000000000000')

      describe('When buying stable token', () => {
        before(async () => {
          originalStable = await stableToken.balanceOf(accounts[0])
          originalGold = await goldToken.balanceOf(accounts[0])
          originalReserve = await goldToken.balanceOf(reserve.address)
          await goldToken.approve(exchange.address, maxSellAmount)
          await exchange.buy(buyAmount, maxSellAmount, false)
          finalStable = await stableToken.balanceOf(accounts[0])
          finalGold = await goldToken.balanceOf(accounts[0])
          finalReserve = await goldToken.balanceOf(reserve.address)
        })

        it(`should increase user's stable`, async () => {
          assert.isTrue(finalStable.gt(originalStable))
        })

        it(`should reduce user's gold`, async () => {
          if (await addressMinedLatestBlock(accounts[0])) {
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

      // Note that this test relies on having purchased cUSD in a previous test
      describe('When buying celo', () => {
        before(async () => {
          originalStable = await stableToken.balanceOf(accounts[0])
          originalGold = await goldToken.balanceOf(accounts[0])
          originalReserve = await goldToken.balanceOf(reserve.address)
          await stableToken.approve(exchange.address, maxSellAmount)
          // Cannot sell more than was purchased in the previous test.
          await exchange.buy(buyAmount, maxSellAmount, true)
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
)
