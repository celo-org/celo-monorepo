import { CeloContractName } from '@celo/protocol/lib/registry-utils'
import {
  assertContainSubset,
  assertEqualBN,
  assertRevert,
  mineBlocks,
  NULL_ADDRESS,
} from '@celo/protocol/lib/test-utils'
import { toFixed } from '@celo/utils/lib/fixidity'
import BigNumber from 'bignumber.js'
import {
  AccountsContract,
  AccountsInstance,
  ElectionTestContract,
  ElectionTestInstance,
  MockLockedGoldContract,
  MockLockedGoldInstance,
  MockRandomContract,
  MockRandomInstance,
  MockValidatorsContract,
  MockValidatorsInstance,
  RegistryContract,
  RegistryInstance,
} from 'types'

const Accounts: AccountsContract = artifacts.require('Accounts')
const ElectionTest: ElectionTestContract = artifacts.require('ElectionTest')
const MockLockedGold: MockLockedGoldContract = artifacts.require('MockLockedGold')
const MockValidators: MockValidatorsContract = artifacts.require('MockValidators')
const MockRandom: MockRandomContract = artifacts.require('MockRandom')
const Registry: RegistryContract = artifacts.require('Registry')

// @ts-ignore
// TODO(mcortesi): Use BN
ElectionTest.numberFormat = 'BigNumber'

// Hard coded in ganache.
const EPOCH = 100

