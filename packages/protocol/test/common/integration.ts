import { ensureLeading0x, NULL_ADDRESS } from '@celo/base/lib/address'
import { constitution } from '@celo/protocol/governanceConstitution'
import {
  addressMinedLatestBlock,
  assertEqualBN,
  assertTransactionRevertWithReason,
  assumeOwnershipWithTruffle,
  stripHexEncoding,
  timeTravel,
} from '@celo/protocol/lib/test-utils'
import {
  getDeployedProxiedContract,
  getFunctionSelectorsForContract,
  makeTruffleContractForMigration,
} from '@celo/protocol/lib/web3-utils'
import { config } from '@celo/protocol/migrationsConfig'
import { linkedListChanges, zip } from '@celo/utils/lib/collections'
import { fixed1, toFixed } from '@celo/utils/lib/fixidity'
import BigNumber from 'bignumber.js'
import {
  ElectionInstance,
  FeeCurrencyWhitelistInstance,
  FreezerInstance,
  GoldTokenInstance,
  GovernanceApproverMultiSigInstance,
  GovernanceInstance,
  GovernanceSlasherInstance,
  LockedGoldInstance,
  RegistryInstance,
} from 'types'
import {
  ExchangeContract,
  ExchangeInstance,
  ReserveInstance,
  ReserveSpenderMultiSigInstance,
  SortedOraclesInstance,
  StableTokenContract,
  StableTokenInstance,
} from 'types/mento'
import { MENTO_PACKAGE } from '../../contractPackages'
import { ArtifactsSingleton } from '../../lib/artifactsSingleton'
import { SECONDS_IN_A_WEEK } from '../constants'

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
        const artifactsInstance = ArtifactsSingleton.getInstance(
          constitution[contractName].__contractPackage,
          artifacts
        )

        const contract = await getDeployedProxiedContract<Truffle.ContractInstance>(
          contractName,
          artifactsInstance
        )

        const selectors = getFunctionSelectorsForContract(contract, contractName, artifactsInstance)

        selectors.default = ['0x00000000']

        const thresholds = { ...constitution.proxy, ...constitution[contractName] }
        await Promise.all(
          Object.keys(thresholds)
            .filter((k) => k !== '__contractPackage')
            .map((func) =>
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
      assert.equal(await registry.getAddressForOrDie(web3.utils.soliditySha3('test1')), accounts[1])
      assert.equal(await registry.getAddressForOrDie(web3.utils.soliditySha3('test2')), accounts[2])
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

contract('Integration: Adding StableToken', (accounts: string[]) => {
  const Exchange: ExchangeContract = makeTruffleContractForMigration(
    'Exchange',
    MENTO_PACKAGE,
    web3
  )
  const StableToken: StableTokenContract = makeTruffleContractForMigration(
    'StableToken',
    MENTO_PACKAGE,
    web3
  )
  let exchangeAbc: ExchangeInstance
  let freezer: FreezerInstance
  let goldToken: GoldTokenInstance
  let stableTokenAbc: StableTokenInstance
  const sellAmount = web3.utils.toWei('0.1', 'ether')
  const minBuyAmount = 1

  // 0. Make ourselves the owner of the various contracts we will need to interact with, as
  // passing a governance proposal for each one will be a pain in the butt.
  before(async () => {
    goldToken = await getDeployedProxiedContract('GoldToken', artifacts)
    freezer = await getDeployedProxiedContract('Freezer', artifacts)
    const contractsToOwn = ['Freezer', 'Registry', 'SortedOracles', 'FeeCurrencyWhitelist']
    await assumeOwnershipWithTruffle(contractsToOwn, accounts[0])
    await assumeOwnershipWithTruffle(['Reserve'], accounts[0], 0, MENTO_PACKAGE)
  })

  // 1. Mimic the state of the world post-contracts-release
  //   a) Deploy the contracts. For simplicity, omit proxies for now.
  //   b) Register the contracts
  //   c) Initialize the contracts
  //   d) Confirm mento is effectively frozen
  describe('When the contracts have been deployed and initialized', () => {
    before(async () => {
      exchangeAbc = await Exchange.new(true)
      stableTokenAbc = await StableToken.new(true)

      const registry: RegistryInstance = await getDeployedProxiedContract('Registry', artifacts)
      await registry.setAddressFor('ExchangeABC', exchangeAbc.address)
      await registry.setAddressFor('StableTokenABC', stableTokenAbc.address)

      await stableTokenAbc.initialize(
        'Celo Abc', // Name
        'cABC', // symbol
        '18', // decimals
        registry.address,
        fixed1, // inflationRate
        SECONDS_IN_A_WEEK, // inflationRatePeriod
        [accounts[0]], // pre-mint account
        ['1000000000000000000'], // pre-mint amount
        'ExchangeABC' // exchange contract key on the registry
      )
      await exchangeAbc.initialize(
        registry.address,
        'StableTokenABC',
        '5000000000000000000000', // spread, matches mainnet for cUSD and cEUR
        '1300000000000000000000', // reserveFraction, matches mainnet for cEUR
        '300', // updateFrequency, matches mainnet for cUSD and cEUR
        '1' // minimumReports, minimum possible to avoid having to mock multiple reports
      )
    })

    it(`should be impossible to sell CELO`, async () => {
      await goldToken.approve(exchangeAbc.address, sellAmount)
      await assertTransactionRevertWithReason(exchangeAbc.sell(sellAmount, minBuyAmount, true))
    })

    it(`should be impossible to sell stable token`, async () => {
      await stableTokenAbc.approve(exchangeAbc.address, sellAmount)
      await assertTransactionRevertWithReason(exchangeAbc.sell(sellAmount, minBuyAmount, false))
    })
  })

  // 2. Mimic the state of the world post-oracle-activation-proposal
  //   a) Activate the oracles and freeze the mento
  //   b) Make an oracle report
  //   c) Confirm mento is effectively frozen
  describe('When the contracts have been frozen and an oracle report has been made', () => {
    before(async () => {
      const sortedOracles: SortedOraclesInstance = await getDeployedProxiedContract(
        'SortedOracles',
        artifacts
      )
      await sortedOracles.addOracle(stableTokenAbc.address, ensureLeading0x(accounts[0]))
      await freezer.freeze(stableTokenAbc.address)
      await freezer.freeze(exchangeAbc.address)
      await sortedOracles.report(stableTokenAbc.address, toFixed(1), NULL_ADDRESS, NULL_ADDRESS)
    })

    it(`should be impossible to sell CELO`, async () => {
      await goldToken.approve(exchangeAbc.address, sellAmount)
      await assertTransactionRevertWithReason(
        exchangeAbc.sell(sellAmount, minBuyAmount, true),
        "can't call when contract is frozen"
      )
    })

    it(`should be impossible to sell stable token`, async () => {
      await stableTokenAbc.approve(exchangeAbc.address, sellAmount)
      await assertTransactionRevertWithReason(
        exchangeAbc.sell(sellAmount, minBuyAmount, false),
        "can't call when contract is frozen"
      )
    })
  })

  // 3. Mimic the state of the world post-mento-activation-proposal
  //   a) Add the stable token to the reserve
  //   b) Unfreeze the mento
  //   c) Confirm mento is functional
  describe('When the contracts have been unfrozen and the mento has been activated', () => {
    before(async () => {
      const reserve: ReserveInstance = await getDeployedProxiedContract(
        'Reserve',
        ArtifactsSingleton.getInstance(MENTO_PACKAGE)
      )
      const feeCurrencyWhitelist: FeeCurrencyWhitelistInstance = await getDeployedProxiedContract(
        'FeeCurrencyWhitelist',
        artifacts
      )
      await reserve.addToken(stableTokenAbc.address)
      await reserve.addExchangeSpender(exchangeAbc.address)
      await freezer.unfreeze(stableTokenAbc.address)
      await freezer.unfreeze(exchangeAbc.address)

      // activate stable during mento-activation proposal
      await exchangeAbc.activateStable()
      // Fee currency can't be tested here, but keep this line for reference
      await feeCurrencyWhitelist.addToken(stableTokenAbc.address)
    })

    it(`should be possible to sell CELO`, async () => {
      await goldToken.approve(exchangeAbc.address, sellAmount)
      await exchangeAbc.sell(sellAmount, minBuyAmount, true)
    })

    it(`should be possible to sell stable token`, async () => {
      await stableTokenAbc.approve(exchangeAbc.address, sellAmount)
      await exchangeAbc.sell(sellAmount, minBuyAmount, false)
    })
  })
})
