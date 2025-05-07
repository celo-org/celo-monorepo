import { SOLIDITY_08_PACKAGE } from '@celo/protocol/contractPackages'
import { constitution } from '@celo/protocol/governanceConstitution'
import { assertEqualBN, stripHexEncoding, timeTravel } from '@celo/protocol/lib/test-utils'
import {
  getDeployedProxiedContract,
  getFunctionSelectorsForContract,
} from '@celo/protocol/lib/web3-utils'
import { build_directory, config } from '@celo/protocol/migrationsConfig'
import { EpochManagerEnablerInstance } from '@celo/protocol/types/typechain-0.8'
import { fixed1, toFixed } from '@celo/utils/lib/fixidity'
import BigNumber from 'bignumber.js'
import {
  ElectionInstance,
  GovernanceApproverMultiSigInstance,
  GovernanceInstance,
  GovernanceSlasherInstance,
  LockedGoldInstance,
  RegistryInstance,
} from 'types'
import { ArtifactsSingleton } from '../../lib/artifactsSingleton'

const Artifactor = require('@truffle/artifactor')

enum VoteValue {
  None = 0,
  Abstain,
  No,
  Yes,
}

// async function getGroups(election: ElectionInstance) {
//   const response = await election.getTotalVotesForEligibleValidatorGroups()
//   console.info('response', response)
//   const lst1 = response[0]
//   const lst2 = response[1]
//   return zip(
//     (address, value) => {
//       return { address, value }
//     },
//     lst1,
//     lst2
//   )
// }

// Returns how much voting gold will be decremented from the groups voted by an account
// async function slashingOfGroups(
//   account: string,
//   penalty: BigNumber,
//   lockedGold: LockedGoldInstance,
//   election: ElectionInstance
// ) {
//   // first check how much voting gold has to be slashed
//   const nonVoting = await lockedGold.getAccountNonvotingLockedGold(account)
//   if (penalty.isLessThan(nonVoting)) {
//     return []
//   }
//   let difference = penalty.minus(nonVoting)
//   // find voted groups
//   const groups = await election.getGroupsVotedForByAccount(account)
//   const res = []
//   //
//   for (let i = groups.length - 1; i >= 0; i--) {
//     const group = groups[i]
//     const totalVotes = await election.getTotalVotesForGroup(group)
//     const votes = await election.getTotalVotesForGroupByAccount(group, account)
//     const slashedVotes = votes.lt(difference) ? votes : difference
//     res.push({ address: group, value: totalVotes.minus(slashedVotes), index: i })
//     difference = difference.minus(slashedVotes)
//     if (difference.eq(new BigNumber(0))) {
//       break
//     }
//   }
//   return res
// }

// async function findLessersAndGreaters(
//   account: string,
//   penalty: BigNumber,
//   lockedGold: LockedGoldInstance,
//   election: ElectionInstance
// ) {
//   const groups = await getGroups(election)
//   const changed = await slashingOfGroups(account, penalty, lockedGold, election)
//   const changes = linkedListChanges(groups, changed)
//   return { ...changes, indices: changed.map((a) => a.index) }
// }

// contract('Integration: Running elections', (_accounts: string[]) => {
//   let election: ElectionInstance

//   before(async () => {
//     election = await getDeployedProxiedContract('Election', artifacts)
//   })

//   describe('When getting the elected validators', () => {
//     it('should elect all 30 validators', async () => {
//       const elected = await election.electValidatorSigners()
//       assert.equal(elected.length, 30)
//     })
//     it('should elect specified number validators with electNValidatorSigners', async () => {
//       const elected = await election.electNValidatorSigners(1, 20)
//       assert.equal(elected.length, 20)
//     })
//   })
// })

// skipping this test, as it requires the L1 precompile to capture epoch before L2 migration.
// attempting to capture epoch is failing with `slicing out of range` error.
contract.skip('Integration: Governance slashing', (accounts: string[]) => {
  const proposalId = 1
  const dequeuedIndex = 0
  let lockedGold: LockedGoldInstance
  // let election: ElectionInstance
  // let validators: ValidatorsInstance
  let epochManagerEnabler: EpochManagerEnablerInstance
  let multiSig: GovernanceApproverMultiSigInstance
  let governance: GovernanceInstance
  let governanceSlasher: GovernanceSlasherInstance
  let proposalTransactions: any
  let value: BigNumber
  // let valueOfSlashed: BigNumber
  const penalty = new BigNumber('100')
  const slashedAccount = accounts[9]

  before(async () => {
    const artifacts08 = ArtifactsSingleton.getInstance(SOLIDITY_08_PACKAGE, artifacts)
    lockedGold = await getDeployedProxiedContract('LockedGold', artifacts)
    // election = await getDeployedProxiedContract('Election', artifacts)
    // validators = await getDeployedProxiedContract('Validators', artifacts08)

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

  // describe('When performing slashing', () => {
  //   before(async () => {
  //     await timeTravel(config.governance.referendumStageDuration, web3)
  //     valueOfSlashed = await lockedGold.getAccountTotalLockedGold(slashedAccount)
  //     const { lessers, greaters, indices } = await findLessersAndGreaters(
  //       slashedAccount,
  //       penalty,
  //       lockedGold,
  //       election
  //     )
  //     let group = await validators.getMembershipInLastEpochFromSigner(slashedAccount)

  //     await governanceSlasher.slash(slashedAccount, group, lessers, greaters, indices, {
  //       from: accounts[0],
  //     })
  //   })

  //   it('should set approved slashing to zero', async () => {
  //     assert.equal((await governanceSlasher.getApprovedSlashing(slashedAccount)).toNumber(), 0)
  //   })

  //   it('should slash the account', async () => {
  //     assertEqualBN(
  //       await lockedGold.getAccountTotalLockedGold(slashedAccount),
  //       valueOfSlashed.minus(penalty)
  //     )
  //   })
  // })
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