contract('Election', (accounts: string[]) => {
  let accountsInstance: AccountsInstance
  let election: ElectionTestInstance
  let registry: RegistryInstance
  let mockLockedGold: MockLockedGoldInstance
  let mockValidators: MockValidatorsInstance

  const nonOwner = accounts[1]
  const electableValidators = {
    min: new BigNumber(4),
    max: new BigNumber(6),
  }
  const maxNumGroupsVotedFor = new BigNumber(3)
  const electabilityThreshold = toFixed(1 / 100)

  beforeEach(async () => {
    accountsInstance = await Accounts.new()
    await Promise.all(accounts.map((account) => accountsInstance.createAccount({ from: account })))
    election = await ElectionTest.new()
    mockLockedGold = await MockLockedGold.new()
    mockValidators = await MockValidators.new()
    registry = await Registry.new()
    await registry.setAddressFor(CeloContractName.Accounts, accountsInstance.address)
    await registry.setAddressFor(CeloContractName.LockedGold, mockLockedGold.address)
    await registry.setAddressFor(CeloContractName.Validators, mockValidators.address)
    await election.initialize(
      registry.address,
      electableValidators.min,
      electableValidators.max,
      maxNumGroupsVotedFor,
      electabilityThreshold
    )
  })

  describe('#initialize()', () => {
    it('should have set the owner', async () => {
      const owner: string = await election.owner()
      assert.equal(owner, accounts[0])
    })

    it('should have set electableValidators', async () => {
      const [min, max] = await election.getElectableValidators()
      assertEqualBN(min, electableValidators.min)
      assertEqualBN(max, electableValidators.max)
    })

    it('should have set maxNumGroupsVotedFor', async () => {
      const actualMaxNumGroupsVotedFor = await election.maxNumGroupsVotedFor()
      assertEqualBN(actualMaxNumGroupsVotedFor, maxNumGroupsVotedFor)
    })

    it('should have set electabilityThreshold', async () => {
      const actualElectabilityThreshold = await election.getElectabilityThreshold()
      assertEqualBN(actualElectabilityThreshold, electabilityThreshold)
    })

    it('should not be callable again', async () => {
      await assertRevert(
        election.initialize(
          registry.address,
          electableValidators.min,
          electableValidators.max,
          maxNumGroupsVotedFor,
          electabilityThreshold
        )
      )
    })
  })

  describe('#setElectabilityThreshold', () => {
    it('should set the electability threshold', async () => {
      const threshold = toFixed(1 / 10)
      await election.setElectabilityThreshold(threshold)
      const result = await election.getElectabilityThreshold()
      assertEqualBN(result, threshold)
    })

    it('should revert when the threshold is larger than 100%', async () => {
      const threshold = toFixed(new BigNumber('2'))
      await assertRevert(election.setElectabilityThreshold(threshold))
    })
  })

  describe('#setElectableValidators', () => {
    const newElectableValidators = {
      min: electableValidators.min.plus(1),
      max: electableValidators.max.plus(1),
    }

    it('should set the minimum electable valdiators', async () => {
      await election.setElectableValidators(newElectableValidators.min, newElectableValidators.max)
      const [min, max] = await election.getElectableValidators()
      assertEqualBN(min, newElectableValidators.min)
      assertEqualBN(max, newElectableValidators.max)
    })

    it('should emit the ElectableValidatorsSet event', async () => {
      const resp = await election.setElectableValidators(
        newElectableValidators.min,
        newElectableValidators.max
      )
      assert.equal(resp.logs.length, 1)
      const log = resp.logs[0]
      assertContainSubset(log, {
        event: 'ElectableValidatorsSet',
        args: {
          min: newElectableValidators.min,
          max: newElectableValidators.max,
        },
      })
    })

    it('should revert when the minElectableValidators is zero', async () => {
      await assertRevert(election.setElectableValidators(0, newElectableValidators.max))
    })

    it('should revert when the min is greater than max', async () => {
      await assertRevert(
        election.setElectableValidators(
          newElectableValidators.max.plus(1),
          newElectableValidators.max
        )
      )
    })

    it('should revert when the values are unchanged', async () => {
      await assertRevert(
        election.setElectableValidators(electableValidators.min, electableValidators.max)
      )
    })

    it('should revert when called by anyone other than the owner', async () => {
      await assertRevert(
        election.setElectableValidators(newElectableValidators.min, newElectableValidators.max, {
          from: nonOwner,
        })
      )
    })
  })

  describe('#setMaxNumGroupsVotedFor', () => {
    const newMaxNumGroupsVotedFor = maxNumGroupsVotedFor.plus(1)
    it('should set the max electable validators', async () => {
      await election.setMaxNumGroupsVotedFor(newMaxNumGroupsVotedFor)
      assertEqualBN(await election.maxNumGroupsVotedFor(), newMaxNumGroupsVotedFor)
    })

    it('should emit the MaxNumGroupsVotedForSet event', async () => {
      const resp = await election.setMaxNumGroupsVotedFor(newMaxNumGroupsVotedFor)
      assert.equal(resp.logs.length, 1)
      const log = resp.logs[0]
      assertContainSubset(log, {
        event: 'MaxNumGroupsVotedForSet',
        args: {
          maxNumGroupsVotedFor: new BigNumber(newMaxNumGroupsVotedFor),
        },
      })
    })

    it('should revert when the maxNumGroupsVotedFor is unchanged', async () => {
      await assertRevert(election.setMaxNumGroupsVotedFor(maxNumGroupsVotedFor))
    })

    it('should revert when called by anyone other than the owner', async () => {
      await assertRevert(
        election.setMaxNumGroupsVotedFor(newMaxNumGroupsVotedFor, { from: nonOwner })
      )
    })
  })

  describe('#markGroupEligible', () => {
    const group = accounts[1]
    describe('when called by the registered validators contract', () => {
      beforeEach(async () => {
        await registry.setAddressFor(CeloContractName.Validators, accounts[0])
      })

      describe('when the group has no votes', () => {
        let resp: any
        beforeEach(async () => {
          resp = await election.markGroupEligible(group, NULL_ADDRESS, NULL_ADDRESS)
        })

        it('should add the group to the list of eligible groups', async () => {
          assert.deepEqual(await election.getEligibleValidatorGroups(), [group])
        })

        it('should emit the ValidatorGroupMarkedEligible event', async () => {
          assert.equal(resp.logs.length, 1)
          const log = resp.logs[0]
          assertContainSubset(log, {
            event: 'ValidatorGroupMarkedEligible',
            args: {
              group,
            },
          })
        })

        describe('when the group has already been marked eligible', () => {
          it('should revert', async () => {
            await assertRevert(election.markGroupEligible(group, NULL_ADDRESS, NULL_ADDRESS))
          })
        })
      })
    })

    describe('not called by the registered validators contract', () => {
      it('should revert', async () => {
        await assertRevert(election.markGroupEligible(group, NULL_ADDRESS, NULL_ADDRESS))
      })
    })
  })

  describe('#markGroupIneligible', () => {
    const group = accounts[1]
    describe('when the group is eligible', () => {
      beforeEach(async () => {
        await mockValidators.setMembers(group, [accounts[9]])
        await registry.setAddressFor(CeloContractName.Validators, accounts[0])
        await election.markGroupEligible(group, NULL_ADDRESS, NULL_ADDRESS)
        await registry.setAddressFor(CeloContractName.Validators, mockValidators.address)
      })

      describe('when called by the registered Validators contract', () => {
        let resp: any
        beforeEach(async () => {
          await registry.setAddressFor(CeloContractName.Validators, accounts[0])
          resp = await election.markGroupIneligible(group)
        })

        it('should remove the group from the list of eligible groups', async () => {
          assert.deepEqual(await election.getEligibleValidatorGroups(), [])
        })

        it('should emit the ValidatorGroupMarkedIneligible event', async () => {
          assert.equal(resp.logs.length, 1)
          const log = resp.logs[0]
          assertContainSubset(log, {
            event: 'ValidatorGroupMarkedIneligible',
            args: {
              group,
            },
          })
        })
      })

      describe('when not called by the registered Validators contract', () => {
        it('should revert', async () => {
          await assertRevert(election.markGroupIneligible(group))
        })
      })
    })

    describe('when the group is ineligible', () => {
      describe('when called by the registered Validators contract', () => {
        beforeEach(async () => {
          await registry.setAddressFor(CeloContractName.Validators, accounts[0])
        })

        it('should revert', async () => {
          await assertRevert(election.markGroupIneligible(group))
        })
      })
    })
  })

  describe('#vote', () => {
    const voter = accounts[0]
    const group = accounts[1]
    const value = new BigNumber(1000)
    describe('when the group is eligible', () => {
      beforeEach(async () => {
        await mockValidators.setMembers(group, [accounts[9]])
        await registry.setAddressFor(CeloContractName.Validators, accounts[0])
        await election.markGroupEligible(group, NULL_ADDRESS, NULL_ADDRESS)
        await registry.setAddressFor(CeloContractName.Validators, mockValidators.address)
      })

      describe('when the group can receive votes', () => {
        beforeEach(async () => {
          await mockLockedGold.setTotalLockedGold(value)
          await mockValidators.setNumRegisteredValidators(1)
        })

        describe('when the voter can vote for an additional group', () => {
          describe('when the voter has sufficient non-voting balance', () => {
            let resp: any
            beforeEach(async () => {
              await mockLockedGold.incrementNonvotingAccountBalance(voter, value)
              resp = await election.vote(group, value, NULL_ADDRESS, NULL_ADDRESS)
            })

            it('should add the group to the list of groups the account has voted for', async () => {
              assert.deepEqual(await election.getGroupsVotedForByAccount(voter), [group])
            })

            it("should increment the account's pending votes for the group", async () => {
              assertEqualBN(await election.getPendingVotesForGroupByAccount(group, voter), value)
            })

            it("should increment the account's total votes for the group", async () => {
              assertEqualBN(await election.getTotalVotesForGroupByAccount(group, voter), value)
            })

            it("should increment the account's total votes", async () => {
              assertEqualBN(await election.getTotalVotesByAccount(voter), value)
            })

            it('should increment the total votes for the group', async () => {
              assertEqualBN(await election.getTotalVotesForGroup(group), value)
            })

            it('should increment the total votes', async () => {
              assertEqualBN(await election.getTotalVotes(), value)
            })

            it("should decrement the account's nonvoting locked gold balance", async () => {
              assertEqualBN(await mockLockedGold.nonvotingAccountBalance(voter), 0)
            })

            it('should emit the ValidatorGroupVoteCast event', async () => {
              assert.equal(resp.logs.length, 1)
              const log = resp.logs[0]
              assertContainSubset(log, {
                event: 'ValidatorGroupVoteCast',
                args: {
                  account: voter,
                  group,
                  value: new BigNumber(value),
                },
              })
            })
          })

          describe('when the voter does not have sufficient non-voting balance', () => {
            beforeEach(async () => {
              await mockLockedGold.incrementNonvotingAccountBalance(voter, value.minus(1))
            })

            it('should revert', async () => {
              await assertRevert(election.vote(group, value, NULL_ADDRESS, NULL_ADDRESS))
            })
          })
        })

        describe('when the voter cannot vote for an additional group', () => {
          let newGroup: string
          beforeEach(async () => {
            await mockLockedGold.incrementNonvotingAccountBalance(voter, value)
            for (let i = 0; i < maxNumGroupsVotedFor.toNumber(); i++) {
              newGroup = accounts[i + 2]
              await mockValidators.setMembers(newGroup, [accounts[9]])
              await registry.setAddressFor(CeloContractName.Validators, accounts[0])
              await election.markGroupEligible(newGroup, group, NULL_ADDRESS)
              await registry.setAddressFor(CeloContractName.Validators, mockValidators.address)
              await election.vote(newGroup, 1, group, NULL_ADDRESS)
            }
          })

          it('should revert', async () => {
            await assertRevert(
              election.vote(group, value.minus(maxNumGroupsVotedFor), newGroup, NULL_ADDRESS)
            )
          })
        })
      })

      describe('when the group cannot receive votes', () => {
        beforeEach(async () => {
          await mockLockedGold.setTotalLockedGold(value.div(2).minus(1))
          await mockValidators.setMembers(group, [accounts[9]])
          await mockValidators.setNumRegisteredValidators(1)
          assertEqualBN(await election.getNumVotesReceivable(group), value.minus(2))
        })

        it('should revert', async () => {
          await assertRevert(election.vote(group, value, NULL_ADDRESS, NULL_ADDRESS))
        })
      })
    })

    describe('when the group is not eligible', () => {
      it('should revert', async () => {
        await assertRevert(election.vote(group, value, NULL_ADDRESS, NULL_ADDRESS))
      })
    })
  })

  describe('#activate', () => {
    const voter = accounts[0]
    const group = accounts[1]
    const value = 1000
    beforeEach(async () => {
      await mockValidators.setMembers(group, [accounts[9]])
      await registry.setAddressFor(CeloContractName.Validators, accounts[0])
      await election.markGroupEligible(group, NULL_ADDRESS, NULL_ADDRESS)
      await registry.setAddressFor(CeloContractName.Validators, mockValidators.address)
      await mockLockedGold.setTotalLockedGold(value)
      await mockValidators.setMembers(group, [accounts[9]])
      await mockValidators.setNumRegisteredValidators(1)
      await mockLockedGold.incrementNonvotingAccountBalance(voter, value)
    })

    describe('when the voter has pending votes', () => {
      beforeEach(async () => {
        await election.vote(group, value, NULL_ADDRESS, NULL_ADDRESS)
      })

      describe('when an epoch boundary has passed since the pending votes were made', () => {
        let resp: any
        beforeEach(async () => {
          await mineBlocks(EPOCH, web3)
          resp = await election.activate(group)
        })

        it("should decrement the account's pending votes for the group", async () => {
          assertEqualBN(await election.getPendingVotesForGroupByAccount(group, voter), 0)
        })

        it("should increment the account's active votes for the group", async () => {
          assertEqualBN(await election.getActiveVotesForGroupByAccount(group, voter), value)
        })

        it("should not modify the account's total votes for the group", async () => {
          assertEqualBN(await election.getTotalVotesForGroupByAccount(group, voter), value)
        })

        it("should not modify the account's total votes", async () => {
          assertEqualBN(await election.getTotalVotesByAccount(voter), value)
        })

        it('should not modify the total votes for the group', async () => {
          assertEqualBN(await election.getTotalVotesForGroup(group), value)
        })

        it('should not modify the total votes', async () => {
          assertEqualBN(await election.getTotalVotes(), value)
        })

        it('should emit the ValidatorGroupVoteActivated event', async () => {
          assert.equal(resp.logs.length, 1)
          const log = resp.logs[0]
          assertContainSubset(log, {
            event: 'ValidatorGroupVoteActivated',
            args: {
              account: voter,
              group,
              value: new BigNumber(value),
            },
          })
        })

        describe('when another voter activates votes', () => {
          const voter2 = accounts[2]
          const value2 = 573
          beforeEach(async () => {
            await mockLockedGold.incrementNonvotingAccountBalance(voter2, value2)
            await election.vote(group, value2, NULL_ADDRESS, NULL_ADDRESS, { from: voter2 })
            await mineBlocks(EPOCH, web3)
            await election.activate(group, { from: voter2 })
          })

          it("should not modify the first account's active votes for the group", async () => {
            assertEqualBN(await election.getActiveVotesForGroupByAccount(group, voter), value)
          })

          it("should not modify the first account's total votes for the group", async () => {
            assertEqualBN(await election.getTotalVotesForGroupByAccount(group, voter), value)
          })

          it("should not modify the first account's total votes", async () => {
            assertEqualBN(await election.getTotalVotesByAccount(voter), value)
          })

          it("should decrement the second account's pending votes for the group", async () => {
            assertEqualBN(await election.getPendingVotesForGroupByAccount(group, voter2), 0)
          })

          it("should increment the second account's active votes for the group", async () => {
            assertEqualBN(await election.getActiveVotesForGroupByAccount(group, voter2), value2)
          })

          it("should not modify the second account's total votes for the group", async () => {
            assertEqualBN(await election.getTotalVotesForGroupByAccount(group, voter2), value2)
          })

          it("should not modify the second account's total votes", async () => {
            assertEqualBN(await election.getTotalVotesByAccount(voter2), value2)
          })

          it('should not modify the total votes for the group', async () => {
            assertEqualBN(await election.getTotalVotesForGroup(group), value + value2)
          })

          it('should not modify the total votes', async () => {
            assertEqualBN(await election.getTotalVotes(), value + value2)
          })
        })
      })

      describe('when an epoch boundary has not passed since the pending votes were made', () => {
        it('should revert', async () => {
          await assertRevert(election.activate(group))
        })
      })
    })

    describe('when the voter does not have pending votes', () => {
      it('should revert', async () => {
        await assertRevert(election.activate(group))
      })
    })
  })

  describe('#revokePending', () => {
    const voter = accounts[0]
    const group = accounts[1]
    const value = 1000
    describe('when the voter has pending votes', () => {
      beforeEach(async () => {
        await mockValidators.setMembers(group, [accounts[9]])
        await registry.setAddressFor(CeloContractName.Validators, accounts[0])
        await election.markGroupEligible(group, NULL_ADDRESS, NULL_ADDRESS)
        await registry.setAddressFor(CeloContractName.Validators, mockValidators.address)
        await mockLockedGold.setTotalLockedGold(value)
        await mockValidators.setNumRegisteredValidators(1)
        await mockLockedGold.incrementNonvotingAccountBalance(voter, value)
        await election.vote(group, value, NULL_ADDRESS, NULL_ADDRESS)
      })

      describe('when the revoked value is less than the pending votes', () => {
        const index = 0
        const revokedValue = value - 1
        const remaining = value - revokedValue
        let resp: any
        beforeEach(async () => {
          resp = await election.revokePending(
            group,
            revokedValue,
            NULL_ADDRESS,
            NULL_ADDRESS,
            index
          )
        })

        it("should decrement the account's pending votes for the group", async () => {
          assertEqualBN(await election.getPendingVotesForGroupByAccount(group, voter), remaining)
        })

        it("should decrement the account's total votes for the group", async () => {
          assertEqualBN(await election.getTotalVotesForGroupByAccount(group, voter), remaining)
        })

        it("should decrement the account's total votes", async () => {
          assertEqualBN(await election.getTotalVotesByAccount(voter), remaining)
        })

        it('should decrement the total votes for the group', async () => {
          assertEqualBN(await election.getTotalVotesForGroup(group), remaining)
        })

        it('should decrement the total votes', async () => {
          assertEqualBN(await election.getTotalVotes(), remaining)
        })

        it("should increment the account's nonvoting locked gold balance", async () => {
          assertEqualBN(await mockLockedGold.nonvotingAccountBalance(voter), revokedValue)
        })

        it('should emit the ValidatorGroupVoteRevoked event', async () => {
          assert.equal(resp.logs.length, 1)
          const log = resp.logs[0]
          assertContainSubset(log, {
            event: 'ValidatorGroupVoteRevoked',
            args: {
              account: voter,
              group,
              value: new BigNumber(revokedValue),
            },
          })
        })
      })

      describe('when the revoked value is equal to the pending votes', () => {
        describe('when the correct index is provided', () => {
          const index = 0
          beforeEach(async () => {
            await election.revokePending(group, value, NULL_ADDRESS, NULL_ADDRESS, index)
          })

          it('should remove the group to the list of groups the account has voted for', async () => {
            assert.deepEqual(await election.getGroupsVotedForByAccount(voter), [])
          })
        })

        describe('when the wrong index is provided', () => {
          const index = 1
          it('should revert', async () => {
            await assertRevert(
              election.revokePending(group, value, NULL_ADDRESS, NULL_ADDRESS, index)
            )
          })
        })
      })

      describe('when the revoked value is greater than the pending votes', () => {
        const index = 0
        it('should revert', async () => {
          await assertRevert(
            election.revokePending(group, value + 1, NULL_ADDRESS, NULL_ADDRESS, index)
          )
        })
      })
    })
  })

  describe('#revokeActive', () => {
    const voter = accounts[0]
    const group = accounts[1]
    const value = 1000
    describe('when the voter has active votes', () => {
      beforeEach(async () => {
        await mockValidators.setMembers(group, [accounts[9]])
        await registry.setAddressFor(CeloContractName.Validators, accounts[0])
        await election.markGroupEligible(group, NULL_ADDRESS, NULL_ADDRESS)
        await registry.setAddressFor(CeloContractName.Validators, mockValidators.address)
        await mockLockedGold.setTotalLockedGold(value)
        await mockValidators.setNumRegisteredValidators(1)
        await mockLockedGold.incrementNonvotingAccountBalance(voter, value)
        await election.vote(group, value, NULL_ADDRESS, NULL_ADDRESS)
        await mineBlocks(EPOCH, web3)
        await election.activate(group)
      })

      describe('when the revoked value is less than the active votes', () => {
        const index = 0
        const revokedValue = value - 1
        const remaining = value - revokedValue
        let resp: any
        beforeEach(async () => {
          resp = await election.revokeActive(group, revokedValue, NULL_ADDRESS, NULL_ADDRESS, index)
        })

        it("should decrement the account's active votes for the group", async () => {
          assertEqualBN(await election.getActiveVotesForGroupByAccount(group, voter), remaining)
        })

        it("should decrement the account's total votes for the group", async () => {
          assertEqualBN(await election.getTotalVotesForGroupByAccount(group, voter), remaining)
        })

        it("should decrement the account's total votes", async () => {
          assertEqualBN(await election.getTotalVotesByAccount(voter), remaining)
        })

        it('should decrement the total votes for the group', async () => {
          assertEqualBN(await election.getTotalVotesForGroup(group), remaining)
        })

        it('should decrement the total votes', async () => {
          assertEqualBN(await election.getTotalVotes(), remaining)
        })

        it("should increment the account's nonvoting locked gold balance", async () => {
          assertEqualBN(await mockLockedGold.nonvotingAccountBalance(voter), revokedValue)
        })

        it('should emit the ValidatorGroupVoteRevoked event', async () => {
          assert.equal(resp.logs.length, 1)
          const log = resp.logs[0]
          assertContainSubset(log, {
            event: 'ValidatorGroupVoteRevoked',
            args: {
              account: voter,
              group,
              value: new BigNumber(revokedValue),
            },
          })
        })
      })

      describe('when the revoked value is equal to the active votes', () => {
        describe('when the correct index is provided', () => {
          const index = 0
          beforeEach(async () => {
            await election.revokeActive(group, value, NULL_ADDRESS, NULL_ADDRESS, index)
          })

          it('should remove the group to the list of groups the account has voted for', async () => {
            assert.deepEqual(await election.getGroupsVotedForByAccount(voter), [])
          })
        })

        describe('when the wrong index is provided', () => {
          const index = 1
          it('should revert', async () => {
            await assertRevert(
              election.revokeActive(group, value, NULL_ADDRESS, NULL_ADDRESS, index)
            )
          })
        })
      })

      describe('when the revoked value is greater than the active votes', () => {
        const index = 0
        it('should revert', async () => {
          await assertRevert(
            election.revokeActive(group, value + 1, NULL_ADDRESS, NULL_ADDRESS, index)
          )
        })
      })
    })
  })

  describe('#electValidatorSigners', () => {
    let random: MockRandomInstance
    let totalLockedGold: number
    const group1 = accounts[0]
    const group2 = accounts[1]
    const group3 = accounts[2]
    const validator1 = accounts[3]
    const validator2 = accounts[4]
    const validator3 = accounts[5]
    const validator4 = accounts[6]
    const validator5 = accounts[7]
    const validator6 = accounts[8]
    const validator7 = accounts[9]

    const hash1 = '0xa5b9d60f32436310afebcfda832817a68921beb782fabf7915cc0460b443116a'
    const hash2 = '0xa832817a68921b10afebcfd0460b443116aeb782fabf7915cca5b9d60f324363'

    // If voterN votes for groupN:
    //   group1 gets 20 votes per member
    //   group2 gets 25 votes per member
    //   group3 gets 30 votes per member
    // We cannot make any guarantee with respect to their ordering.
    const voter1 = { address: accounts[0], weight: 80 }
    const voter2 = { address: accounts[1], weight: 50 }
    const voter3 = { address: accounts[2], weight: 30 }
    totalLockedGold = voter1.weight + voter2.weight + voter3.weight
    const assertSameAddresses = (actual: string[], expected: string[]) => {
      assert.sameMembers(actual.map((x) => x.toLowerCase()), expected.map((x) => x.toLowerCase()))
    }

    const setRandomness = async (hash: string) =>
      random.addTestRandomness((await web3.eth.getBlockNumber()) + 1, hash)

    beforeEach(async () => {
      await mockValidators.setMembers(group1, [validator1, validator2, validator3, validator4])
      await mockValidators.setMembers(group2, [validator5, validator6])
      await mockValidators.setMembers(group3, [validator7])

      await registry.setAddressFor(CeloContractName.Validators, accounts[0])
      await election.markGroupEligible(group1, NULL_ADDRESS, NULL_ADDRESS)
      await election.markGroupEligible(group2, NULL_ADDRESS, group1)
      await election.markGroupEligible(group3, NULL_ADDRESS, group2)
      await registry.setAddressFor(CeloContractName.Validators, mockValidators.address)

      for (const voter of [voter1, voter2, voter3]) {
        await mockLockedGold.incrementNonvotingAccountBalance(voter.address, voter.weight)
      }
      await mockLockedGold.setTotalLockedGold(totalLockedGold)
      await mockValidators.setNumRegisteredValidators(7)

      random = await MockRandom.new()
      await registry.setAddressFor(CeloContractName.Random, random.address)
    })

    describe('when a single group has >= minElectableValidators as members and received votes', () => {
      beforeEach(async () => {
        await election.vote(group1, voter1.weight, group2, NULL_ADDRESS, { from: voter1.address })
      })

      it("should return that group's member list", async () => {
        await setRandomness(hash1)
        assertSameAddresses(await election.electValidatorSigners(), [
          validator1,
          validator2,
          validator3,
          validator4,
        ])
      })
    })

    describe("when > maxElectableValidators members' groups receive votes", () => {
      beforeEach(async () => {
        await election.vote(group1, voter1.weight, group2, NULL_ADDRESS, { from: voter1.address })
        await election.vote(group2, voter2.weight, NULL_ADDRESS, group1, { from: voter2.address })
        await election.vote(group3, voter3.weight, NULL_ADDRESS, group2, { from: voter3.address })
      })

      it('should return maxElectableValidators elected validators', async () => {
        await setRandomness(hash1)
        assertSameAddresses(await election.electValidatorSigners(), [
          validator1,
          validator2,
          validator3,
          validator5,
          validator6,
          validator7,
        ])
      })
    })

    describe('when different random values are provided', () => {
      beforeEach(async () => {
        await election.vote(group1, voter1.weight, group2, NULL_ADDRESS, { from: voter1.address })
        await election.vote(group2, voter2.weight, NULL_ADDRESS, group1, { from: voter2.address })
        await election.vote(group3, voter3.weight, NULL_ADDRESS, group2, { from: voter3.address })
      })

      it('should return different results', async () => {
        await setRandomness(hash1)
        const valsWithHash1 = (await election.electValidatorSigners()).map((x) => x.toLowerCase())
        await setRandomness(hash2)
        const valsWithHash2 = (await election.electValidatorSigners()).map((x) => x.toLowerCase())
        assert.sameMembers(valsWithHash1, valsWithHash2)
        assert.notDeepEqual(valsWithHash1, valsWithHash2)
      })
    })

    describe('when a group receives enough votes for > n seats but only has n members', () => {
      beforeEach(async () => {
        // By incrementing the total votes by 80, we allow group3 to receive 80 votes from voter3.
        const increment = 80
        const votes = 80
        await mockLockedGold.incrementNonvotingAccountBalance(voter3.address, increment)
        await mockLockedGold.setTotalLockedGold(totalLockedGold + increment)
        await election.vote(group3, votes, group2, NULL_ADDRESS, { from: voter3.address })
        await election.vote(group1, voter1.weight, NULL_ADDRESS, group3, { from: voter1.address })
        await election.vote(group2, voter2.weight, NULL_ADDRESS, group1, { from: voter2.address })
      })

      it('should elect only n members from that group', async () => {
        await setRandomness(hash1)
        assertSameAddresses(await election.electValidatorSigners(), [
          validator7,
          validator1,
          validator2,
          validator3,
          validator5,
          validator6,
        ])
      })
    })

    describe('when a group does not receive `electabilityThresholdVotes', () => {
      beforeEach(async () => {
        const thresholdExcludingGroup3 = (voter3.weight + 1) / totalLockedGold
        await election.setElectabilityThreshold(toFixed(thresholdExcludingGroup3))
        await election.vote(group1, voter1.weight, group2, NULL_ADDRESS, { from: voter1.address })
        await election.vote(group2, voter2.weight, NULL_ADDRESS, group1, { from: voter2.address })
        await election.vote(group3, voter3.weight, NULL_ADDRESS, group2, { from: voter3.address })
      })

      it('should not elect any members from that group', async () => {
        await setRandomness(hash1)
        assertSameAddresses(await election.electValidatorSigners(), [
          validator1,
          validator2,
          validator3,
          validator4,
          validator5,
          validator6,
        ])
      })
    })

    describe('when there are not enough electable validators', () => {
      beforeEach(async () => {
        await election.vote(group2, voter2.weight, group1, NULL_ADDRESS, { from: voter2.address })
        await election.vote(group3, voter3.weight, NULL_ADDRESS, group2, { from: voter3.address })
      })

      it('should revert', async () => {
        await setRandomness(hash1)
        await assertRevert(election.electValidatorSigners())
      })
    })
  })

  describe('#getGroupEpochRewards', () => {
    const voter = accounts[0]
    const group1 = accounts[1]
    const group2 = accounts[2]
    const voteValue1 = new BigNumber(2000000)
    const voteValue2 = new BigNumber(1000000)
    const totalRewardValue = new BigNumber(3000000)
    beforeEach(async () => {
      await registry.setAddressFor(CeloContractName.Validators, accounts[0])
      await election.markGroupEligible(group1, NULL_ADDRESS, NULL_ADDRESS)
      await election.markGroupEligible(group2, NULL_ADDRESS, group1)
      await registry.setAddressFor(CeloContractName.Validators, mockValidators.address)
      await mockLockedGold.setTotalLockedGold(voteValue1.plus(voteValue2))
      await mockValidators.setMembers(group1, [accounts[8]])
      await mockValidators.setMembers(group2, [accounts[9]])
      await mockValidators.setNumRegisteredValidators(2)
      await mockLockedGold.incrementNonvotingAccountBalance(voter, voteValue1.plus(voteValue2))
      await election.vote(group1, voteValue1, group2, NULL_ADDRESS)
      await election.vote(group2, voteValue2, NULL_ADDRESS, group1)
    })

    describe('when one group has active votes', () => {
      beforeEach(async () => {
        await mineBlocks(EPOCH, web3)
        await election.activate(group1)
      })

      describe('when the group meets the locked gold requirements ', () => {
        it('should return the total reward value', async () => {
          assertEqualBN(
            await election.getGroupEpochRewards(group1, totalRewardValue),
            totalRewardValue
          )
        })
      })

      describe('when the group does not meet the locked gold requirements ', () => {
        beforeEach(async () => {
          await mockValidators.setDoesNotMeetAccountLockedGoldRequirements(group1)
        })

        it('should return zero', async () => {
          assertEqualBN(await election.getGroupEpochRewards(group1, totalRewardValue), 0)
        })
      })
    })

    describe('when two groups have active votes', () => {
      const expectedGroup1EpochRewards = voteValue1
        .div(voteValue1.plus(voteValue2))
        .times(totalRewardValue)
        .dp(0)
      beforeEach(async () => {
        await mineBlocks(EPOCH, web3)
        await election.activate(group1)
        await election.activate(group2)
      })

      describe('when one group does not meet the locked gold requirements ', () => {
        beforeEach(async () => {
          await mockValidators.setDoesNotMeetAccountLockedGoldRequirements(group2)
        })

        it('should return zero for that group', async () => {
          assertEqualBN(await election.getGroupEpochRewards(group2, totalRewardValue), 0)
        })

        it('should return the proportional reward value for the other group', async () => {
          assertEqualBN(
            await election.getGroupEpochRewards(group1, totalRewardValue),
            expectedGroup1EpochRewards
          )
        })
      })
    })

    describe('when the group does not have active votes', () => {
      describe('when the group meets the locked gold requirements ', () => {
        it('should return zero', async () => {
          assertEqualBN(await election.getGroupEpochRewards(group1, totalRewardValue), 0)
        })
      })
    })
  })

  describe('#distributeEpochRewards', () => {
    const voter = accounts[0]
    const group = accounts[1]
    const voteValue = new BigNumber(1000000)
    const rewardValue = new BigNumber(1000000)
    beforeEach(async () => {
      await registry.setAddressFor(CeloContractName.Validators, accounts[0])
      await election.markGroupEligible(group, NULL_ADDRESS, NULL_ADDRESS)
      await registry.setAddressFor(CeloContractName.Validators, mockValidators.address)
      await mockLockedGold.setTotalLockedGold(voteValue)
      await mockValidators.setMembers(group, [accounts[9]])
      await mockValidators.setNumRegisteredValidators(1)
      await mockLockedGold.incrementNonvotingAccountBalance(voter, voteValue)
      await election.vote(group, voteValue, NULL_ADDRESS, NULL_ADDRESS)
      await mineBlocks(EPOCH, web3)
      await election.activate(group)
    })

    describe('when there is a single group with active votes', () => {
      describe('when the group is eligible', () => {
        beforeEach(async () => {
          await election.distributeEpochRewards(group, rewardValue, NULL_ADDRESS, NULL_ADDRESS)
        })

        it("should increment the account's active votes for the group", async () => {
          assertEqualBN(
            await election.getActiveVotesForGroupByAccount(group, voter),
            voteValue.plus(rewardValue)
          )
        })

        it("should increment the account's total votes for the group", async () => {
          assertEqualBN(
            await election.getTotalVotesForGroupByAccount(group, voter),
            voteValue.plus(rewardValue)
          )
        })

        it("should increment account's total votes", async () => {
          assertEqualBN(await election.getTotalVotesByAccount(voter), voteValue.plus(rewardValue))
        })

        it('should increment the total votes for the group', async () => {
          assertEqualBN(await election.getTotalVotesForGroup(group), voteValue.plus(rewardValue))
        })

        it('should increment the total votes', async () => {
          assertEqualBN(await election.getTotalVotes(), voteValue.plus(rewardValue))
        })
      })
    })

    describe('when there are two groups with active votes', () => {
      const voter2 = accounts[2]
      const group2 = accounts[3]
      const voteValue2 = new BigNumber(1000000)
      const rewardValue2 = new BigNumber(10000000)
      beforeEach(async () => {
        await registry.setAddressFor(CeloContractName.Validators, accounts[0])
        await election.markGroupEligible(group2, NULL_ADDRESS, group)
        await registry.setAddressFor(CeloContractName.Validators, mockValidators.address)
        await mockLockedGold.setTotalLockedGold(voteValue.plus(voteValue2))
        await mockValidators.setNumRegisteredValidators(2)
        await mockLockedGold.incrementNonvotingAccountBalance(voter2, voteValue2)
        // Split voter2's vote between the two groups.
        await election.vote(group, voteValue2.div(2), group2, NULL_ADDRESS, { from: voter2 })
        await election.vote(group2, voteValue2.div(2), NULL_ADDRESS, group, { from: voter2 })
        await mineBlocks(EPOCH, web3)
        await election.activate(group, { from: voter2 })
        await election.activate(group2, { from: voter2 })
      })

      describe('when boths groups are eligible', () => {
        const expectedGroupTotalActiveVotes = voteValue.plus(voteValue2.div(2)).plus(rewardValue)
        const expectedVoterActiveVotesForGroup = expectedGroupTotalActiveVotes
          .times(2)
          .div(3)
          .dp(0, BigNumber.ROUND_FLOOR)
        const expectedVoter2ActiveVotesForGroup = expectedGroupTotalActiveVotes
          .div(3)
          .dp(0, BigNumber.ROUND_FLOOR)
        const expectedVoter2ActiveVotesForGroup2 = voteValue2.div(2).plus(rewardValue2)
        beforeEach(async () => {
          await election.distributeEpochRewards(group, rewardValue, group2, NULL_ADDRESS)
          await election.distributeEpochRewards(group2, rewardValue2, group, NULL_ADDRESS)
        })

        it("should increment the accounts' active votes for both groups", async () => {
          assertEqualBN(
            await election.getActiveVotesForGroupByAccount(group, voter),
            expectedVoterActiveVotesForGroup
          )
          assertEqualBN(
            await election.getActiveVotesForGroupByAccount(group, voter2),
            expectedVoter2ActiveVotesForGroup
          )
          assertEqualBN(
            await election.getActiveVotesForGroupByAccount(group2, voter2),
            expectedVoter2ActiveVotesForGroup2
          )
        })

        it("should increment the accounts' total votes for both groups", async () => {
          assertEqualBN(
            await election.getTotalVotesForGroupByAccount(group, voter),
            expectedVoterActiveVotesForGroup
          )
          assertEqualBN(
            await election.getTotalVotesForGroupByAccount(group, voter2),
            expectedVoter2ActiveVotesForGroup
          )
          assertEqualBN(
            await election.getTotalVotesForGroupByAccount(group2, voter2),
            expectedVoter2ActiveVotesForGroup2
          )
        })

        it("should increment the accounts' total votes", async () => {
          assertEqualBN(
            await election.getTotalVotesByAccount(voter),
            expectedVoterActiveVotesForGroup
          )
          assertEqualBN(
            await election.getTotalVotesByAccount(voter2),
            expectedVoter2ActiveVotesForGroup.plus(expectedVoter2ActiveVotesForGroup2)
          )
        })

        it('should increment the total votes for the groups', async () => {
          assertEqualBN(await election.getTotalVotesForGroup(group), expectedGroupTotalActiveVotes)
          assertEqualBN(
            await election.getTotalVotesForGroup(group2),
            expectedVoter2ActiveVotesForGroup2
          )
        })

        it('should increment the total votes', async () => {
          assertEqualBN(
            await election.getTotalVotes(),
            expectedGroupTotalActiveVotes.plus(expectedVoter2ActiveVotesForGroup2)
          )
        })

        it('should update the ordering of the eligible groups', async () => {
          assert.deepEqual(await election.getEligibleValidatorGroups(), [group2, group])
        })
      })
    })
  })
})
