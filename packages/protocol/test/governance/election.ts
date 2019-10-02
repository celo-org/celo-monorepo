import { CeloContractName } from '@celo/protocol/lib/registry-utils'
import {
  assertContainSubset,
  assertEqualBN,
  assertRevert,
  NULL_ADDRESS,
} from '@celo/protocol/lib/test-utils'
import { toFixed } from '@celo/utils/lib/fixidity'
import BigNumber from 'bignumber.js'
import {
  MockLockedGoldContract,
  MockLockedGoldInstance,
  MockValidatorsContract,
  MockValidatorsInstance,
  MockRandomContract,
  MockRandomInstance,
  RegistryContract,
  RegistryInstance,
  ElectionContract,
  ElectionInstance,
} from 'types'

const Election: ElectionContract = artifacts.require('Election')
const MockLockedGold: MockLockedGoldContract = artifacts.require('MockLockedGold')
const MockValidators: MockValidatorsContract = artifacts.require('MockValidators')
const MockRandom: MockRandomContract = artifacts.require('MockRandom')
const Registry: RegistryContract = artifacts.require('Registry')

// @ts-ignore
// TODO(mcortesi): Use BN
Election.numberFormat = 'BigNumber'

contract('Election', (accounts: string[]) => {
  let election: ElectionInstance
  let registry: RegistryInstance
  let mockLockedGold: MockLockedGoldInstance
  let mockValidators: MockValidatorsInstance

  const nonOwner = accounts[1]
  const minElectableValidators = new BigNumber(4)
  const maxElectableValidators = new BigNumber(6)
  const maxVotesPerAccount = new BigNumber(3)
  const electabilityThreshold = new BigNumber(0)

  beforeEach(async () => {
    election = await Election.new()
    mockLockedGold = await MockLockedGold.new()
    mockValidators = await MockValidators.new()
    registry = await Registry.new()
    await registry.setAddressFor(CeloContractName.LockedGold, mockLockedGold.address)
    await registry.setAddressFor(CeloContractName.Validators, mockValidators.address)
    await election.initialize(
      registry.address,
      minElectableValidators,
      maxElectableValidators,
      maxVotesPerAccount,
      electabilityThreshold
    )
  })

  describe('#initialize()', () => {
    it('should have set the owner', async () => {
      const owner: string = await election.owner()
      assert.equal(owner, accounts[0])
    })

    it('should have set minElectableValidators', async () => {
      const actualMinElectableValidators = await election.minElectableValidators()
      assertEqualBN(actualMinElectableValidators, minElectableValidators)
    })

    it('should have set maxElectableValidators', async () => {
      const actualMaxElectableValidators = await election.maxElectableValidators()
      assertEqualBN(actualMaxElectableValidators, maxElectableValidators)
    })

    it('should have set maxVotesPerAccount', async () => {
      const actualMaxVotesPerAccount = await election.maxVotesPerAccount()
      assertEqualBN(actualMaxVotesPerAccount, maxVotesPerAccount)
    })

    it('should not be callable again', async () => {
      await assertRevert(
        election.initialize(
          registry.address,
          minElectableValidators,
          maxElectableValidators,
          maxVotesPerAccount,
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

  describe('#setMinElectableValidators', () => {
    const newMinElectableValidators = minElectableValidators.plus(1)
    it('should set the minimum electable valdiators', async () => {
      await election.setMinElectableValidators(newMinElectableValidators)
      assertEqualBN(await election.minElectableValidators(), newMinElectableValidators)
    })

    it('should emit the MinElectableValidatorsSet event', async () => {
      const resp = await election.setMinElectableValidators(newMinElectableValidators)
      assert.equal(resp.logs.length, 1)
      const log = resp.logs[0]
      assertContainSubset(log, {
        event: 'MinElectableValidatorsSet',
        args: {
          minElectableValidators: new BigNumber(newMinElectableValidators),
        },
      })
    })

    it('should revert when the minElectableValidators is zero', async () => {
      await assertRevert(election.setMinElectableValidators(0))
    })

    it('should revert when the minElectableValidators is greater than maxElectableValidators', async () => {
      await assertRevert(election.setMinElectableValidators(maxElectableValidators.plus(1)))
    })

    it('should revert when the minElectableValidators is unchanged', async () => {
      await assertRevert(election.setMinElectableValidators(minElectableValidators))
    })

    it('should revert when called by anyone other than the owner', async () => {
      await assertRevert(
        election.setMinElectableValidators(newMinElectableValidators, { from: nonOwner })
      )
    })
  })

  describe('#setMaxElectableValidators', () => {
    const newMaxElectableValidators = maxElectableValidators.plus(1)
    it('should set the max electable validators', async () => {
      await election.setMaxElectableValidators(newMaxElectableValidators)
      assertEqualBN(await election.maxElectableValidators(), newMaxElectableValidators)
    })

    it('should emit the MaxElectableValidatorsSet event', async () => {
      const resp = await election.setMaxElectableValidators(newMaxElectableValidators)
      assert.equal(resp.logs.length, 1)
      const log = resp.logs[0]
      assertContainSubset(log, {
        event: 'MaxElectableValidatorsSet',
        args: {
          maxElectableValidators: new BigNumber(newMaxElectableValidators),
        },
      })
    })

    it('should revert when the maxElectableValidators is less than minElectableValidators', async () => {
      await assertRevert(election.setMaxElectableValidators(minElectableValidators.minus(1)))
    })

    it('should revert when the maxElectableValidators is unchanged', async () => {
      await assertRevert(election.setMaxElectableValidators(maxElectableValidators))
    })

    it('should revert when called by anyone other than the owner', async () => {
      await assertRevert(
        election.setMaxElectableValidators(newMaxElectableValidators, { from: nonOwner })
      )
    })
  })

  describe('#setMaxVotesPerAccount', () => {
    const newMaxVotesPerAccount = maxVotesPerAccount.plus(1)
    it('should set the max electable validators', async () => {
      await election.setMaxVotesPerAccount(newMaxVotesPerAccount)
      assertEqualBN(await election.maxVotesPerAccount(), newMaxVotesPerAccount)
    })

    it('should emit the MaxVotesPerAccountSet event', async () => {
      const resp = await election.setMaxVotesPerAccount(newMaxVotesPerAccount)
      assert.equal(resp.logs.length, 1)
      const log = resp.logs[0]
      assertContainSubset(log, {
        event: 'MaxVotesPerAccountSet',
        args: {
          maxVotesPerAccount: new BigNumber(newMaxVotesPerAccount),
        },
      })
    })

    it('should revert when the maxVotesPerAccount is unchanged', async () => {
      await assertRevert(election.setMaxVotesPerAccount(maxVotesPerAccount))
    })

    it('should revert when called by anyone other than the owner', async () => {
      await assertRevert(election.setMaxVotesPerAccount(newMaxVotesPerAccount, { from: nonOwner }))
    })
  })

  describe('#markGroupEligible', () => {
    const group = accounts[1]
    describe('when the group has members', () => {
      beforeEach(async () => {
        await mockValidators.setMembers(group, [accounts[9]])
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

    describe('when the group has no members', () => {
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
        await election.markGroupEligible(group, NULL_ADDRESS, NULL_ADDRESS)
      })

      describe('when called by the registered Validators contract', () => {
        let resp: any
        beforeEach(async () => {
          await registry.setAddressFor(CeloContractName.Validators, accounts[0])
          resp = await election.markGroupIneligible(group)
        })

        describe('when the group has votes', () => {})

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
    const value = 1000
    describe('when the group is eligible', () => {
      beforeEach(async () => {
        await mockValidators.setMembers(group, [accounts[9]])
        await election.markGroupEligible(group, NULL_ADDRESS, NULL_ADDRESS)
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
              assert.deepEqual(await election.getAccountGroupsVotedFor(voter), [group])
            })

            it("should increment the account's pending votes for the group", async () => {
              assertEqualBN(await election.getAccountPendingVotesForGroup(group, voter), value)
            })

            it("should increment the account's total votes for the group", async () => {
              assertEqualBN(await election.getAccountTotalVotesForGroup(group, voter), value)
            })

            it("should increment the account's total votes", async () => {
              assertEqualBN(await election.getAccountTotalVotes(voter), value)
            })

            it('should increment the total votes for the group', async () => {
              assertEqualBN(await election.getGroupTotalVotes(group), value)
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
              await mockLockedGold.incrementNonvotingAccountBalance(voter, value - 1)
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
            for (let i = 0; i < maxVotesPerAccount.toNumber(); i++) {
              newGroup = accounts[i + 2]
              await mockValidators.setMembers(newGroup, [accounts[9]])
              await election.markGroupEligible(newGroup, group, NULL_ADDRESS)
              await election.vote(newGroup, 1, group, NULL_ADDRESS)
            }
          })

          it('should revert', async () => {
            await assertRevert(
              election.vote(group, value - maxVotesPerAccount.toNumber(), newGroup, NULL_ADDRESS)
            )
          })
        })
      })

      describe('when the group cannot receive votes', () => {
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
      await election.markGroupEligible(group, NULL_ADDRESS, NULL_ADDRESS)
      await mockLockedGold.setTotalLockedGold(value)
      await mockValidators.setNumRegisteredValidators(1)
      await mockLockedGold.incrementNonvotingAccountBalance(voter, value)
    })

    describe('when the voter has pending votes', () => {
      let resp: any
      beforeEach(async () => {
        await election.vote(group, value, NULL_ADDRESS, NULL_ADDRESS)
        resp = await election.activate(group)
      })

      it("should decrement the account's pending votes for the group", async () => {
        assertEqualBN(await election.getAccountPendingVotesForGroup(group, voter), 0)
      })

      it("should increment the account's active votes for the group", async () => {
        assertEqualBN(await election.getAccountActiveVotesForGroup(group, voter), value)
      })

      it("should not modify the account's total votes for the group", async () => {
        assertEqualBN(await election.getAccountTotalVotesForGroup(group, voter), value)
      })

      it("should not modify the account's total votes", async () => {
        assertEqualBN(await election.getAccountTotalVotes(voter), value)
      })

      it('should not modify the total votes for the group', async () => {
        assertEqualBN(await election.getGroupTotalVotes(group), value)
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
          await election.activate(group, { from: voter2 })
        })

        it("should not modify the first account's active votes for the group", async () => {
          assertEqualBN(await election.getAccountActiveVotesForGroup(group, voter), value)
        })

        it("should not modify the first account's total votes for the group", async () => {
          assertEqualBN(await election.getAccountTotalVotesForGroup(group, voter), value)
        })

        it("should not modify the first account's total votes", async () => {
          assertEqualBN(await election.getAccountTotalVotes(voter), value)
        })

        it("should decrement the second account's pending votes for the group", async () => {
          assertEqualBN(await election.getAccountPendingVotesForGroup(group, voter2), 0)
        })

        it("should increment the second account's active votes for the group", async () => {
          assertEqualBN(await election.getAccountActiveVotesForGroup(group, voter2), value2)
        })

        it("should not modify the second account's total votes for the group", async () => {
          assertEqualBN(await election.getAccountTotalVotesForGroup(group, voter2), value2)
        })

        it("should not modify the second account's total votes", async () => {
          assertEqualBN(await election.getAccountTotalVotes(voter2), value2)
        })

        it('should not modify the total votes for the group', async () => {
          assertEqualBN(await election.getGroupTotalVotes(group), value + value2)
        })

        it('should not modify the total votes', async () => {
          assertEqualBN(await election.getTotalVotes(), value + value2)
        })
      })

      describe('when the voter does not have pending votes', () => {
        it('should revert', async () => {
          await assertRevert(election.activate(group))
        })
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
        await election.markGroupEligible(group, NULL_ADDRESS, NULL_ADDRESS)
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
          assertEqualBN(await election.getAccountPendingVotesForGroup(group, voter), remaining)
        })

        it("should decrement the account's total votes for the group", async () => {
          assertEqualBN(await election.getAccountTotalVotesForGroup(group, voter), remaining)
        })

        it("should decrement the account's total votes", async () => {
          assertEqualBN(await election.getAccountTotalVotes(voter), remaining)
        })

        it('should decrement the total votes for the group', async () => {
          assertEqualBN(await election.getGroupTotalVotes(group), remaining)
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
            assert.deepEqual(await election.getAccountGroupsVotedFor(voter), [])
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
        await election.markGroupEligible(group, NULL_ADDRESS, NULL_ADDRESS)
        await mockLockedGold.setTotalLockedGold(value)
        await mockValidators.setNumRegisteredValidators(1)
        await mockLockedGold.incrementNonvotingAccountBalance(voter, value)
        await election.vote(group, value, NULL_ADDRESS, NULL_ADDRESS)
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
          assertEqualBN(await election.getAccountActiveVotesForGroup(group, voter), remaining)
        })

        it("should decrement the account's total votes for the group", async () => {
          assertEqualBN(await election.getAccountTotalVotesForGroup(group, voter), remaining)
        })

        it("should decrement the account's total votes", async () => {
          assertEqualBN(await election.getAccountTotalVotes(voter), remaining)
        })

        it('should decrement the total votes for the group', async () => {
          assertEqualBN(await election.getGroupTotalVotes(group), remaining)
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
            assert.deepEqual(await election.getAccountGroupsVotedFor(voter), [])
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

  describe('#electValidators', () => {
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

    beforeEach(async () => {
      await mockValidators.setMembers(group1, [validator1, validator2, validator3, validator4])
      await mockValidators.setMembers(group2, [validator5, validator6])
      await mockValidators.setMembers(group3, [validator7])

      await election.markGroupEligible(group1, NULL_ADDRESS, NULL_ADDRESS)
      await election.markGroupEligible(group2, NULL_ADDRESS, group1)
      await election.markGroupEligible(group3, NULL_ADDRESS, group2)

      for (const voter of [voter1, voter2, voter3]) {
        await mockLockedGold.incrementNonvotingAccountBalance(voter.address, voter.weight)
      }
      await mockLockedGold.setTotalLockedGold(totalLockedGold)
      await mockValidators.setNumRegisteredValidators(7)

      random = await MockRandom.new()
      await registry.setAddressFor(CeloContractName.Random, random.address)
      await random.setRandom(hash1)
    })

    describe('when a single group has >= minElectableValidators as members and received votes', () => {
      beforeEach(async () => {})

      it("should return that group's member list", async () => {
        await election.vote(group1, voter1.weight, group2, NULL_ADDRESS, { from: voter1.address })
        assertSameAddresses(await election.electValidators(), [
          validator1,
          validator2,
          validator3,
          validator4,
        ])
      })
    })

    describe("when > maxElectableValidators members's groups receive votes", () => {
      beforeEach(async () => {
        await election.vote(group1, voter1.weight, group2, NULL_ADDRESS, { from: voter1.address })
        await election.vote(group2, voter2.weight, NULL_ADDRESS, group1, { from: voter2.address })
        await election.vote(group3, voter3.weight, NULL_ADDRESS, group2, { from: voter3.address })
      })

      it('should return maxElectableValidators elected validators', async () => {
        assertSameAddresses(await election.electValidators(), [
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
        await random.setRandom(hash1)
        const valsWithHash1 = (await election.electValidators()).map((x) => x.toLowerCase())
        await random.setRandom(hash2)
        const valsWithHash2 = (await election.electValidators()).map((x) => x.toLowerCase())
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
        assertSameAddresses(await election.electValidators(), [
          validator7,
          validator1,
          validator2,
          validator3,
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
        await assertRevert(election.electValidators())
      })
    })
  })
})
