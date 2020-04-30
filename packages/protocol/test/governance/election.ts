import { CeloContractName } from '@celo/protocol/lib/registry-utils'
import {
  assertAlmostEqualBN,
  assertContainSubset,
  assertEqualBN,
  assertRevert,
  mineBlocks,
  NULL_ADDRESS,
} from '@celo/protocol/lib/test-utils'
import { normalizeAddressWith0x } from '@celo/utils/lib/address'
import { fixed1, toFixed } from '@celo/utils/lib/fixidity'
import BigNumber from 'bignumber.js'
import {
  AccountsContract,
  AccountsInstance,
  ElectionTestContract,
  ElectionTestInstance,
  FreezerContract,
  FreezerInstance,
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
const Freezer: FreezerContract = artifacts.require('Freezer')
const MockLockedGold: MockLockedGoldContract = artifacts.require('MockLockedGold')
const MockValidators: MockValidatorsContract = artifacts.require('MockValidators')
const MockRandom: MockRandomContract = artifacts.require('MockRandom')
const Registry: RegistryContract = artifacts.require('Registry')

// @ts-ignore
// TODO(mcortesi): Use BN
ElectionTest.numberFormat = 'BigNumber'
// @ts-ignoree
MockLockedGold.numberFormat = 'BigNumber'

// Hard coded in ganache.
const EPOCH = 100

contract('Election', (accounts: string[]) => {
  let accountsInstance: AccountsInstance
  let election: ElectionTestInstance
  let freezer: FreezerInstance
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
    freezer = await Freezer.new()
    mockLockedGold = await MockLockedGold.new()
    mockValidators = await MockValidators.new()
    registry = await Registry.new()
    await registry.setAddressFor(CeloContractName.Accounts, accountsInstance.address)
    await registry.setAddressFor(CeloContractName.Freezer, freezer.address)
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
            beforeEach(async () => {
              await mockLockedGold.incrementNonvotingAccountBalance(voter, value)
            })

            describe('when the voter has not already voted for this group', () => {
              let resp: any
              beforeEach(async () => {
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

              describe('when the voter has already voted for this group', () => {
                let response: any
                beforeEach(async () => {
                  await mockLockedGold.incrementNonvotingAccountBalance(voter, value)
                  response = await election.vote(group, value, NULL_ADDRESS, NULL_ADDRESS)
                })

                it('should not change the list of groups the account has voted for', async () => {
                  assert.deepEqual(await election.getGroupsVotedForByAccount(voter), [group])
                })

                it("should increment the account's pending votes for the group", async () => {
                  assertEqualBN(
                    await election.getPendingVotesForGroupByAccount(group, voter),
                    value.times(2)
                  )
                })

                it("should increment the account's total votes for the group", async () => {
                  assertEqualBN(
                    await election.getTotalVotesForGroupByAccount(group, voter),
                    value.times(2)
                  )
                })

                it("should increment the account's total votes", async () => {
                  assertEqualBN(await election.getTotalVotesByAccount(voter), value.times(2))
                })

                it('should increment the total votes for the group', async () => {
                  assertEqualBN(await election.getTotalVotesForGroup(group), value.times(2))
                })

                it('should increment the total votes', async () => {
                  assertEqualBN(await election.getTotalVotes(), value.times(2))
                })

                it("should decrement the account's nonvoting locked gold balance", async () => {
                  assertEqualBN(await mockLockedGold.nonvotingAccountBalance(voter), 0)
                })

                it('should emit the ValidatorGroupVoteCast event', async () => {
                  assert.equal(response.logs.length, 1)
                  const log = response.logs[0]
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

        it('should emit the ValidatorGroupPendingVoteRevoked event', async () => {
          assert.equal(resp.logs.length, 1)
          const log = resp.logs[0]
          assertContainSubset(log, {
            event: 'ValidatorGroupPendingVoteRevoked',
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
    const voter0 = accounts[0]
    const voter1 = accounts[1]
    const group = accounts[2]
    const voteValue0 = 1000
    const reward0 = 111
    const voteValue1 = 1000
    describe('when the voter has active votes', () => {
      const assertConsistentSums = async () => {
        const active0 = await election.getActiveVotesForGroupByAccount(group, voter0)
        const active1 = await election.getActiveVotesForGroupByAccount(group, voter1)
        const activeTotal = await election.getActiveVotesForGroup(group)
        // This can vary by up to 1 wei due to rounding errors.
        assertAlmostEqualBN(activeTotal, active0.plus(active1), 1)
        const pending0 = await election.getPendingVotesForGroupByAccount(group, voter0)
        const pending1 = await election.getPendingVotesForGroupByAccount(group, voter1)
        const pendingTotal = pending0.plus(pending1)
        const totalGroup = await election.getTotalVotesForGroup(group)
        // This can vary by up to 1 wei due to rounding errors.
        assertAlmostEqualBN(totalGroup, activeTotal.plus(pendingTotal), 1)
        const total = await election.getTotalVotes()
        assertEqualBN(total, totalGroup)
      }

      beforeEach(async () => {
        await mockValidators.setMembers(group, [accounts[9]])
        await registry.setAddressFor(CeloContractName.Validators, accounts[0])
        await election.markGroupEligible(group, NULL_ADDRESS, NULL_ADDRESS)
        await registry.setAddressFor(CeloContractName.Validators, mockValidators.address)
        await mockLockedGold.setTotalLockedGold(voteValue0 + voteValue1)
        await mockValidators.setNumRegisteredValidators(1)
        await mockLockedGold.incrementNonvotingAccountBalance(voter0, voteValue0)
        await mockLockedGold.incrementNonvotingAccountBalance(voter1, voteValue1)
        // Gives 1000 units to voter 0
        await election.vote(group, voteValue0, NULL_ADDRESS, NULL_ADDRESS)
        await assertConsistentSums()
        await mineBlocks(EPOCH, web3)
        await election.activate(group)
        await assertConsistentSums()

        // Makes those 1000 units represent 1111 votes.
        await election.distributeEpochRewards(group, reward0, NULL_ADDRESS, NULL_ADDRESS)
        await assertConsistentSums()

        // Gives 900 units to voter 1.
        await election.vote(group, voteValue1, NULL_ADDRESS, NULL_ADDRESS, { from: voter1 })
        await assertConsistentSums()
        await mineBlocks(EPOCH, web3)
        await election.activate(group, { from: voter1 })
        await assertConsistentSums()
      })

      describe('when the revoked value is less than the active votes', () => {
        const index = 0
        const remaining = 1
        const revokedValue = voteValue0 + reward0 - remaining
        let resp: any
        beforeEach(async () => {
          resp = await election.revokeActive(group, revokedValue, NULL_ADDRESS, NULL_ADDRESS, index)
        })

        it('should be consistent', async () => {
          await assertConsistentSums()
        })

        it("should decrement the account's active votes for the group", async () => {
          assertEqualBN(await election.getActiveVotesForGroupByAccount(group, voter0), remaining)
        })

        it("should decrement the account's total votes for the group", async () => {
          assertEqualBN(await election.getTotalVotesForGroupByAccount(group, voter0), remaining)
        })

        it("should decrement the account's total votes", async () => {
          assertEqualBN(await election.getTotalVotesByAccount(voter0), remaining)
        })

        it('should decrement the total votes for the group', async () => {
          assertEqualBN(
            await election.getTotalVotesForGroup(group),
            voteValue0 + reward0 + voteValue1 - revokedValue
          )
        })

        it('should decrement the total votes', async () => {
          assertEqualBN(
            await election.getTotalVotes(),
            voteValue0 + reward0 + voteValue1 - revokedValue
          )
        })

        it("should increment the account's nonvoting locked gold balance", async () => {
          assertEqualBN(await mockLockedGold.nonvotingAccountBalance(voter0), revokedValue)
        })

        it('should emit the ValidatorGroupActiveVoteRevoked event', async () => {
          assert.equal(resp.logs.length, 1)
          const log = resp.logs[0]
          assertContainSubset(log, {
            event: 'ValidatorGroupActiveVoteRevoked',
            args: {
              account: voter0,
              group,
              value: new BigNumber(revokedValue),
            },
          })
        })
      })

      describe('when the revoked value is equal to the active votes', () => {
        describe('when the correct index is provided', () => {
          const index = 0
          const revokedValue = voteValue0 + reward0
          beforeEach(async () => {
            await election.revokeActive(group, revokedValue, NULL_ADDRESS, NULL_ADDRESS, index)
          })

          it('should be consistent', async () => {
            await assertConsistentSums()
          })

          it("should decrement the account's active votes for the group", async () => {
            assertEqualBN(await election.getActiveVotesForGroupByAccount(group, voter0), 0)
          })

          it("should decrement the account's total votes for the group", async () => {
            assertEqualBN(await election.getTotalVotesForGroupByAccount(group, voter0), 0)
          })

          it("should decrement the account's total votes", async () => {
            assertEqualBN(await election.getTotalVotesByAccount(voter0), 0)
          })

          it('should decrement the total votes for the group', async () => {
            assertEqualBN(await election.getTotalVotesForGroup(group), voteValue1)
          })

          it('should decrement the total votes', async () => {
            assertEqualBN(await election.getTotalVotes(), voteValue1)
          })

          it("should increment the account's nonvoting locked gold balance", async () => {
            assertEqualBN(await mockLockedGold.nonvotingAccountBalance(voter0), revokedValue)
          })

          it('should remove the group to the list of groups the account has voted for', async () => {
            assert.deepEqual(await election.getGroupsVotedForByAccount(voter0), [])
          })
        })

        describe('when the wrong index is provided', () => {
          const index = 1
          it('should revert', async () => {
            await assertRevert(
              election.revokeActive(group, voteValue0 + reward0, NULL_ADDRESS, NULL_ADDRESS, index)
            )
          })
        })
      })

      describe('when the revoked value is greater than the active votes', () => {
        const index = 0
        it('should revert', async () => {
          await assertRevert(
            election.revokeActive(
              group,
              voteValue0 + reward0 + 1,
              NULL_ADDRESS,
              NULL_ADDRESS,
              index
            )
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
      assert.sameMembers(
        actual.map((x) => x.toLowerCase()),
        expected.map((x) => x.toLowerCase())
      )
    }

    const setRandomness = async (hash: string) =>
      random.addTestRandomness((await web3.eth.getBlockNumber()) + 1, hash)

    beforeEach(async () => {
      random = await MockRandom.new()
      await registry.setAddressFor(CeloContractName.Random, random.address)
    })

    describe('when there is a large number of groups', () => {
      const numbers: any = {}
      beforeEach(async () => {
        await mockLockedGold.setTotalLockedGold(new BigNumber(1e25))
        await mockValidators.setNumRegisteredValidators(400)
        await mockLockedGold.incrementNonvotingAccountBalance(voter1.address, new BigNumber(1e25))
        await election.setElectabilityThreshold(0)
        await election.setElectableValidators(10, 100)

        await election.setMaxNumGroupsVotedFor(200)
        let prev = NULL_ADDRESS
        let randomVotes = []
        for (let i = 0; i < 100; i++) {
          randomVotes.push(Math.floor(Math.random() * 1e14))
        }
        const pad = (a: string) => {
          let res = a
          while (res.length < 42) {
            res = res + 'f'
          }
          return res
        }
        randomVotes = randomVotes.sort((a, b) => b - a)
        for (let i = 0; i < 100; i++) {
          await mockValidators.setMembers(pad('0x00' + i), [
            pad('0x1a' + i),
            pad('0x2a' + i),
            pad('0x3a' + i),
            pad('0x4a' + i),
          ])
          numbers[pad('0x1a' + i)] = randomVotes[i]
          numbers[pad('0x2a' + i)] = randomVotes[i] / 2
          numbers[pad('0x3a' + i)] = randomVotes[i] / 3
          numbers[pad('0x4a' + i)] = randomVotes[i] / 4
          await registry.setAddressFor(CeloContractName.Validators, accounts[0])
          await election.markGroupEligible(pad('0x00' + i), NULL_ADDRESS, prev)
          await registry.setAddressFor(CeloContractName.Validators, mockValidators.address)
          await election.vote(pad('0x00' + i), randomVotes[i], NULL_ADDRESS, prev, {
            from: voter1.address,
          })
          prev = pad('0x00' + i)
        }
      })
      it('can elect correct validators', async () => {
        const lst = await election.electValidatorSigners()
        const smallest = lst
          .map(normalizeAddressWith0x)
          .map((a) => numbers[a])
          .sort((a, b) => a - b)[0]
        // TODO fix types
        const number100th = (Object as any).values(numbers).sort((a: any, b: any) => b - a)[99]
        assert.equal(smallest, number100th)
      })
    })

    describe('when there are some groups', () => {
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
  })

  describe('#getGroupEpochRewards', () => {
    const voter = accounts[0]
    const group1 = accounts[1]
    const group2 = accounts[2]
    const voteValue1 = new BigNumber(2000000000)
    const voteValue2 = new BigNumber(1000000000)
    const totalRewardValue = new BigNumber(3000000000)
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
        describe('when group uptime is 100%', () => {
          it('should return the total reward value', async () => {
            assertEqualBN(
              await election.getGroupEpochRewards(group1, totalRewardValue, [fixed1]),
              totalRewardValue
            )
          })
        })

        describe('when group uptime is less than 100%', () => {
          it('should return part of the total reward value', async () => {
            assertEqualBN(
              await election.getGroupEpochRewards(group1, totalRewardValue, [toFixed(0.5)]),
              totalRewardValue.idiv(2)
            )
          })
        })

        describe('when group uptime is zero', () => {
          it('should return zero', async () => {
            assertEqualBN(await election.getGroupEpochRewards(group1, totalRewardValue, [0]), 0)
          })
        })
      })

      describe('when the group does not meet the locked gold requirements ', () => {
        beforeEach(async () => {
          await mockValidators.setDoesNotMeetAccountLockedGoldRequirements(group1)
        })

        it('should return zero', async () => {
          assertEqualBN(await election.getGroupEpochRewards(group1, totalRewardValue, [fixed1]), 0)
        })
      })
    })

    describe('when two groups have active votes', () => {
      const expectedGroup1EpochRewards = voteValue1
        .div(voteValue1.plus(voteValue2))
        .times(totalRewardValue)
        .dp(0)
        .minus(1) // minus 1 wei for rounding errors.
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
          assertEqualBN(await election.getGroupEpochRewards(group2, totalRewardValue, [fixed1]), 0)
        })

        it('should return the proportional reward value for the other group', async () => {
          assertEqualBN(
            await election.getGroupEpochRewards(group1, totalRewardValue, [fixed1]),
            expectedGroup1EpochRewards
          )
        })
      })
    })

    describe('when the group does not have active votes', () => {
      describe('when the group meets the locked gold requirements ', () => {
        it('should return zero', async () => {
          assertEqualBN(await election.getGroupEpochRewards(group1, totalRewardValue, [fixed1]), 0)
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

  describe('#forceDecrementVotes', () => {
    const voter = accounts[0]
    const group = accounts[1]
    const value = 1000

    describe('when the account has voted for one group', () => {
      beforeEach(async () => {
        await mockValidators.setMembers(group, [accounts[9]])
        await registry.setAddressFor(CeloContractName.Validators, accounts[0])
        await election.markGroupEligible(group, NULL_ADDRESS, NULL_ADDRESS)
        await registry.setAddressFor(CeloContractName.Validators, mockValidators.address)
        await mockLockedGold.setTotalLockedGold(value)
        await mockValidators.setNumRegisteredValidators(1)
        await mockLockedGold.incrementNonvotingAccountBalance(voter, value)
        await election.vote(group, value, NULL_ADDRESS, NULL_ADDRESS)
        await registry.setAddressFor(CeloContractName.LockedGold, accounts[2])
      })

      describe('when the account only has pending votes', () => {
        describe('when the account is slashed for the total pending voted gold', () => {
          const index = 0
          const slashedValue = value
          const remaining = value - slashedValue
          beforeEach(async () => {
            await election.forceDecrementVotes(
              voter,
              slashedValue,
              [NULL_ADDRESS],
              [NULL_ADDRESS],
              [index],
              {
                from: accounts[2],
              }
            )
          })

          it('should decrement pending votes to zero', async () => {
            assertEqualBN(await election.getPendingVotesForGroupByAccount(group, voter), remaining)
          })

          it('should decrement total votes to zero', async () => {
            assertEqualBN(await election.getTotalVotesForGroupByAccount(group, voter), remaining)
            assertEqualBN(await election.getTotalVotesByAccount(voter), remaining)
            assertEqualBN(await election.getTotalVotesForGroup(group), remaining)
            assertEqualBN(await election.getTotalVotes(), remaining)
          })

          it("should remove the group from the voter's voted set", async () => {
            assert.deepEqual(await election.getGroupsVotedForByAccount(voter), [])
          })
        })
      })

      describe('when the account only has active votes', () => {
        beforeEach(async () => {
          await mineBlocks(EPOCH, web3)
          await election.activate(group)
        })

        describe('when the account is slashed for the total active voting gold', () => {
          const index = 0
          const slashedValue = value
          const remaining = value - slashedValue
          beforeEach(async () => {
            await election.forceDecrementVotes(
              voter,
              slashedValue,
              [NULL_ADDRESS],
              [NULL_ADDRESS],
              [index],
              {
                from: accounts[2],
              }
            )
          })

          it('should decrement active voted gold to zero', async () => {
            assertEqualBN(await election.getActiveVotesForGroupByAccount(group, voter), remaining)
          })

          it('should decrement total voted gold to zero', async () => {
            assertEqualBN(await election.getTotalVotesForGroupByAccount(group, voter), remaining)
            assertEqualBN(await election.getTotalVotesByAccount(voter), remaining)
            assertEqualBN(await election.getTotalVotesForGroup(group), remaining)
            assertEqualBN(await election.getTotalVotes(), remaining)
          })

          it("should remove the group from the voter's voted set", async () => {
            assert.deepEqual(await election.getGroupsVotedForByAccount(voter), [])
          })
        })
      })
    })

    describe('when the account has voted for more than one group equally', () => {
      const group2 = accounts[7]

      beforeEach(async () => {
        await mockValidators.setMembers(group, [accounts[9]])
        await mockValidators.setMembers(group2, [accounts[8]])
        await registry.setAddressFor(CeloContractName.Validators, accounts[0])
        await election.markGroupEligible(group, NULL_ADDRESS, NULL_ADDRESS)
        await election.markGroupEligible(group2, NULL_ADDRESS, group)
        await registry.setAddressFor(CeloContractName.Validators, mockValidators.address)
        await mockLockedGold.setTotalLockedGold(value)
        await mockValidators.setNumRegisteredValidators(2)
        await mockLockedGold.incrementNonvotingAccountBalance(voter, value)
        await election.vote(group, value / 2, group2, NULL_ADDRESS)
        await election.vote(group2, value / 2, NULL_ADDRESS, group)
        await registry.setAddressFor(CeloContractName.LockedGold, accounts[2])
      })

      describe('when the accounts only have pending votes', () => {
        describe('when both accounts are slashed for the total pending voted gold', () => {
          const slashedValue = value
          const remaining = value - slashedValue

          beforeEach(async () => {
            await election.forceDecrementVotes(
              voter,
              slashedValue,
              [group2, NULL_ADDRESS],
              [NULL_ADDRESS, group],
              [0, 1],
              { from: accounts[2] }
            )
          })

          it("should decrement both group's pending votes to zero", async () => {
            assertEqualBN(await election.getPendingVotesForGroupByAccount(group, voter), remaining)
            assertEqualBN(await election.getPendingVotesForGroupByAccount(group2, voter), remaining)
          })

          it("should decrement both group's total votes to zero", async () => {
            assertEqualBN(await election.getTotalVotesForGroupByAccount(group, voter), remaining)
            assertEqualBN(await election.getTotalVotesByAccount(voter), remaining)
            assertEqualBN(await election.getTotalVotesForGroup(group), remaining)
            assertEqualBN(await election.getTotalVotesForGroup(group2), remaining)
            assertEqualBN(await election.getTotalVotes(), remaining)
          })

          it("should remove the groups from the voter's voted set", async () => {
            assert.deepEqual(await election.getGroupsVotedForByAccount(voter), [])
          })
        })
      })
    })

    describe('when the account has voted for more than one group inequally', () => {
      const group2 = accounts[7]
      const value2 = value * 1.5

      beforeEach(async () => {
        await mockValidators.setMembers(group, [accounts[9]])
        await mockValidators.setMembers(group2, [accounts[8]])
        await registry.setAddressFor(CeloContractName.Validators, accounts[0])
        await election.markGroupEligible(group, NULL_ADDRESS, NULL_ADDRESS)
        await election.markGroupEligible(group2, group, NULL_ADDRESS)
        await registry.setAddressFor(CeloContractName.Validators, mockValidators.address)
        await mockLockedGold.setTotalLockedGold(value + value2)
        await mockValidators.setNumRegisteredValidators(2)
        await mockLockedGold.incrementNonvotingAccountBalance(voter, value + value2)
        await election.vote(group2, value2 / 2, group, NULL_ADDRESS)
        await election.vote(group, value / 2, NULL_ADDRESS, group2)
      })

      describe('when both groups have both pending and active votes', async () => {
        beforeEach(async () => {
          await mineBlocks(EPOCH, web3)
          await election.activate(group)
          await mineBlocks(EPOCH, web3)
          await election.activate(group2)
          await election.vote(group2, value2 / 2, group, NULL_ADDRESS)
          await election.vote(group, value / 2, NULL_ADDRESS, group2)
          await registry.setAddressFor(CeloContractName.LockedGold, accounts[2])
        })

        describe("when we slash 1 more vote than group 1's pending vote total", async () => {
          const slashedValue = value / 2 + 1
          const remaining = value - slashedValue
          beforeEach(async () => {
            await election.forceDecrementVotes(
              voter,
              slashedValue,
              [NULL_ADDRESS, NULL_ADDRESS],
              [group, group2],
              [0, 1],
              { from: accounts[2] }
            )
          })

          it('should not affect group 2', async () => {
            assertEqualBN(await election.getTotalVotesForGroupByAccount(group2, voter), value2)
            assertEqualBN(await election.getTotalVotesForGroup(group2), value2)
          })

          it("should reduce group 1's votes", async () => {
            assertEqualBN(await election.getTotalVotesForGroupByAccount(group, voter), remaining)
            assertEqualBN(await election.getTotalVotesForGroup(group), remaining)
          })

          it("should reduce `voter`'s total votes", async () => {
            assertEqualBN(await election.getTotalVotesByAccount(voter), value2 + remaining)
          })

          it("should reduce `group1`'s pending votes to 0", async () => {
            assertEqualBN(await election.getPendingVotesForGroupByAccount(group, voter), 0)
          })

          it("should reduce `group1`'s' active votes by 1", async () => {
            assertEqualBN(await election.getActiveVotesForGroupByAccount(group, voter), remaining)
          })
        })

        describe("when we slash all of group 1's votes and some of group 2's", async () => {
          const slashedValue = value + 1
          const totalRemaining = value + value2 - slashedValue
          const group1Remaining = 0
          const group2TotalRemaining = value2 - 1
          // 1 vote is removed from group2, pending is removed first
          const group2PendingRemaining = value2 / 2 - 1
          const group2ActiveRemaining = value2 / 2
          beforeEach(async () => {
            await election.forceDecrementVotes(
              voter,
              slashedValue,
              [group, NULL_ADDRESS],
              [NULL_ADDRESS, group2],
              [0, 1],
              { from: accounts[2] }
            )
          })

          it("should decrement group 1's votes to 0", async () => {
            assertEqualBN(
              await election.getTotalVotesForGroupByAccount(group, voter),
              group1Remaining
            )
            assertEqualBN(await election.getTotalVotesForGroup(group), group1Remaining)
            assertEqualBN(
              await election.getPendingVotesForGroupByAccount(group, voter),
              group1Remaining
            )
            assertEqualBN(
              await election.getActiveVotesForGroupByAccount(group, voter),
              group1Remaining
            )
          })

          it("should decrement group 2's total votes by 1", async () => {
            assertEqualBN(
              await election.getTotalVotesForGroupByAccount(group2, voter),
              group2TotalRemaining
            )
            assertEqualBN(await election.getTotalVotesForGroup(group2), group2TotalRemaining)
          })

          it("should reduce `voter`'s total votes", async () => {
            assertEqualBN(await election.getTotalVotesByAccount(voter), totalRemaining)
          })

          it("should reduce `group2`'s pending votes by 1", async () => {
            assertEqualBN(
              await election.getPendingVotesForGroupByAccount(group2, voter),
              group2PendingRemaining
            )
          })

          it("should not reduce `group2`'s active votes", async () => {
            assertEqualBN(
              await election.getActiveVotesForGroupByAccount(group2, voter),
              group2ActiveRemaining
            )
          })
        })
      })

      describe('when a slash affects the election order', () => {
        const slashedValue = value / 4
        const group1RemainingActiveVotes = value - slashedValue
        let initialGroupOrdering = []

        beforeEach(async () => {
          await election.vote(group, value / 2, group2, NULL_ADDRESS)
          await mineBlocks(EPOCH, web3)
          await election.activate(group)
          await mineBlocks(EPOCH, web3)
          await election.activate(group2)
          initialGroupOrdering = (await election.getTotalVotesForEligibleValidatorGroups())[0]
          await registry.setAddressFor(CeloContractName.LockedGold, accounts[2])
          await election.forceDecrementVotes(
            voter,
            slashedValue,
            [group, NULL_ADDRESS],
            [NULL_ADDRESS, group2],
            [0, 1],
            { from: accounts[2] }
          )
        })

        it("should decrement group 1's total votes by 1/4", async () => {
          assertEqualBN(
            await election.getTotalVotesForGroupByAccount(group, voter),
            group1RemainingActiveVotes
          )
          assertEqualBN(await election.getTotalVotesForGroup(group), group1RemainingActiveVotes)
        })

        it('should change the ordering of the election', async () => {
          const newGroupOrdering = (await election.getTotalVotesForEligibleValidatorGroups())[0]
          assert.notEqual(initialGroupOrdering, newGroupOrdering)
          assert.equal(initialGroupOrdering[0], newGroupOrdering[1])
          assert.equal(initialGroupOrdering[1], newGroupOrdering[0])
        })
      })

      describe('when `forceDecrementVotes` is called with malformed inputs', () => {
        describe('when called to slash more value than groups have', () => {
          it('should revert', async () => {
            await assertRevert(
              election.forceDecrementVotes(
                voter,
                value + value2 + 1,
                [group, NULL_ADDRESS],
                [NULL_ADDRESS, group2],
                [0, 1],
                { from: accounts[2] }
              )
            )
          })
        })

        describe('when called to slash with incorrect lessers/greaters', () => {
          it('should revert', async () => {
            const slashedValue = value
            // `group` should be listed as a lesser for index 0 (group2's lesser)
            await assertRevert(
              election.forceDecrementVotes(
                voter,
                slashedValue,
                [NULL_ADDRESS, NULL_ADDRESS],
                [NULL_ADDRESS, group2],
                [0, 1],
                { from: accounts[2] }
              )
            )
          })
        })

        describe('when called to slash with incorrect indices', () => {
          it('should revert', async () => {
            const slashedValue = value
            await assertRevert(
              election.forceDecrementVotes(
                voter,
                slashedValue,
                [group, NULL_ADDRESS],
                [NULL_ADDRESS, group2],
                [0, 0],
                { from: accounts[2] }
              )
            )
          })
        })

        describe('when called from an address other than the locked gold contract', () => {
          it('should revert', async () => {
            await assertRevert(
              election.forceDecrementVotes(
                voter,
                value,
                [group, NULL_ADDRESS],
                [NULL_ADDRESS, group2],
                [0, 0]
              )
            )
          })
        })
      })
    })
  })

  describe('#consistencyChecks', () => {
    const debug = false
    const group = accounts[0]
    const voters = accounts.slice(1)
    interface Account {
      address: string
      nonvoting: BigNumber
      pending: BigNumber
      active: BigNumber
    }

    const debugLog = (s: string) => {
      if (debug) {
        // tslint:disable-next-line: no-console
        console.log(s)
      }
    }

    const printAccount = async (account: Account) => {
      if (debug) {
        debugLog(
          `Expected ${
            account.address
          }:\n\tnonvoting: ${account.nonvoting.toFixed()}\n\tpending: ${account.pending.toFixed()}\n\tactive: ${account.active.toFixed()}`
        )
        debugLog(
          `Actual ${account.address}:\n\tnonvoting: ${(
            await mockLockedGold.nonvotingAccountBalance(account.address)
          ).toFixed()}\n\tpending: ${(
            await election.getPendingVotesForGroupByAccount(group, account.address)
          ).toFixed()}\n\tactive: ${(
            await election.getActiveVotesForGroupByAccount(group, account.address)
          ).toFixed()}\n\tunits: ${(
            await election.getActiveVoteUnitsForGroupByAccount(group, account.address)
          ).toFixed()}\n\ttotalunits: ${(
            await election.getActiveVoteUnitsForGroup(group)
          ).toFixed()}\n\ttotalVotes: ${(await election.getActiveVotesForGroup(group)).toFixed()}`
        )
      }
    }

    enum VoteActionType {
      Vote = 1,
      Activate,
      RevokePending,
      RevokeActive,
    }

    const randomElement = <A>(list: A[]): A => {
      return list[
        Math.floor(
          BigNumber.random()
            .times(list.length)
            .toNumber()
        )
      ]
    }

    const randomInteger = (max: BigNumber, min: BigNumber = new BigNumber(1)): BigNumber => {
      return BigNumber.random()
        .times(max.minus(min))
        .plus(min)
        .dp(0)
    }

    const makeRandomAction = async (account: Account) => {
      await printAccount(account)
      const actions = []
      if (account.nonvoting.gt(0)) {
        actions.push(VoteActionType.Vote)
      }
      if (await election.hasActivatablePendingVotes(account.address, group)) {
        actions.push(VoteActionType.Activate)
      }
      if (account.pending.gt(0)) {
        actions.push(VoteActionType.RevokePending)
      }
      if (account.active.gt(0)) {
        actions.push(VoteActionType.RevokeActive)
      }
      const action = randomElement(actions)
      let value: string
      switch (action) {
        case VoteActionType.Vote:
          value = randomInteger(account.nonvoting).toFixed()
          debugLog(`${account.address} voting with value ${value}`)
          await election.vote(group, value, NULL_ADDRESS, NULL_ADDRESS, { from: account.address })
          account.nonvoting = account.nonvoting.minus(value)
          account.pending = account.pending.plus(value)
          break
        case VoteActionType.Activate:
          value = account.pending.toFixed()
          debugLog(`${account.address} activating with value ${value}`)
          await election.activate(group, { from: account.address })
          account.active = account.active.plus(value)
          account.pending = account.pending.minus(value)
          break
        case VoteActionType.RevokePending:
          value = randomInteger(account.pending).toFixed()
          debugLog(`${account.address} revoking pending with value ${value}`)
          await election.revokePending(group, value, NULL_ADDRESS, NULL_ADDRESS, 0, {
            from: account.address,
          })
          account.pending = account.pending.minus(value)
          account.nonvoting = account.nonvoting.plus(value)
          break
        case VoteActionType.RevokeActive:
          value = randomInteger(account.active).toFixed()
          debugLog(`${account.address} revoking active with value ${value}`)
          await election.revokeActive(group, value, NULL_ADDRESS, NULL_ADDRESS, 0, {
            from: account.address,
          })
          account.active = account.active.minus(value)
          account.nonvoting = account.nonvoting.plus(value)
          break
      }
      return account
    }

    const checkVoterInvariants = async (account: Account, delta: number = 0) => {
      await printAccount(account)
      debugLog(`Checking pending vote invariant for ${account.address}`)
      assertEqualBN(
        await election.getPendingVotesForGroupByAccount(group, account.address),
        account.pending
      )
      debugLog(`Checking active vote invariant for ${account.address}`)
      assertAlmostEqualBN(
        await election.getActiveVotesForGroupByAccount(group, account.address),
        account.active,
        delta
      )
      debugLog(`Checking total vote invariant for ${account.address}`)
      assertAlmostEqualBN(
        await election.getTotalVotesForGroupByAccount(group, account.address),
        account.active.plus(account.pending),
        delta
      )
      debugLog(`Checking nonvoting invariant for ${account.address}`)
      assertAlmostEqualBN(
        await mockLockedGold.nonvotingAccountBalance(account.address),
        account.nonvoting,
        delta
      )
    }

    const checkGroupInvariants = async (vAccounts: Account[], delta: number = 0) => {
      const pendingTotal = vAccounts.reduce((a, b) => a.plus(b.pending), new BigNumber(0))
      const activeTotal = vAccounts.reduce((a, b) => a.plus(b.active), new BigNumber(0))
      debugLog(`Checking pending vote invariant for group`)
      assertEqualBN(await election.getPendingVotesForGroup(group), pendingTotal)
      debugLog(`Checking active vote invariant for group`)
      assertAlmostEqualBN(await election.getActiveVotesForGroup(group), activeTotal, delta)
      debugLog(`Checking total vote invariant for group`)
      assertEqualBN(
        await election.getTotalVotesForGroup(group),
        pendingTotal.plus(await election.getActiveVotesForGroup(group))
      )
      assertEqualBN(await election.getTotalVotes(), await election.getTotalVotesForGroup(group))
    }

    const revokeAllAndCheckInvariants = async (delta: number = 0) => {
      const vAccounts = await Promise.all(
        voters.map(async (v) => {
          return {
            address: v,
            active: await election.getActiveVotesForGroupByAccount(group, v),
            pending: await election.getPendingVotesForGroupByAccount(group, v),
            nonvoting: await mockLockedGold.nonvotingAccountBalance(v),
          }
        })
      )

      for (const account of vAccounts) {
        await checkVoterInvariants(account, delta)
        const address = account.address
        // Need to fetch actual number due to potential rounding errors.
        const active = await election.getActiveVotesForGroupByAccount(group, address)
        if (active.gt(0)) {
          await election.revokeActive(group, active.toFixed(), NULL_ADDRESS, NULL_ADDRESS, 0, {
            from: address,
          })
          account.active = new BigNumber(0)
          account.nonvoting = account.nonvoting.plus(active)
        }
        const pending = account.pending
        if (pending.gt(0)) {
          await election.revokePending(group, pending.toFixed(), NULL_ADDRESS, NULL_ADDRESS, 0, {
            from: address,
          })
          account.pending = new BigNumber(0)
          account.nonvoting = account.nonvoting.plus(pending)
        }
        assertEqualBN(await election.getActiveVotesForGroupByAccount(group, address), 0)
        assertEqualBN(await election.getPendingVotesForGroupByAccount(group, address), 0)
        assertEqualBN(await mockLockedGold.nonvotingAccountBalance(address), account.nonvoting)
      }
    }

    let voterAccounts: Account[]
    beforeEach(async () => {
      // 50M gives us 450M total locked gold
      const voterStartBalance = new BigNumber(web3.utils.toWei('50000000'))
      await mockValidators.setMembers(group, [accounts[9]])
      await registry.setAddressFor(CeloContractName.Validators, accounts[0])
      await election.markGroupEligible(group, NULL_ADDRESS, NULL_ADDRESS)
      await registry.setAddressFor(CeloContractName.Validators, mockValidators.address)
      await mockLockedGold.setTotalLockedGold(voterStartBalance.times(voters.length))
      await mockValidators.setNumRegisteredValidators(1)
      await Promise.all(
        voters.map((voter) =>
          mockLockedGold.incrementNonvotingAccountBalance(voter, voterStartBalance)
        )
      )
      voterAccounts = voters.map((v) => {
        return {
          address: v,
          nonvoting: voterStartBalance,
          pending: new BigNumber(0),
          active: new BigNumber(0),
        }
      })
    })

    describe('when placing, activating, and revoking votes randomly', function(this: any) {
      this.timeout(0)
      describe('when no epoch rewards are distributed', () => {
        it('actual and expected should always match exactly', async () => {
          for (let i = 0; i < 10; i++) {
            voterAccounts = await Promise.all(voterAccounts.map(makeRandomAction))
            await Promise.all(voterAccounts.map(checkVoterInvariants))
            await checkGroupInvariants(voterAccounts)
            await mineBlocks(EPOCH, web3)
          }
          await revokeAllAndCheckInvariants()
        })
      })

      describe('when epoch rewards are distributed', () => {
        it('actual and expected should always match within a small delta', async () => {
          const distributeEpochRewards = async (vAccounts: Account[]) => {
            // 1% compounded 100x gives up to a 2.7x multiplier.
            const reward = randomInteger((await election.getTotalVotes()).times(0.01).dp(0))
            const activeTotal = vAccounts.reduce((a, b) => a.plus(b.active), new BigNumber(0))
            if (!reward.isZero() && !activeTotal.isZero()) {
              debugLog(`Distributing ${reward.toFixed()} in rewards to voters`)
              await election.distributeEpochRewards(
                group,
                reward.toFixed(),
                NULL_ADDRESS,
                NULL_ADDRESS
              )
              // tslint:disable-next-line
              for (let i = 0; i < vAccounts.length; i++) {
                vAccounts[i].active = activeTotal
                  .plus(reward)
                  .times(vAccounts[i].active)
                  .div(activeTotal)
                  .dp(0)
                await printAccount(vAccounts[i])
              }
            }
            return vAccounts
          }

          for (let i = 0; i < 30; i++) {
            debugLog(`Starting iteration ${i}`)
            voterAccounts = await Promise.all(voterAccounts.map(makeRandomAction))
            await Promise.all(voterAccounts.map((v) => checkVoterInvariants(v, 10)))
            await checkGroupInvariants(voterAccounts, 10)

            await mineBlocks(EPOCH, web3)
            voterAccounts = await distributeEpochRewards(voterAccounts)
            await Promise.all(voterAccounts.map((v) => checkVoterInvariants(v, 10)))
            await checkGroupInvariants(voterAccounts, 10)
          }
          await revokeAllAndCheckInvariants(10)
        })
      })
    })
  })
})
