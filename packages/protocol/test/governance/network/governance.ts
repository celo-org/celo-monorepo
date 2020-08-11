import { CeloContractName } from '@celo/protocol/lib/registry-utils'
import { getParsedSignatureOfAddress } from '@celo/protocol/lib/signing-utils'
import {
  assertBalance,
  assertEqualBN,
  assertLogMatches2,
  assertRevert,
  matchAny,
  mineToNextEpoch,
  NULL_ADDRESS,
  stripHexEncoding,
  timeTravel,
} from '@celo/protocol/lib/test-utils'
import { concurrentMap } from '@celo/utils/lib/async'
import { fixed1, multiply, toFixed } from '@celo/utils/lib/fixidity'
import { zip } from '@celo/utils/src/collections'
import BigNumber from 'bignumber.js'
import { keccak256 } from 'ethereumjs-util'
import {
  AccountsContract,
  AccountsInstance,
  GovernanceTestContract,
  GovernanceTestInstance,
  MockLockedGoldContract,
  MockLockedGoldInstance,
  MockValidatorsContract,
  MockValidatorsInstance,
  RegistryContract,
  RegistryInstance,
  TestTransactionsContract,
  TestTransactionsInstance,
} from 'types'

const Governance: GovernanceTestContract = artifacts.require('GovernanceTest')
const Accounts: AccountsContract = artifacts.require('Accounts')
const MockLockedGold: MockLockedGoldContract = artifacts.require('MockLockedGold')
const MockValidators: MockValidatorsContract = artifacts.require('MockValidators')
const Registry: RegistryContract = artifacts.require('Registry')
const TestTransactions: TestTransactionsContract = artifacts.require('TestTransactions')

// @ts-ignore
// TODO(mcortesi): Use BN
Governance.numberFormat = 'BigNumber'

const parseProposalParams = (proposalParams: any) => {
  return {
    proposer: proposalParams[0],
    deposit: proposalParams[1],
    timestamp: proposalParams[2].toNumber(),
    transactionCount: proposalParams[3].toNumber(),
    descriptionUrl: proposalParams[4],
  }
}

const parseTransactionParams = (transactionParams: any) => {
  return {
    value: transactionParams[0].toNumber(),
    destination: transactionParams[1],
    data: transactionParams[2],
  }
}

enum VoteValue {
  None = 0,
  Abstain,
  No,
  Yes,
}

interface Transaction {
  value: number
  destination: string
  data: Buffer
}

// TODO(asa): Test dequeueProposalsIfReady
// TODO(asa): Dequeue explicitly to make the gas cost of operations more clear
contract('Governance', (accounts: string[]) => {
  let governance: GovernanceTestInstance
  let accountsInstance: AccountsInstance
  let mockLockedGold: MockLockedGoldInstance
  let mockValidators: MockValidatorsInstance
  let testTransactions: TestTransactionsInstance
  let registry: RegistryInstance
  const nullFunctionId = '0x00000000'
  const account = accounts[0]
  const approver = accounts[0]
  const otherAccount = accounts[1]
  const nonOwner = accounts[1]
  const nonApprover = accounts[1]
  const concurrentProposals = 1
  const minDeposit = 5
  const queueExpiry = 60 * 60 // 1 hour
  const dequeueFrequency = 10 * 60 // 10 minutes
  const approvalStageDuration = 1 * 60 // 1 minute
  const referendumStageDuration = 5 * 60 // 5 minutes
  const executionStageDuration = 1 * 60 // 1 minute
  const participationBaseline = toFixed(5 / 10)
  const participationFloor = toFixed(5 / 100)
  const baselineUpdateFactor = toFixed(1 / 5)
  const baselineQuorumFactor = toFixed(1)
  const weight = 100
  const participation = toFixed(1)
  const expectedParticipationBaseline = multiply(baselineUpdateFactor, participation).plus(
    multiply(fixed1.minus(baselineUpdateFactor), participationBaseline)
  )
  const descriptionUrl = 'https://descriptionUrl.sample.com'
  let transactionSuccess1: Transaction
  let transactionSuccess2: Transaction
  let transactionFail: Transaction
  let salt: string
  let hotfixHash: Buffer
  let hotfixHashStr: string
  beforeEach(async () => {
    accountsInstance = await Accounts.new()
    governance = await Governance.new()
    mockLockedGold = await MockLockedGold.new()
    mockValidators = await MockValidators.new()
    registry = await Registry.new()
    testTransactions = await TestTransactions.new()
    await governance.initialize(
      registry.address,
      approver,
      concurrentProposals,
      minDeposit,
      queueExpiry,
      dequeueFrequency,
      approvalStageDuration,
      referendumStageDuration,
      executionStageDuration,
      participationBaseline,
      participationFloor,
      baselineUpdateFactor,
      baselineQuorumFactor
    )
    await registry.setAddressFor(CeloContractName.Accounts, accountsInstance.address)
    await registry.setAddressFor(CeloContractName.LockedGold, mockLockedGold.address)
    await registry.setAddressFor(CeloContractName.Validators, mockValidators.address)
    await accountsInstance.initialize(registry.address)
    await accountsInstance.createAccount()
    await mockLockedGold.setAccountTotalLockedGold(account, weight)
    await mockLockedGold.setTotalLockedGold(weight)
    transactionSuccess1 = {
      value: 0,
      destination: testTransactions.address,
      data: Buffer.from(
        stripHexEncoding(
          // @ts-ignore
          testTransactions.contract.methods.setValue(1, 1, true).encodeABI()
        ),
        'hex'
      ),
    }
    transactionSuccess2 = {
      value: 0,
      destination: testTransactions.address,
      data: Buffer.from(
        stripHexEncoding(
          // @ts-ignore
          testTransactions.contract.methods.setValue(2, 1, true).encodeABI()
        ),
        'hex'
      ),
    }
    transactionFail = {
      value: 0,
      destination: testTransactions.address,
      data: Buffer.from(
        stripHexEncoding(
          // @ts-ignore
          testTransactions.contract.methods.setValue(3, 1, false).encodeABI()
        ),
        'hex'
      ),
    }
    salt = '0x657ed9d64e84fa3d1af43b3a307db22aba2d90a158015df1c588c02e24ca08f0'
    hotfixHash = keccak256(
      web3.eth.abi.encodeParameters(
        ['uint256[]', 'address[]', 'bytes', 'uint256[]', 'bytes32'],
        [
          [String(transactionSuccess1.value)],
          [transactionSuccess1.destination.toString()],
          transactionSuccess1.data,
          [String(transactionSuccess1.data.length)],
          salt,
        ]
      )
    ) as Buffer
    hotfixHashStr = '0x' + hotfixHash.toString('hex')
  })

  describe('#initialize()', () => {
    it('should have set the owner', async () => {
      const owner: string = await governance.owner()
      assert.equal(owner, accounts[0])
    })

    it('should have set concurrentProposals', async () => {
      const actualConcurrentProposals = await governance.concurrentProposals()
      assertEqualBN(actualConcurrentProposals, concurrentProposals)
    })

    it('should have set minDeposit', async () => {
      const actualMinDeposit = await governance.minDeposit()
      assertEqualBN(actualMinDeposit, minDeposit)
    })

    it('should have set queueExpiry', async () => {
      const actualQueueExpiry = await governance.queueExpiry()
      assertEqualBN(actualQueueExpiry, queueExpiry)
    })

    it('should have set dequeueFrequency', async () => {
      const actualDequeueFrequency = await governance.dequeueFrequency()
      assertEqualBN(actualDequeueFrequency, dequeueFrequency)
    })

    it('should have set stageDurations', async () => {
      const actualApprovalStageDuration = await governance.getApprovalStageDuration()
      const actualReferendumStageDuration = await governance.getReferendumStageDuration()
      const actualExecutionStageDuration = await governance.getExecutionStageDuration()
      assertEqualBN(actualApprovalStageDuration, approvalStageDuration)
      assertEqualBN(actualReferendumStageDuration, referendumStageDuration)
      assertEqualBN(actualExecutionStageDuration, executionStageDuration)
    })

    it('should have set participationParameters', async () => {
      const [
        actualParticipationBaseline,
        actualParticipationFloor,
        actualBaselineUpdateFactor,
        actualBaselineQuorumFactor,
      ] = await governance.getParticipationParameters()
      assertEqualBN(actualParticipationBaseline, participationBaseline)
      assertEqualBN(actualParticipationFloor, participationFloor)
      assertEqualBN(actualBaselineUpdateFactor, baselineUpdateFactor)
      assertEqualBN(actualBaselineQuorumFactor, baselineQuorumFactor)
    })

    // TODO(asa): Consider testing reversion when 0 values provided
    it('should not be callable again', async () => {
      await assertRevert(
        governance.initialize(
          registry.address,
          approver,
          concurrentProposals,
          minDeposit,
          queueExpiry,
          dequeueFrequency,
          approvalStageDuration,
          referendumStageDuration,
          executionStageDuration,
          participationBaseline,
          participationFloor,
          baselineUpdateFactor,
          baselineQuorumFactor
        )
      )
    })
  })

  describe('#setApprover', () => {
    const newApprover = accounts[2]
    it('should set the approver', async () => {
      await governance.setApprover(newApprover)
      assert.equal(await governance.approver(), newApprover)
    })

    it('should emit the ApproverSet event', async () => {
      const resp = await governance.setApprover(newApprover)
      assert.equal(resp.logs.length, 1)
      const log = resp.logs[0]
      assertLogMatches2(log, {
        event: 'ApproverSet',
        args: {
          approver: newApprover,
        },
      })
    })

    it('should revert when approver is the null address', async () => {
      await assertRevert(governance.setApprover(NULL_ADDRESS))
    })

    it('should revert when the approver is unchanged', async () => {
      await assertRevert(governance.setApprover(approver))
    })

    it('should revert when called by anyone other than the owner', async () => {
      await assertRevert(governance.setApprover(newApprover, { from: nonOwner }))
    })
  })

  describe('#setMinDeposit', () => {
    const newMinDeposit = 1
    it('should set the minimum deposit', async () => {
      await governance.setMinDeposit(newMinDeposit)
      assert.equal((await governance.minDeposit()).toNumber(), newMinDeposit)
    })

    it('should emit the MinDepositSet event', async () => {
      const resp = await governance.setMinDeposit(newMinDeposit)
      assert.equal(resp.logs.length, 1)
      const log = resp.logs[0]
      assertLogMatches2(log, {
        event: 'MinDepositSet',
        args: {
          minDeposit: new BigNumber(newMinDeposit),
        },
      })
    })

    it('should revert when the minDeposit is unchanged', async () => {
      await assertRevert(governance.setMinDeposit(minDeposit))
    })

    it('should revert when called by anyone other than the owner', async () => {
      await assertRevert(governance.setMinDeposit(newMinDeposit, { from: nonOwner }))
    })
  })

  describe('#setConcurrentProposals', () => {
    const newConcurrentProposals = 2
    it('should set the concurrent proposals', async () => {
      await governance.setConcurrentProposals(newConcurrentProposals)
      assert.equal((await governance.concurrentProposals()).toNumber(), newConcurrentProposals)
    })

    it('should emit the ConcurrentProposalsSet event', async () => {
      const resp = await governance.setConcurrentProposals(newConcurrentProposals)
      assert.equal(resp.logs.length, 1)
      const log = resp.logs[0]
      assertLogMatches2(log, {
        event: 'ConcurrentProposalsSet',
        args: {
          concurrentProposals: new BigNumber(newConcurrentProposals),
        },
      })
    })

    it('should revert when concurrent proposals is 0', async () => {
      await assertRevert(governance.setConcurrentProposals(0))
    })

    it('should revert when concurrent proposals is unchanged', async () => {
      await assertRevert(governance.setConcurrentProposals(concurrentProposals))
    })

    it('should revert when called by anyone other than the owner', async () => {
      await assertRevert(
        governance.setConcurrentProposals(newConcurrentProposals, { from: nonOwner })
      )
    })
  })

  describe('#setQueueExpiry', () => {
    const newQueueExpiry = 2
    it('should set the queue expiry', async () => {
      await governance.setQueueExpiry(newQueueExpiry)
      assert.equal((await governance.queueExpiry()).toNumber(), newQueueExpiry)
    })

    it('should emit the QueueExpirySet event', async () => {
      const resp = await governance.setQueueExpiry(newQueueExpiry)
      assert.equal(resp.logs.length, 1)
      const log = resp.logs[0]
      assertLogMatches2(log, {
        event: 'QueueExpirySet',
        args: {
          queueExpiry: new BigNumber(newQueueExpiry),
        },
      })
    })

    it('should revert when queue expiry is 0', async () => {
      await assertRevert(governance.setQueueExpiry(0))
    })

    it('should revert when queue expiry is unchanged', async () => {
      await assertRevert(governance.setQueueExpiry(queueExpiry))
    })

    it('should revert when called by anyone other than the owner', async () => {
      await assertRevert(governance.setQueueExpiry(newQueueExpiry, { from: nonOwner }))
    })
  })

  describe('#setDequeueFrequency', () => {
    const newDequeueFrequency = 2
    it('should set the dequeue frequency', async () => {
      await governance.setDequeueFrequency(newDequeueFrequency)
      assert.equal((await governance.dequeueFrequency()).toNumber(), newDequeueFrequency)
    })

    it('should emit the DequeueFrequencySet event', async () => {
      const resp = await governance.setDequeueFrequency(newDequeueFrequency)
      assert.equal(resp.logs.length, 1)
      const log = resp.logs[0]
      assertLogMatches2(log, {
        event: 'DequeueFrequencySet',
        args: {
          dequeueFrequency: new BigNumber(newDequeueFrequency),
        },
      })
    })

    it('should revert when dequeue frequency is 0', async () => {
      await assertRevert(governance.setDequeueFrequency(0))
    })

    it('should revert when dequeue frequency is unchanged', async () => {
      await assertRevert(governance.setDequeueFrequency(dequeueFrequency))
    })

    it('should revert when called by anyone other than the owner', async () => {
      await assertRevert(governance.setDequeueFrequency(newDequeueFrequency, { from: nonOwner }))
    })
  })

  describe('#setApprovalStageDuration', () => {
    const newApprovalStageDuration = 2
    it('should set the approval stage duration', async () => {
      await governance.setApprovalStageDuration(newApprovalStageDuration)
      const actualApprovalStageDuration = await governance.getApprovalStageDuration()
      assertEqualBN(actualApprovalStageDuration, newApprovalStageDuration)
    })

    it('should emit the ApprovalStageDurationSet event', async () => {
      const resp = await governance.setApprovalStageDuration(newApprovalStageDuration)
      assert.equal(resp.logs.length, 1)
      const log = resp.logs[0]
      assertLogMatches2(log, {
        event: 'ApprovalStageDurationSet',
        args: {
          approvalStageDuration: new BigNumber(newApprovalStageDuration),
        },
      })
    })

    it('should revert when approval stage duration is 0', async () => {
      await assertRevert(governance.setApprovalStageDuration(0))
    })

    it('should revert when approval stage duration is unchanged', async () => {
      await assertRevert(governance.setApprovalStageDuration(approvalStageDuration))
    })

    it('should revert when called by anyone other than the owner', async () => {
      await assertRevert(
        governance.setApprovalStageDuration(newApprovalStageDuration, { from: nonOwner })
      )
    })
  })

  describe('#setReferendumStageDuration', () => {
    const newReferendumStageDuration = 2
    it('should set the referendum stage duration', async () => {
      await governance.setReferendumStageDuration(newReferendumStageDuration)
      const actualReferendumStageDuration = await governance.getReferendumStageDuration()
      assertEqualBN(actualReferendumStageDuration, newReferendumStageDuration)
    })

    it('should emit the ReferendumStageDurationSet event', async () => {
      const resp = await governance.setReferendumStageDuration(newReferendumStageDuration)
      assert.equal(resp.logs.length, 1)
      const log = resp.logs[0]
      assertLogMatches2(log, {
        event: 'ReferendumStageDurationSet',
        args: {
          referendumStageDuration: new BigNumber(newReferendumStageDuration),
        },
      })
    })

    it('should revert when referendum stage duration is 0', async () => {
      await assertRevert(governance.setReferendumStageDuration(0))
    })

    it('should revert when referendum stage duration is unchanged', async () => {
      await assertRevert(governance.setReferendumStageDuration(referendumStageDuration))
    })

    it('should revert when called by anyone other than the owner', async () => {
      await assertRevert(
        governance.setReferendumStageDuration(newReferendumStageDuration, { from: nonOwner })
      )
    })
  })

  describe('#setExecutionStageDuration', () => {
    const newExecutionStageDuration = 2
    it('should set the execution stage duration', async () => {
      await governance.setExecutionStageDuration(newExecutionStageDuration)
      const actualExecutionStageDuration = await governance.getExecutionStageDuration()
      assertEqualBN(actualExecutionStageDuration, newExecutionStageDuration)
    })

    it('should emit the ExecutionStageDurationSet event', async () => {
      const resp = await governance.setExecutionStageDuration(newExecutionStageDuration)
      assert.equal(resp.logs.length, 1)
      const log = resp.logs[0]
      assertLogMatches2(log, {
        event: 'ExecutionStageDurationSet',
        args: {
          executionStageDuration: new BigNumber(newExecutionStageDuration),
        },
      })
    })

    it('should revert when execution stage duration is 0', async () => {
      await assertRevert(governance.setExecutionStageDuration(0))
    })

    it('should revert when execution stage duration is unchanged', async () => {
      await assertRevert(governance.setExecutionStageDuration(executionStageDuration))
    })

    it('should revert when called by anyone other than the owner', async () => {
      await assertRevert(
        governance.setExecutionStageDuration(newExecutionStageDuration, { from: nonOwner })
      )
    })
  })

  describe('#setParticipationFloor', () => {
    const differentParticipationFloor = toFixed(2 / 100)

    it('should set the participation floor', async () => {
      await governance.setParticipationFloor(differentParticipationFloor)
      const [, actualParticipationFloor, ,] = await governance.getParticipationParameters()
      assertEqualBN(actualParticipationFloor, differentParticipationFloor)
    })

    it('should emit the ParticipationFloorSet event', async () => {
      const resp = await governance.setParticipationFloor(differentParticipationFloor)
      assert.equal(resp.logs.length, 1)
      const log = resp.logs[0]
      assertLogMatches2(log, {
        event: 'ParticipationFloorSet',
        args: {
          participationFloor: differentParticipationFloor,
        },
      })
    })

    it('should revert if new participation floor is above 1', async () => {
      await assertRevert(governance.setParticipationFloor(toFixed(101 / 100)))
    })

    it('should revert when called by anyone other than the owner', async () => {
      await assertRevert(
        governance.setParticipationFloor(differentParticipationFloor, { from: nonOwner })
      )
    })
  })

  describe('#setBaselineUpdateFactor', () => {
    const differentBaselineUpdateFactor = toFixed(2 / 5)

    it('should set the participation update coefficient', async () => {
      await governance.setBaselineUpdateFactor(differentBaselineUpdateFactor)
      const [, , actualBaselineUpdateFactor] = await governance.getParticipationParameters()
      assertEqualBN(actualBaselineUpdateFactor, differentBaselineUpdateFactor)
    })

    it('should emit the ParticipationBaselineUpdateFactorSet event', async () => {
      const resp = await governance.setBaselineUpdateFactor(differentBaselineUpdateFactor)
      assert.equal(resp.logs.length, 1)
      const log = resp.logs[0]
      assertLogMatches2(log, {
        event: 'ParticipationBaselineUpdateFactorSet',
        args: {
          baselineUpdateFactor: differentBaselineUpdateFactor,
        },
      })
    })

    it('should revert if new update coefficient is above 1', async () => {
      await assertRevert(governance.setBaselineUpdateFactor(toFixed(101 / 100)))
    })

    it('should revert when called by anyone other than the owner', async () => {
      await assertRevert(
        governance.setBaselineUpdateFactor(differentBaselineUpdateFactor, { from: nonOwner })
      )
    })
  })

  describe('#setBaselineQuorumFactor', () => {
    const differentBaselineQuorumFactor = toFixed(8 / 10)

    it('should set the critical baseline level', async () => {
      await governance.setBaselineQuorumFactor(differentBaselineQuorumFactor)
      const [, , , actualBaselineQuorumFactor] = await governance.getParticipationParameters()
      assertEqualBN(actualBaselineQuorumFactor, differentBaselineQuorumFactor)
    })

    it('should emit the ParticipationBaselineQuorumFactorSet event', async () => {
      const resp = await governance.setBaselineQuorumFactor(differentBaselineQuorumFactor)
      assert.equal(resp.logs.length, 1)
      const log = resp.logs[0]
      assertLogMatches2(log, {
        event: 'ParticipationBaselineQuorumFactorSet',
        args: {
          baselineQuorumFactor: differentBaselineQuorumFactor,
        },
      })
    })

    it('should revert if new critical baseline level is above 1', async () => {
      await assertRevert(governance.setBaselineQuorumFactor(toFixed(101 / 100)))
    })

    it('should revert when called by anyone other than the owner', async () => {
      await assertRevert(
        governance.setBaselineQuorumFactor(differentBaselineQuorumFactor, { from: nonOwner })
      )
    })
  })

  // TODO(asa): Verify that when we set the constitution for a function ID then the proper constitution is applied to a proposal.
  describe('#setConstitution', () => {
    const threshold = toFixed(2 / 3)
    let functionId
    let differentFunctionId
    let destination

    beforeEach(() => {
      destination = governance.address
    })

    describe('when the function id is 0', () => {
      beforeEach(() => {
        functionId = nullFunctionId
        differentFunctionId = '0x12345678'
      })

      it('should set the default threshold', async () => {
        await governance.setConstitution(destination, functionId, threshold)
        const differentThreshold = await governance.getConstitution(
          destination,
          differentFunctionId
        )
        assert.isTrue(differentThreshold.eq(threshold))
      })

      it('should emit the ConstitutionSet event', async () => {
        const resp = await governance.setConstitution(destination, functionId, threshold)
        assert.equal(resp.logs.length, 1)
        const log = resp.logs[0]
        assertLogMatches2(log, {
          event: 'ConstitutionSet',
          args: {
            destination,
            functionId: web3.utils.padRight(functionId, 64),
            threshold,
          },
        })
      })
    })

    describe('when the function id is not 0', () => {
      beforeEach(() => {
        functionId = '0x87654321'
        differentFunctionId = '0x12345678'
      })

      it('should set the function threshold', async () => {
        await governance.setConstitution(destination, functionId, threshold)
        const actualThreshold = await governance.getConstitution(destination, functionId)
        assert.isTrue(actualThreshold.eq(threshold))
      })

      it('should not set the default threshold', async () => {
        await governance.setConstitution(destination, functionId, threshold)
        const actualThreshold = await governance.getConstitution(destination, differentFunctionId)
        assert.isTrue(actualThreshold.eq(toFixed(1 / 2)))
      })

      it('should emit the ConstitutionSet event', async () => {
        const resp = await governance.setConstitution(destination, functionId, threshold)
        assert.equal(resp.logs.length, 1)
        const log = resp.logs[0]
        assertLogMatches2(log, {
          event: 'ConstitutionSet',
          args: {
            destination,
            functionId: web3.utils.padRight(functionId, 64),
            threshold,
          },
        })
      })
    })

    it('should revert when the destination is the null address', async () => {
      await assertRevert(governance.setConstitution(NULL_ADDRESS, nullFunctionId, threshold))
    })

    it('should revert when the threshold is zero', async () => {
      await assertRevert(governance.setConstitution(destination, nullFunctionId, 0))
    })

    it('should revert when the threshold is not greater than a majority', async () => {
      await assertRevert(governance.setConstitution(destination, nullFunctionId, toFixed(1 / 2)))
    })

    it('should revert when the threshold is greater than 100%', async () => {
      await assertRevert(
        governance.setConstitution(destination, nullFunctionId, toFixed(101 / 100))
      )
    })

    it('should revert when called by anyone other than the owner', async () => {
      await assertRevert(
        governance.setConstitution(destination, nullFunctionId, threshold, {
          from: nonOwner,
        })
      )
    })
  })

  describe('#propose()', () => {
    const proposalId = 1

    it('should return the proposal id', async () => {
      const id = await governance.propose.call(
        [transactionSuccess1.value],
        [transactionSuccess1.destination],
        // @ts-ignore bytes type
        transactionSuccess1.data,
        [transactionSuccess1.data.length],
        descriptionUrl,
        // @ts-ignore: TODO(mcortesi) fix typings for TransactionDetails
        { value: minDeposit }
      )
      assertEqualBN(id, proposalId)
    })

    it('should increment the proposal count', async () => {
      await governance.propose(
        [transactionSuccess1.value],
        [transactionSuccess1.destination],
        // @ts-ignore bytes type
        transactionSuccess1.data,
        [transactionSuccess1.data.length],
        descriptionUrl,
        // @ts-ignore: TODO(mcortesi) fix typings for TransactionDetails
        { value: minDeposit }
      )
      assertEqualBN(await governance.proposalCount(), proposalId)
    })

    it('should add the proposal to the queue', async () => {
      await governance.propose(
        [transactionSuccess1.value],
        [transactionSuccess1.destination],
        // @ts-ignore bytes type
        transactionSuccess1.data,
        [transactionSuccess1.data.length],
        descriptionUrl,
        // @ts-ignore: TODO(mcortesi) fix typings for TransactionDetails
        { value: minDeposit }
      )
      assert.isTrue(await governance.isQueued(proposalId))
      const [proposalIds, upvotes] = await governance.getQueue()
      assertEqualBN(proposalIds[0], proposalId)
      assertEqualBN(upvotes[0], 0)
    })

    describe('when making a proposal with zero transactions', () => {
      it('should register the proposal', async () => {
        // @ts-ignore: TODO(mcortesi) fix typings for TransactionDetails
        await governance.propose([], [], [], [], descriptionUrl, { value: minDeposit })
        const timestamp = (await web3.eth.getBlock('latest')).timestamp
        const proposal = parseProposalParams(await governance.getProposal(proposalId))
        assert.equal(proposal.proposer, accounts[0])
        assert.equal(proposal.deposit, minDeposit)
        assert.equal(proposal.timestamp, timestamp)
        assert.equal(proposal.transactionCount, 0)
        assert.equal(proposal.descriptionUrl, descriptionUrl)
      })

      it('should emit the ProposalQueued event', async () => {
        // @ts-ignore: TODO(mcortesi) fix typings for TransactionDetails
        const resp = await governance.propose([], [], [], [], descriptionUrl, { value: minDeposit })
        const timestamp = (await web3.eth.getBlock('latest')).timestamp
        assert.equal(resp.logs.length, 1)
        const log = resp.logs[0]
        assertLogMatches2(log, {
          event: 'ProposalQueued',
          args: {
            proposalId: new BigNumber(1),
            proposer: accounts[0],
            deposit: new BigNumber(minDeposit),
            timestamp,
            transactionCount: 0,
          },
        })
      })
    })

    describe('when making a proposal with one transaction', () => {
      it('should register the proposal', async () => {
        await governance.propose(
          [transactionSuccess1.value],
          [transactionSuccess1.destination],
          // @ts-ignore bytes type
          transactionSuccess1.data,
          [transactionSuccess1.data.length],
          descriptionUrl,
          // @ts-ignore: TODO(mcortesi) fix typings for TransactionDetails
          { value: minDeposit }
        )
        const timestamp = (await web3.eth.getBlock('latest')).timestamp
        const proposal = parseProposalParams(await governance.getProposal(proposalId))
        assert.equal(proposal.proposer, accounts[0])
        assert.equal(proposal.deposit, minDeposit)
        assert.equal(proposal.timestamp, timestamp)
        assert.equal(proposal.transactionCount, 1)
        assert.equal(proposal.descriptionUrl, descriptionUrl)
      })

      it('should register the proposal transactions', async () => {
        await governance.propose(
          [transactionSuccess1.value],
          [transactionSuccess1.destination],
          // @ts-ignore bytes type
          transactionSuccess1.data,
          [transactionSuccess1.data.length],
          descriptionUrl,
          // @ts-ignore: TODO(mcortesi) fix typings for TransactionDetails
          { value: minDeposit }
        )
        const transaction = parseTransactionParams(
          await governance.getProposalTransaction(proposalId, 0)
        )
        assert.equal(transaction.value, transactionSuccess1.value)
        assert.equal(transaction.destination, transactionSuccess1.destination)
        assert.isTrue(
          Buffer.from(stripHexEncoding(transaction.data), 'hex').equals(transactionSuccess1.data)
        )
      })

      it('should emit the ProposalQueued event', async () => {
        const resp = await governance.propose(
          [transactionSuccess1.value],
          [transactionSuccess1.destination],
          // @ts-ignore bytes type
          transactionSuccess1.data,
          [transactionSuccess1.data.length],
          descriptionUrl,
          // @ts-ignore: TODO(mcortesi) fix typings for TransactionDetails
          { value: minDeposit }
        )
        const timestamp = (await web3.eth.getBlock('latest')).timestamp
        assert.equal(resp.logs.length, 1)
        const log = resp.logs[0]
        assertLogMatches2(log, {
          event: 'ProposalQueued',
          args: {
            proposalId: new BigNumber(1),
            proposer: accounts[0],
            deposit: new BigNumber(minDeposit),
            timestamp,
            transactionCount: 1,
          },
        })
      })

      it('should revert if one tries to make a proposal without description', async () => {
        await assertRevert(
          governance.propose.call(
            [transactionSuccess1.value],
            [transactionSuccess1.destination],
            // @ts-ignore bytes type
            transactionSuccess1.data,
            [transactionSuccess1.data.length],
            '',
            // @ts-ignore: TODO(mcortesi) fix typings for TransactionDetails
            { value: minDeposit }
          )
        )
      })
    })

    describe('when making a proposal with two transactions', () => {
      it('should register the proposal', async () => {
        await governance.propose(
          [transactionSuccess1.value, transactionSuccess2.value],
          [transactionSuccess1.destination, transactionSuccess2.destination],
          // @ts-ignore
          Buffer.concat([transactionSuccess1.data, transactionSuccess2.data]),
          [transactionSuccess1.data.length, transactionSuccess2.data.length],
          descriptionUrl,
          // @ts-ignore: TODO(mcortesi) fix typings for TransactionDetails
          { value: minDeposit }
        )
        const timestamp = (await web3.eth.getBlock('latest')).timestamp
        const proposal = parseProposalParams(await governance.getProposal(proposalId))
        assert.equal(proposal.proposer, accounts[0])
        assert.equal(proposal.deposit, minDeposit)
        assert.equal(proposal.timestamp, timestamp)
        assert.equal(proposal.transactionCount, 2)
        assert.equal(proposal.descriptionUrl, descriptionUrl)
      })

      it('should register the proposal transactions', async () => {
        await governance.propose(
          [transactionSuccess1.value, transactionSuccess2.value],
          [transactionSuccess1.destination, transactionSuccess2.destination],
          // @ts-ignore
          Buffer.concat([transactionSuccess1.data, transactionSuccess2.data]),
          [transactionSuccess1.data.length, transactionSuccess2.data.length],
          descriptionUrl,
          // @ts-ignore: TODO(mcortesi) fix typings for TransactionDetails
          { value: minDeposit }
        )
        const transaction1 = parseTransactionParams(
          await governance.getProposalTransaction(proposalId, 0)
        )
        assert.equal(transaction1.value, transactionSuccess1.value)
        assert.equal(transaction1.destination, transactionSuccess1.destination)
        assert.isTrue(
          Buffer.from(stripHexEncoding(transaction1.data), 'hex').equals(transactionSuccess1.data)
        )
        const transaction2 = parseTransactionParams(
          await governance.getProposalTransaction(proposalId, 1)
        )
        assert.equal(transaction2.value, transactionSuccess2.value)
        assert.equal(transaction2.destination, transactionSuccess2.destination)
        assert.isTrue(
          Buffer.from(stripHexEncoding(transaction2.data), 'hex').equals(transactionSuccess2.data)
        )
      })

      it('should emit the ProposalQueued event', async () => {
        const resp = await governance.propose(
          [transactionSuccess1.value, transactionSuccess2.value],
          [transactionSuccess1.destination, transactionSuccess2.destination],
          // @ts-ignore
          Buffer.concat([transactionSuccess1.data, transactionSuccess2.data]),
          [transactionSuccess1.data.length, transactionSuccess2.data.length],
          descriptionUrl,
          // @ts-ignore: TODO(mcortesi) fix typings for TransactionDetails
          { value: minDeposit }
        )
        const timestamp = (await web3.eth.getBlock('latest')).timestamp
        assert.equal(resp.logs.length, 1)
        const log = resp.logs[0]
        assertLogMatches2(log, {
          event: 'ProposalQueued',
          args: {
            proposalId: new BigNumber(1),
            proposer: accounts[0],
            deposit: new BigNumber(minDeposit),
            timestamp,
            transactionCount: 2,
          },
        })
      })
    })

    describe('when it has been more than dequeueFrequency since the last dequeue', () => {
      beforeEach(async () => {
        await governance.propose(
          [transactionSuccess1.value],
          [transactionSuccess1.destination],
          // @ts-ignore bytes type
          transactionSuccess1.data,
          [transactionSuccess1.data.length],
          descriptionUrl,
          // @ts-ignore: TODO(mcortesi) fix typings for TransactionDetails
          { value: minDeposit }
        )
        await timeTravel(dequeueFrequency, web3)
      })

      it('should dequeue queued proposal(s)', async () => {
        await governance.propose(
          [transactionSuccess1.value],
          [transactionSuccess1.destination],
          // @ts-ignore bytes type
          transactionSuccess1.data,
          [transactionSuccess1.data.length],
          descriptionUrl,
          // @ts-ignore: TODO(mcortesi) fix typings for TransactionDetails
          { value: minDeposit }
        )
        assert.isFalse(await governance.isQueued(proposalId))
        assert.equal((await governance.getQueueLength()).toNumber(), 1)
        assert.equal((await governance.dequeued(0)).toNumber(), proposalId)
      })
    })
  })

  describe('#upvote()', () => {
    const proposalId = new BigNumber(1)
    beforeEach(async () => {
      await mockLockedGold.setAccountTotalLockedGold(account, weight)
      await governance.propose(
        [transactionSuccess1.value],
        [transactionSuccess1.destination],
        // @ts-ignore bytes type
        transactionSuccess1.data,
        [transactionSuccess1.data.length],
        descriptionUrl,
        // @ts-ignore: TODO(mcortesi) fix typings for TransactionDetails
        { value: minDeposit }
      )
    })

    it('should increase the number of upvotes for the proposal', async () => {
      await governance.upvote(proposalId, 0, 0)
      assertEqualBN(await governance.getUpvotes(proposalId), weight)
    })

    it('should mark the account as having upvoted the proposal', async () => {
      await governance.upvote(proposalId, 0, 0)
      const [recordId, recordWeight] = await governance.getUpvoteRecord(account)
      assertEqualBN(recordId, proposalId)
      assertEqualBN(recordWeight, weight)
    })

    it('should return true', async () => {
      const success = await governance.upvote.call(proposalId, 0, 0)
      assert.isTrue(success)
    })

    it('should emit the ProposalUpvoted event', async () => {
      const resp = await governance.upvote(proposalId, 0, 0)
      assert.equal(resp.logs.length, 1)
      const log = resp.logs[0]
      assertLogMatches2(log, {
        event: 'ProposalUpvoted',
        args: {
          proposalId: new BigNumber(proposalId),
          account,
          upvotes: new BigNumber(weight),
        },
      })
    })

    it('should revert when upvoting a proposal that is not queued', async () => {
      await assertRevert(governance.upvote(proposalId.plus(1), 0, 0))
    })

    describe('when the upvoted proposal is at the end of the queue', () => {
      const upvotedProposalId = 2
      beforeEach(async () => {
        await governance.propose(
          [transactionSuccess1.value],
          [transactionSuccess1.destination],
          // @ts-ignore bytes type
          transactionSuccess1.data,
          [transactionSuccess1.data.length],
          descriptionUrl,
          // @ts-ignore: TODO(mcortesi) fix typings for TransactionDetails
          { value: minDeposit }
        )
      })

      it('should sort the upvoted proposal to the front of the queue', async () => {
        await governance.upvote(upvotedProposalId, proposalId, 0)
        const [proposalIds, upvotes] = await governance.getQueue()
        assert.equal(proposalIds[0].toNumber(), upvotedProposalId)
        assertEqualBN(upvotes[0], weight)
      })
    })

    describe('when the upvoted proposal is expired', () => {
      const otherProposalId = 2
      beforeEach(async () => {
        // Prevent dequeues for the sake of this test.
        await governance.setDequeueFrequency(queueExpiry * 2)
        await governance.propose(
          [transactionSuccess1.value],
          [transactionSuccess1.destination],
          // @ts-ignore bytes type
          transactionSuccess1.data,
          [transactionSuccess1.data.length],
          descriptionUrl,
          // @ts-ignore: TODO(mcortesi) fix typings for TransactionDetails
          { value: minDeposit }
        )
        const otherAccount1 = accounts[1]
        await accountsInstance.createAccount({ from: otherAccount1 })
        await mockLockedGold.setAccountTotalLockedGold(otherAccount1, weight)
        await governance.upvote(otherProposalId, proposalId, 0, { from: otherAccount1 })
        await timeTravel(queueExpiry, web3)
      })

      it('should return false', async () => {
        const success = await governance.upvote.call(proposalId, otherProposalId, 0)
        assert.isFalse(success)
      })

      it('should remove the proposal from the queue', async () => {
        await governance.upvote(proposalId, 0, 0)
        assert.isFalse(await governance.isQueued(proposalId))
        const [proposalIds] = await governance.getQueue()
        assert.notInclude(
          proposalIds.map((x) => x.toNumber()),
          proposalId
        )
      })

      it('should emit the ProposalExpired event', async () => {
        const resp = await governance.upvote(proposalId, 0, 0)
        assert.equal(resp.logs.length, 1)
        const log = resp.logs[0]
        assertLogMatches2(log, {
          event: 'ProposalExpired',
          args: {
            proposalId: new BigNumber(proposalId),
          },
        })
      })
    })

    describe('when it has been more than dequeueFrequency since the last dequeue', () => {
      const upvotedProposalId = 2
      beforeEach(async () => {
        await governance.propose(
          [transactionSuccess1.value],
          [transactionSuccess1.destination],
          // @ts-ignore bytes type
          transactionSuccess1.data,
          [transactionSuccess1.data.length],
          descriptionUrl,
          // @ts-ignore: TODO(mcortesi) fix typings for TransactionDetails
          { value: minDeposit }
        )
        await timeTravel(dequeueFrequency, web3)
      })

      it('should dequeue queued proposal(s)', async () => {
        const queueLength = await governance.getQueueLength()
        await governance.upvote(upvotedProposalId, 0, 0)
        assert.isFalse(await governance.isQueued(proposalId))
        assert.equal(
          (await governance.getQueueLength()).toNumber(),
          queueLength.minus(concurrentProposals).toNumber()
        )
        assertEqualBN(await governance.dequeued(0), proposalId)
      })

      it('should revert when upvoting a proposal that will be dequeued', async () => {
        await assertRevert(governance.upvote(proposalId, 0, 0))
      })
    })

    describe('when the previously upvoted proposal is in the queue and expired', () => {
      const upvotedProposalId = 2
      // Expire the upvoted proposal without dequeueing it.
      const queueExpiry1 = 60
      beforeEach(async () => {
        await governance.setQueueExpiry(60)
        await governance.upvote(proposalId, 0, 0)
        await timeTravel(queueExpiry1, web3)
        await governance.propose(
          [transactionSuccess1.value],
          [transactionSuccess1.destination],
          // @ts-ignore
          transactionSuccess1.data,
          [transactionSuccess1.data.length],
          descriptionUrl,
          // @ts-ignore: TODO(mcortesi) fix typings for TransactionDetails
          { value: minDeposit }
        )
      })

      it('should increase the number of upvotes for the proposal', async () => {
        await governance.upvote(upvotedProposalId, 0, 0)
        assertEqualBN(await governance.getUpvotes(upvotedProposalId), weight)
      })

      it('should mark the account as having upvoted the proposal', async () => {
        await governance.upvote(upvotedProposalId, 0, 0)
        const [recordId, recordWeight] = await governance.getUpvoteRecord(account)
        assertEqualBN(recordId, upvotedProposalId)
        assertEqualBN(recordWeight, weight)
      })

      it('should return true', async () => {
        const success = await governance.upvote.call(upvotedProposalId, 0, 0)
        assert.isTrue(success)
      })

      it('should emit the ProposalExpired event', async () => {
        const resp = await governance.upvote(upvotedProposalId, 0, 0)
        assert.equal(resp.logs.length, 2)
        const log = resp.logs[0]
        assertLogMatches2(log, {
          event: 'ProposalExpired',
          args: {
            proposalId: new BigNumber(proposalId),
          },
        })
      })
      it('should emit the ProposalUpvoted event', async () => {
        const resp = await governance.upvote(upvotedProposalId, 0, 0)
        assert.equal(resp.logs.length, 2)
        const log = resp.logs[1]
        assertLogMatches2(log, {
          event: 'ProposalUpvoted',
          args: {
            proposalId: new BigNumber(upvotedProposalId),
            account,
            upvotes: new BigNumber(weight),
          },
        })
      })
    })
  })

  describe('#revokeUpvote()', () => {
    const proposalId = new BigNumber(1)
    beforeEach(async () => {
      await mockLockedGold.setAccountTotalLockedGold(account, weight)
      await governance.propose(
        [transactionSuccess1.value],
        [transactionSuccess1.destination],
        // @ts-ignore bytes type
        transactionSuccess1.data,
        [transactionSuccess1.data.length],
        descriptionUrl,
        // @ts-ignore: TODO(mcortesi) fix typings for TransactionDetails
        { value: minDeposit }
      )
      await governance.upvote(proposalId, 0, 0)
    })

    it('should return true', async () => {
      const success = await governance.revokeUpvote.call(0, 0)
      assert.isTrue(success)
    })

    it('should decrease the number of upvotes for the proposal', async () => {
      await governance.revokeUpvote(0, 0)
      assertEqualBN(await governance.getUpvotes(proposalId), 0)
    })

    it('should mark the account as not having upvoted a proposal', async () => {
      await governance.revokeUpvote(0, 0)
      const [recordId, recordWeight] = await governance.getUpvoteRecord(account)
      assertEqualBN(recordId, 0)
      assertEqualBN(recordWeight, 0)
    })

    it('should emit the ProposalUpvoteRevoked event', async () => {
      const resp = await governance.revokeUpvote(0, 0)
      assert.equal(resp.logs.length, 1)
      const log = resp.logs[0]
      assertLogMatches2(log, {
        event: 'ProposalUpvoteRevoked',
        args: {
          proposalId: new BigNumber(proposalId),
          account,
          revokedUpvotes: new BigNumber(weight),
        },
      })
    })

    it('should revert when the account does not have an upvoted proposal', async () => {
      await governance.revokeUpvote(0, 0)
      await assertRevert(governance.revokeUpvote(0, 0))
    })

    describe('when the upvoted proposal has expired', () => {
      beforeEach(async () => {
        await timeTravel(queueExpiry, web3)
      })

      it('should remove the proposal from the queue', async () => {
        await governance.revokeUpvote(0, 0)
        assert.isFalse(await governance.isQueued(proposalId))
        const [proposalIds, upvotes] = await governance.getQueue()
        assert.equal(proposalIds.length, 0)
        assert.equal(upvotes.length, 0)
      })

      it('should mark the account as not having upvoted a proposal', async () => {
        await governance.revokeUpvote(0, 0)
        const [recordId, recordWeight] = await governance.getUpvoteRecord(account)
        assertEqualBN(recordId, 0)
        assertEqualBN(recordWeight, 0)
      })

      it('should emit the ProposalExpired event', async () => {
        const resp = await governance.revokeUpvote(0, 0)
        assert.equal(resp.logs.length, 1)
        const log = resp.logs[0]
        assertLogMatches2(log, {
          event: 'ProposalExpired',
          args: {
            proposalId: new BigNumber(proposalId),
          },
        })
      })
    })

    describe('when it has been more than dequeueFrequency since the last dequeue', () => {
      beforeEach(async () => {
        await timeTravel(dequeueFrequency, web3)
      })

      it('should dequeue the proposal', async () => {
        await governance.revokeUpvote(0, 0)
        assert.isFalse(await governance.isQueued(proposalId))
        assert.equal((await governance.getQueueLength()).toNumber(), 0)
        assertEqualBN(await governance.dequeued(0), proposalId)
      })

      it('should mark the account as not having upvoted a proposal', async () => {
        await governance.revokeUpvote(0, 0)
        const [recordId, recordWeight] = await governance.getUpvoteRecord(account)
        assertEqualBN(recordId, 0)
        assertEqualBN(recordWeight, 0)
      })
    })
  })

  describe('#withdraw()', () => {
    const proposalId = 1
    const index = 0
    beforeEach(async () => {
      await governance.propose(
        [transactionSuccess1.value],
        [transactionSuccess1.destination],
        // @ts-ignore bytes type
        transactionSuccess1.data,
        [transactionSuccess1.data.length],
        descriptionUrl,
        // @ts-ignore: TODO(mcortesi) fix typings for TransactionDetails
        { value: minDeposit }
      )
      await timeTravel(dequeueFrequency, web3)
      await governance.approve(proposalId, index)
    })

    describe('when the caller was the proposer of a dequeued proposal', () => {
      it('should return true', async () => {
        // @ts-ignore
        const success = await governance.withdraw.call()
        assert.isTrue(success)
      })

      it('should withdraw the refunded deposit when the proposal was dequeued', async () => {
        const startBalance = new BigNumber(await web3.eth.getBalance(account))
        await governance.withdraw()
        await assertBalance(account, startBalance.plus(minDeposit))
      })
    })

    it('should revert when the caller was not the proposer of a dequeued proposal', async () => {
      await assertRevert(governance.withdraw({ from: accounts[1] }))
    })
  })

  describe('#approve()', () => {
    const proposalId = 1
    const index = 0
    beforeEach(async () => {
      await governance.propose(
        [transactionSuccess1.value],
        [transactionSuccess1.destination],
        // @ts-ignore bytes type
        transactionSuccess1.data,
        [transactionSuccess1.data.length],
        descriptionUrl,
        // @ts-ignore: TODO(mcortesi) fix typings for TransactionDetails
        { value: minDeposit }
      )
      await timeTravel(dequeueFrequency, web3)
    })

    it('should return true', async () => {
      const success = await governance.approve.call(proposalId, index)
      assert.isTrue(success)
    })

    it('should set the proposal to approved', async () => {
      await governance.approve(proposalId, index)
      assert.isTrue(await governance.isApproved(proposalId))
    })

    it('should emit the ProposalDequeued event', async () => {
      const resp = await governance.approve(proposalId, index)
      assert.equal(resp.logs.length, 2)
      const log = resp.logs[0]
      assertLogMatches2(log, {
        event: 'ProposalDequeued',
        args: {
          proposalId: new BigNumber(proposalId),
          timestamp: matchAny,
        },
      })
    })

    it('should emit the ProposalApproved event', async () => {
      const resp = await governance.approve(proposalId, index)
      assert.equal(resp.logs.length, 2)
      const log = resp.logs[1]
      assertLogMatches2(log, {
        event: 'ProposalApproved',
        args: {
          proposalId: new BigNumber(proposalId),
        },
      })
    })

    it('should revert when the index is out of bounds', async () => {
      await assertRevert(governance.approve(proposalId, index + 1))
    })

    it('should revert if the proposal id does not match the index', async () => {
      await governance.propose(
        [transactionSuccess1.value],
        [transactionSuccess1.destination],
        // @ts-ignore bytes type
        transactionSuccess1.data,
        [transactionSuccess1.data.length],
        descriptionUrl,
        // @ts-ignore: TODO(mcortesi) fix typings for TransactionDetails
        { value: minDeposit }
      )
      await timeTravel(dequeueFrequency, web3)
      const otherProposalId = 2
      await assertRevert(governance.approve(otherProposalId, index))
    })

    it('should revert when not called by the approver', async () => {
      await assertRevert(governance.approve(proposalId, index, { from: nonApprover }))
    })

    it('should revert when the proposal is queued', async () => {
      await governance.propose(
        [transactionSuccess1.value],
        [transactionSuccess1.destination],
        // @ts-ignore bytes type
        transactionSuccess1.data,
        [transactionSuccess1.data.length],
        descriptionUrl,
        // @ts-ignore: TODO(mcortesi) fix typings for TransactionDetails
        { value: minDeposit }
      )
      await assertRevert(governance.approve(proposalId + 1, index))
    })

    it('should revert if the proposal has already been approved', async () => {
      await governance.approve(proposalId, index)
      await assertRevert(governance.approve(proposalId, index))
    })

    describe('when the proposal is past the approval stage', () => {
      beforeEach(async () => {
        // Dequeue the other proposal.
        await governance.propose(
          [transactionSuccess1.value],
          [transactionSuccess1.destination],
          // @ts-ignore bytes type
          transactionSuccess1.data,
          [transactionSuccess1.data.length],
          descriptionUrl,
          // @ts-ignore: TODO(mcortesi) fix typings for TransactionDetails
          { value: minDeposit }
        )
        await timeTravel(approvalStageDuration + 1, web3)
      })

      it('should return false', async () => {
        const success = await governance.approve.call(proposalId, index)
        assert.isFalse(success)
      })

      it('should delete the proposal', async () => {
        await governance.approve(proposalId, index)
        assert.isFalse(await governance.proposalExists(proposalId))
      })

      it('should remove the proposal ID from dequeued', async () => {
        await governance.approve(proposalId, index)
        const dequeued = await governance.getDequeue()
        assert.notInclude(
          dequeued.map((x) => x.toNumber()),
          proposalId
        )
      })

      it('should add the index to empty indices', async () => {
        await governance.approve(proposalId, index)
        const emptyIndex = await governance.emptyIndices(0)
        assert.equal(emptyIndex.toNumber(), index)
      })

      it('should not emit the ParticipationBaselineUpdated event', async () => {
        const resp = await governance.approve(proposalId, index)
        assert.equal(resp.logs.length, 0)
      })
    })
  })

  describe('#vote()', () => {
    const proposalId = 1
    const index = 0
    const value = VoteValue.Yes
    beforeEach(async () => {
      await governance.propose(
        [transactionSuccess1.value],
        [transactionSuccess1.destination],
        // @ts-ignore bytes type
        transactionSuccess1.data,
        [transactionSuccess1.data.length],
        descriptionUrl,
        // @ts-ignore: TODO(mcortesi) fix typings for TransactionDetails
        { value: minDeposit }
      )
      await timeTravel(dequeueFrequency, web3)
      await governance.approve(proposalId, index)
      await timeTravel(approvalStageDuration, web3)
      await mockLockedGold.setAccountTotalLockedGold(account, weight)
    })

    it('should return true', async () => {
      const success = await governance.vote.call(proposalId, index, value)
      assert.isTrue(success)
    })

    it('should increment the vote totals', async () => {
      await governance.vote(proposalId, index, value)
      const [yes, ,] = await governance.getVoteTotals(proposalId)
      assert.equal(yes.toNumber(), weight)
    })

    it("should set the voter's vote record", async () => {
      await governance.vote(proposalId, index, value)
      const [recordProposalId, recordValue, recordWeight] = await governance.getVoteRecord(
        account,
        index
      )
      assertEqualBN(recordProposalId, proposalId)
      assertEqualBN(recordValue, value)
      assertEqualBN(recordWeight, weight)
    })

    it('should set the most recent referendum proposal voted on', async () => {
      await governance.vote(proposalId, index, value)
      assert.equal(
        (await governance.getMostRecentReferendumProposal(account)).toNumber(),
        proposalId
      )
    })

    it('should emit the ProposalVoted event', async () => {
      const resp = await governance.vote(proposalId, index, value)
      assert.equal(resp.logs.length, 1)
      const log = resp.logs[0]
      assertLogMatches2(log, {
        event: 'ProposalVoted',
        args: {
          proposalId: new BigNumber(proposalId),
          account,
          value: new BigNumber(value),
          weight: new BigNumber(weight),
        },
      })
    })

    it('should revert when the account weight is 0', async () => {
      await mockLockedGold.setAccountTotalLockedGold(account, 0)
      await assertRevert(governance.vote(proposalId, index, value))
    })

    it('should revert when the index is out of bounds', async () => {
      await assertRevert(governance.vote(proposalId, index + 1, value))
    })

    it('should revert if the proposal id does not match the index', async () => {
      await governance.propose(
        [transactionSuccess1.value],
        [transactionSuccess1.destination],
        // @ts-ignore bytes type
        transactionSuccess1.data,
        [transactionSuccess1.data.length],
        descriptionUrl,
        // @ts-ignore: TODO(mcortesi) fix typings for TransactionDetails
        { value: minDeposit }
      )
      await timeTravel(dequeueFrequency, web3)
      const otherProposalId = 2
      await assertRevert(governance.vote(otherProposalId, index, value))
    })

    describe('when the account has already voted on this proposal', () => {
      const revoteTests = (oldValue, newValue) => {
        it('should decrement the vote total from the previous vote', async () => {
          await governance.vote(proposalId, index, newValue)
          const voteTotals = await governance.getVoteTotals(proposalId)
          assert.equal(voteTotals[3 - oldValue].toNumber(), 0)
        })

        it('should increment the vote total for the new vote', async () => {
          await governance.vote(proposalId, index, newValue)
          const voteTotals = await governance.getVoteTotals(proposalId)
          assert.equal(voteTotals[3 - newValue].toNumber(), weight)
        })

        it("should set the voter's vote record", async () => {
          await governance.vote(proposalId, index, newValue)
          const [recordProposalId, recordValue] = await governance.getVoteRecord(account, index)
          assert.equal(recordProposalId.toNumber(), proposalId)
          assert.equal(recordValue.toNumber(), newValue)
        })
      }

      describe('when the account has already voted yes on this proposal', () => {
        beforeEach(async () => {
          await governance.vote(proposalId, index, VoteValue.Yes)
        })

        revoteTests(VoteValue.Yes, VoteValue.No)
      })

      describe('when the account has already voted no on this proposal', () => {
        beforeEach(async () => {
          await governance.vote(proposalId, index, VoteValue.No)
        })

        revoteTests(VoteValue.No, VoteValue.Abstain)
      })

      describe('when the account has already voted abstain on this proposal', () => {
        beforeEach(async () => {
          await governance.vote(proposalId, index, VoteValue.Abstain)
        })

        revoteTests(VoteValue.Abstain, VoteValue.Yes)
      })
    })

    describe('when the proposal is past the referendum stage and passing', () => {
      beforeEach(async () => {
        await governance.vote(proposalId, index, VoteValue.Yes)
        await timeTravel(referendumStageDuration, web3)
      })

      it('should revert', async () => {
        await assertRevert(governance.vote.call(proposalId, index, value))
      })
    })

    describe('when the proposal is past the referendum stage and failing', () => {
      beforeEach(async () => {
        await governance.vote(proposalId, index, VoteValue.No)
        await timeTravel(referendumStageDuration, web3)
      })

      it('should return false', async () => {
        const success = await governance.vote.call(proposalId, index, value)
        assert.isFalse(success)
      })

      it('should delete the proposal', async () => {
        await governance.vote(proposalId, index, value)
        assert.isFalse(await governance.proposalExists(proposalId))
      })

      it('should remove the proposal ID from dequeued', async () => {
        await governance.vote(proposalId, index, value)
        const dequeued = await governance.getDequeue()
        assert.notInclude(
          dequeued.map((x) => x.toNumber()),
          proposalId
        )
      })

      it('should add the index to empty indices', async () => {
        await governance.vote(proposalId, index, value)
        const emptyIndex = await governance.emptyIndices(0)
        assert.equal(emptyIndex.toNumber(), index)
      })

      it('should update the participation baseline', async () => {
        await governance.vote(proposalId, index, value)
        const [actualParticipationBaseline, , ,] = await governance.getParticipationParameters()
        assertEqualBN(actualParticipationBaseline, expectedParticipationBaseline)
      })

      it('should emit the ParticipationBaselineUpdated event', async () => {
        const resp = await governance.vote(proposalId, index, value)
        assert.equal(resp.logs.length, 1)
        const log = resp.logs[0]
        assertLogMatches2(log, {
          event: 'ParticipationBaselineUpdated',
          args: {
            participationBaseline: expectedParticipationBaseline,
          },
        })
      })
    })
  })

  describe('#execute()', () => {
    const proposalId = 1
    const index = 0
    const value = VoteValue.Yes

    describe('when executing a proposal with one transaction', () => {
      describe('when the proposal can execute successfully', () => {
        beforeEach(async () => {
          await governance.propose(
            [transactionSuccess1.value],
            [transactionSuccess1.destination],
            // @ts-ignore bytes type
            transactionSuccess1.data,
            [transactionSuccess1.data.length],
            descriptionUrl,
            // @ts-ignore: TODO(mcortesi) fix typings for TransactionDetails
            { value: minDeposit }
          )
          await timeTravel(dequeueFrequency, web3)
          await governance.approve(proposalId, index)
          await timeTravel(approvalStageDuration, web3)
          await mockLockedGold.setAccountTotalLockedGold(account, weight)
          await governance.vote(proposalId, index, value)
          await timeTravel(referendumStageDuration, web3)
        })

        it('should return true', async () => {
          const success = await governance.execute.call(proposalId, index)
          assert.isTrue(success)
        })

        it('should execute the proposal', async () => {
          await governance.execute(proposalId, index)
          assert.equal(await testTransactions.getValue(1).valueOf(), 1)
        })

        it('should delete the proposal', async () => {
          await governance.execute(proposalId, index)
          assert.isFalse(await governance.proposalExists(proposalId))
        })

        it('should update the participation baseline', async () => {
          await governance.execute(proposalId, index)
          const [actualParticipationBaseline, , ,] = await governance.getParticipationParameters()
          assertEqualBN(actualParticipationBaseline, expectedParticipationBaseline)
        })

        it('should emit the ProposalExecuted event', async () => {
          const resp = await governance.execute(proposalId, index)
          assert.equal(resp.logs.length, 2)
          const log = resp.logs[0]
          assertLogMatches2(log, {
            event: 'ProposalExecuted',
            args: {
              proposalId: new BigNumber(proposalId),
            },
          })
        })

        it('should emit the ParticipationBaselineUpdated event', async () => {
          const resp = await governance.execute(proposalId, index)
          assert.equal(resp.logs.length, 2)
          const log = resp.logs[1]
          assertLogMatches2(log, {
            event: 'ParticipationBaselineUpdated',
            args: {
              participationBaseline: expectedParticipationBaseline,
            },
          })
        })

        it('should revert when the index is out of bounds', async () => {
          await assertRevert(governance.execute(proposalId, index + 1))
        })
      })

      describe('when the proposal cannot execute successfully', () => {
        beforeEach(async () => {
          await governance.propose(
            [transactionFail.value],
            [transactionFail.destination],
            // @ts-ignore bytes type
            transactionFail.data,
            [transactionFail.data.length],
            descriptionUrl,
            // @ts-ignore: TODO(mcortesi) fix typings for TransactionDetails
            { value: minDeposit }
          )
          await timeTravel(dequeueFrequency, web3)
          await governance.approve(proposalId, index)
          await timeTravel(approvalStageDuration, web3)
          await mockLockedGold.setAccountTotalLockedGold(account, weight)
          await governance.vote(proposalId, index, value)
          await timeTravel(referendumStageDuration, web3)
        })

        it('should revert', async () => {
          await assertRevert(governance.execute(proposalId, index))
        })
      })

      describe('when the proposal cannot execute because it is not a contract address', () => {
        beforeEach(async () => {
          await governance.propose(
            [transactionSuccess1.value],
            [accounts[1]],
            // @ts-ignore
            transactionSuccess1.data,
            [transactionSuccess1.data.length],
            descriptionUrl,
            // @ts-ignore: TODO(mcortesi) fix typings for TransactionDetails
            { value: minDeposit }
          )
          await timeTravel(dequeueFrequency, web3)
          await governance.approve(proposalId, index)
          await timeTravel(approvalStageDuration, web3)
          await mockLockedGold.setAccountTotalLockedGold(account, weight)
          await governance.vote(proposalId, index, value)
          await timeTravel(referendumStageDuration, web3)
        })

        it('should revert', async () => {
          await assertRevert(governance.execute(proposalId, index))
        })
      })
    })

    describe('when executing a proposal with two transactions', () => {
      describe('when the proposal can execute successfully', () => {
        beforeEach(async () => {
          await governance.propose(
            [transactionSuccess1.value, transactionSuccess2.value],
            [transactionSuccess1.destination, transactionSuccess2.destination],
            // @ts-ignore
            Buffer.concat([transactionSuccess1.data, transactionSuccess2.data]),
            [transactionSuccess1.data.length, transactionSuccess2.data.length],
            descriptionUrl,
            // @ts-ignore: TODO(mcortesi) fix typings for TransactionDetails
            { value: minDeposit }
          )
          await timeTravel(dequeueFrequency, web3)
          await governance.approve(proposalId, index)
          await timeTravel(approvalStageDuration, web3)
          await mockLockedGold.setAccountTotalLockedGold(account, weight)
          await governance.vote(proposalId, index, value)
          await timeTravel(referendumStageDuration, web3)
        })

        it('should return true', async () => {
          const success = await governance.execute.call(proposalId, index)
          assert.isTrue(success)
        })

        it('should execute the proposal', async () => {
          await governance.execute(proposalId, index)
          assert.equal(await testTransactions.getValue(1).valueOf(), 1)
          assert.equal(await testTransactions.getValue(2).valueOf(), 1)
        })

        it('should delete the proposal', async () => {
          await governance.execute(proposalId, index)
          assert.isFalse(await governance.proposalExists(proposalId))
        })

        it('should update the participation baseline', async () => {
          await governance.execute(proposalId, index)
          const [actualParticipationBaseline, , ,] = await governance.getParticipationParameters()
          assertEqualBN(actualParticipationBaseline, expectedParticipationBaseline)
        })

        it('should emit the ProposalExecuted event', async () => {
          const resp = await governance.execute(proposalId, index)
          assert.equal(resp.logs.length, 2)
          const log = resp.logs[0]
          assertLogMatches2(log, {
            event: 'ProposalExecuted',
            args: {
              proposalId: new BigNumber(proposalId),
            },
          })
        })

        it('should emit the ParticipationBaselineUpdated event', async () => {
          const resp = await governance.execute(proposalId, index)
          assert.equal(resp.logs.length, 2)
          const log = resp.logs[1]
          assertLogMatches2(log, {
            event: 'ParticipationBaselineUpdated',
            args: {
              participationBaseline: expectedParticipationBaseline,
            },
          })
        })
      })

      describe('when the proposal cannot execute successfully', () => {
        describe('when the first transaction cannot execute', () => {
          beforeEach(async () => {
            await governance.propose(
              [transactionSuccess1.value, transactionFail.value],
              [transactionSuccess1.destination, transactionFail.destination],
              // @ts-ignore
              Buffer.concat([transactionSuccess1.data, transactionFail.data]),
              [transactionSuccess1.data.length, transactionFail.data.length],
              descriptionUrl,
              // @ts-ignore: TODO(mcortesi) fix typings for TransactionDetails
              { value: minDeposit }
            )
            await timeTravel(dequeueFrequency, web3)
            await governance.approve(proposalId, index)
            await timeTravel(approvalStageDuration, web3)
            await mockLockedGold.setAccountTotalLockedGold(account, weight)
            await governance.vote(proposalId, index, value)
            await timeTravel(referendumStageDuration, web3)
          })

          it('should revert', async () => {
            await assertRevert(governance.execute(proposalId, index))
          })
        })

        describe('when the second transaction cannot execute', () => {
          beforeEach(async () => {
            await governance.propose(
              [transactionFail.value, transactionSuccess1.value],
              [transactionFail.destination, transactionSuccess1.destination],
              // @ts-ignore
              Buffer.concat([transactionFail.data, transactionSuccess1.data]),
              [transactionFail.data.length, transactionSuccess1.data.length],
              descriptionUrl,
              // @ts-ignore: TODO(mcortesi) fix typings for TransactionDetails
              { value: minDeposit }
            )
            await timeTravel(dequeueFrequency, web3)
            await governance.approve(proposalId, index)
            await timeTravel(approvalStageDuration, web3)
            await mockLockedGold.setAccountTotalLockedGold(account, weight)
            await governance.vote(proposalId, index, value)
            await timeTravel(referendumStageDuration, web3)
          })

          it('should revert', async () => {
            await assertRevert(governance.execute(proposalId, index))
          })
        })
      })
    })

    describe('when the proposal is past the execution stage', () => {
      beforeEach(async () => {
        await governance.propose(
          [transactionSuccess1.value],
          [transactionSuccess1.destination],
          // @ts-ignore bytes type
          transactionSuccess1.data,
          [transactionSuccess1.data.length],
          descriptionUrl,
          // @ts-ignore: TODO(mcortesi) fix typings for TransactionDetails
          { value: minDeposit }
        )
        await timeTravel(dequeueFrequency, web3)
        await governance.approve(proposalId, index)
        await timeTravel(approvalStageDuration, web3)
        await mockLockedGold.setAccountTotalLockedGold(account, weight)
        await governance.vote(proposalId, index, value)
        await timeTravel(referendumStageDuration, web3)
        await timeTravel(executionStageDuration, web3)
      })

      it('should return false', async () => {
        const success = await governance.execute.call(proposalId, index)
        assert.isFalse(success)
      })

      it('should delete the proposal', async () => {
        await governance.execute(proposalId, index)
        assert.isFalse(await governance.proposalExists(proposalId))
      })

      it('should remove the proposal ID from dequeued', async () => {
        await governance.execute(proposalId, index)
        const dequeued = await governance.getDequeue()
        assert.notInclude(
          dequeued.map((x) => x.toNumber()),
          proposalId
        )
      })

      it('should add the index to empty indices', async () => {
        await governance.execute(proposalId, index)
        const emptyIndex = await governance.emptyIndices(0)
        assert.equal(emptyIndex.toNumber(), index)
      })

      it('should update the participation baseline', async () => {
        await governance.execute(proposalId, index)
        const [actualParticipationBaseline, , ,] = await governance.getParticipationParameters()
        assertEqualBN(actualParticipationBaseline, expectedParticipationBaseline)
      })

      it('should emit the ParticipationBaselineUpdated event', async () => {
        const resp = await governance.execute(proposalId, index)
        assert.equal(resp.logs.length, 1)
        const log = resp.logs[0]
        assertLogMatches2(log, {
          event: 'ParticipationBaselineUpdated',
          args: {
            participationBaseline: expectedParticipationBaseline,
          },
        })
      })
    })
  })

  describe('#approveHotfix()', () => {
    it('should mark the hotfix record approved when called by approver', async () => {
      await governance.approveHotfix(hotfixHashStr, { from: approver })
      const [approved, ,] = await governance.getHotfixRecord.call(hotfixHashStr)
      assert.isTrue(approved)
    })

    it('should emit the HotfixApproved event', async () => {
      const resp = await governance.approveHotfix(hotfixHashStr, { from: approver })
      assert.equal(resp.logs.length, 1)
      const log = resp.logs[0]
      assertLogMatches2(log, {
        event: 'HotfixApproved',
        args: {
          hash: matchAny,
        },
      })
      assert.isTrue(Buffer.from(stripHexEncoding(log.args.hash), 'hex').equals(hotfixHash))
    })

    it('should revert when called by non-approver', async () => {
      await assertRevert(governance.approveHotfix(hotfixHashStr, { from: accounts[2] }))
    })
  })

  describe('#whitelistHotfix()', () => {
    beforeEach(async () => {
      // from GovernanceTest
      await governance.addValidator(accounts[2])
      await governance.addValidator(accounts[3])
    })

    it('should emit the HotfixWhitelist event', async () => {
      const resp = await governance.whitelistHotfix(hotfixHashStr, { from: accounts[3] })
      assert.equal(resp.logs.length, 1)
      const log = resp.logs[0]
      assertLogMatches2(log, {
        event: 'HotfixWhitelisted',
        args: {
          hash: matchAny,
          whitelister: accounts[3],
        },
      })
      assert.isTrue(Buffer.from(stripHexEncoding(log.args.hash), 'hex').equals(hotfixHash))
    })
  })

  describe('#hotfixWhitelistValidatorTally', () => {
    const newHotfixHash = '0x' + keccak256('celo bug fix').toString('hex')

    const validators = zip(
      (_account, signer) => ({ account: _account, signer }),
      accounts.slice(2, 5),
      accounts.slice(5, 8)
    )

    beforeEach(async () => {
      await concurrentMap(5, validators, async (validator) => {
        await accountsInstance.createAccount({ from: validator.account })
        const sig = await getParsedSignatureOfAddress(web3, validator.account, validator.signer)
        await accountsInstance.authorizeValidatorSigner(validator.signer, sig.v, sig.r, sig.s, {
          from: validator.account,
        })
        // add signers for mock precompile
        await governance.addValidator(validator.signer)
      })
    })

    const whitelistFrom = (t: keyof typeof validators[0]) =>
      concurrentMap(5, validators, (v) => governance.whitelistHotfix(newHotfixHash, { from: v[t] }))

    const checkTally = async () => {
      const tally = await governance.hotfixWhitelistValidatorTally(newHotfixHash)
      assert.equal(tally.toNumber(), validators.length)
    }

    it('should count validator accounts that have whitelisted', async () => {
      await whitelistFrom('account')
      await checkTally()
    })

    it('should count authorized validator signers that have whitelisted', async () => {
      await whitelistFrom('signer')
      await checkTally()
    })

    it('should not double count validator account and authorized signer accounts', async () => {
      await whitelistFrom('signer')
      await whitelistFrom('account')
      await checkTally()
    })

    it('should return the correct tally after key rotation', async () => {
      await whitelistFrom('signer')
      const newSigner = accounts[9]
      const sig = await getParsedSignatureOfAddress(web3, validators[0].account, newSigner)
      await accountsInstance.authorizeValidatorSigner(newSigner, sig.v, sig.r, sig.s, {
        from: validators[0].account,
      })
      await checkTally()
    })
  })

  describe('#isHotfixPassing', () => {
    beforeEach(async () => {
      await governance.addValidator(accounts[2])
      await governance.addValidator(accounts[3])
      await accountsInstance.createAccount({ from: accounts[2] })
      await accountsInstance.createAccount({ from: accounts[3] })
    })

    it('should return false when hotfix has not been whitelisted', async () => {
      const passing = await governance.isHotfixPassing.call(hotfixHashStr)
      assert.isFalse(passing)
    })

    it('should return false when hotfix has been whitelisted but not by quorum', async () => {
      await governance.whitelistHotfix(hotfixHashStr, { from: accounts[2] })
      const passing = await governance.isHotfixPassing.call(hotfixHashStr)
      assert.isFalse(passing)
    })

    it('should return true when hotfix is whitelisted by quorum', async () => {
      await governance.whitelistHotfix(hotfixHashStr, { from: accounts[2] })
      await governance.whitelistHotfix(hotfixHashStr, { from: accounts[3] })
      const passing = await governance.isHotfixPassing.call(hotfixHashStr)
      assert.isTrue(passing)
    })
  })

  describe('#prepareHotfix()', () => {
    beforeEach(async () => {
      await governance.addValidator(accounts[2])
      await accountsInstance.createAccount({ from: accounts[2] })
    })

    it('should revert when hotfix is not passing', async () => {
      await assertRevert(governance.prepareHotfix(hotfixHashStr))
    })

    describe('when hotfix is passing', () => {
      beforeEach(async () => {
        await mineToNextEpoch(web3)
        await governance.whitelistHotfix(hotfixHashStr, { from: accounts[2] })
      })

      it('should mark the hotfix record prepared epoch', async () => {
        await governance.prepareHotfix(hotfixHashStr)
        const [, , preparedEpoch] = await governance.getHotfixRecord.call(hotfixHashStr)
        const currEpoch = new BigNumber(await governance.getEpochNumber())
        assertEqualBN(preparedEpoch, currEpoch)
      })

      it('should emit the HotfixPrepared event', async () => {
        const resp = await governance.prepareHotfix(hotfixHashStr)
        const currEpoch = new BigNumber(await governance.getEpochNumber())
        assert.equal(resp.logs.length, 1)
        const log = resp.logs[0]
        assertLogMatches2(log, {
          event: 'HotfixPrepared',
          args: {
            hash: matchAny,
            epoch: currEpoch,
          },
        })
        assert.isTrue(Buffer.from(stripHexEncoding(log.args.hash), 'hex').equals(hotfixHash))
      })

      it('should revert when epoch == preparedEpoch', async () => {
        await governance.prepareHotfix(hotfixHashStr)
        await assertRevert(governance.prepareHotfix(hotfixHashStr))
      })

      it('should succeed for epoch != preparedEpoch', async () => {
        await governance.prepareHotfix(hotfixHashStr)
        await mineToNextEpoch(web3)
        await governance.prepareHotfix(hotfixHashStr)
      })
    })
  })

  describe('#executeHotfix()', () => {
    const executeHotfixTx = () =>
      governance.executeHotfix(
        [transactionSuccess1.value],
        [transactionSuccess1.destination],
        // @ts-ignore bytes type
        transactionSuccess1.data,
        [transactionSuccess1.data.length],
        salt
      )

    it('should revert when hotfix not approved', async () => {
      await assertRevert(executeHotfixTx())
    })

    it('should revert when hotfix not prepared for current epoch', async () => {
      await mineToNextEpoch(web3)
      await governance.approveHotfix(hotfixHashStr, { from: approver })
      await assertRevert(executeHotfixTx())
    })

    it('should revert when hotfix prepared but not for current epoch', async () => {
      await governance.approveHotfix(hotfixHashStr, { from: approver })
      await governance.addValidator(accounts[2])
      await accountsInstance.createAccount({ from: accounts[2] })
      await governance.whitelistHotfix(hotfixHashStr, { from: accounts[2] })
      await governance.prepareHotfix(hotfixHashStr, { from: accounts[2] })
      await mineToNextEpoch(web3)
      await assertRevert(executeHotfixTx())
    })

    describe('when hotfix is approved and prepared for current epoch', () => {
      beforeEach(async () => {
        await governance.approveHotfix(hotfixHashStr, { from: approver })
        await mineToNextEpoch(web3)
        await governance.addValidator(accounts[2])
        await accountsInstance.createAccount({ from: accounts[2] })
        await governance.whitelistHotfix(hotfixHashStr, { from: accounts[2] })
        await governance.prepareHotfix(hotfixHashStr)
      })

      it('should execute the hotfix tx', async () => {
        await executeHotfixTx()
        assert.equal(await testTransactions.getValue(1).valueOf(), 1)
      })

      it('should mark the hotfix record as executed', async () => {
        await executeHotfixTx()
        const [, executed] = await governance.getHotfixRecord.call(hotfixHashStr)
        assert.isTrue(executed)
      })

      it('should emit the HotfixExecuted event', async () => {
        const resp = await executeHotfixTx()
        assert.equal(resp.logs.length, 1)
        const log = resp.logs[0]
        assertLogMatches2(log, {
          event: 'HotfixExecuted',
          args: {
            hash: matchAny,
          },
        })
        assert.isTrue(Buffer.from(stripHexEncoding(log.args.hash), 'hex').equals(hotfixHash))
      })

      it('should not be executable again', async () => {
        await executeHotfixTx()
        await assertRevert(executeHotfixTx())
      })
    })
  })

  describe('#isVoting()', () => {
    describe('when the account has never acted on a proposal', () => {
      it('should return false', async () => {
        assert.isFalse(await governance.isVoting(account))
      })
    })

    describe('when the account has upvoted a proposal', () => {
      const proposalId = 1
      beforeEach(async () => {
        await mockLockedGold.setAccountTotalLockedGold(account, weight)
        await governance.propose(
          [transactionSuccess1.value],
          [transactionSuccess1.destination],
          // @ts-ignore bytes type
          transactionSuccess1.data,
          [transactionSuccess1.data.length],
          descriptionUrl,
          // @ts-ignore: TODO(mcortesi) fix typings for TransactionDetails
          { value: minDeposit }
        )
        await governance.upvote(proposalId, 0, 0)
      })

      it('should return true', async () => {
        assert.isTrue(await governance.isVoting(account))
      })

      describe('when that upvote has been revoked', () => {
        beforeEach(async () => {
          await governance.revokeUpvote(0, 0)
        })

        it('should return false', async () => {
          assert.isFalse(await governance.isVoting(account))
        })
      })

      describe('when that proposal has expired from the queue', () => {
        beforeEach(async () => {
          await timeTravel(queueExpiry, web3)
        })

        it('should return false', async () => {
          assert.isFalse(await governance.isVoting(account))
        })
      })
    })

    describe('when the account has voted on a proposal', () => {
      const proposalId = 1
      const index = 0
      const value = VoteValue.Abstain
      beforeEach(async () => {
        await governance.propose(
          [transactionSuccess1.value],
          [transactionSuccess1.destination],
          // @ts-ignore bytes type
          transactionSuccess1.data,
          [transactionSuccess1.data.length],
          descriptionUrl,
          // @ts-ignore: TODO(mcortesi) fix typings for TransactionDetails
          { value: minDeposit }
        )
        await timeTravel(dequeueFrequency, web3)
        await governance.approve(proposalId, index)
        await timeTravel(approvalStageDuration, web3)
        await mockLockedGold.setAccountTotalLockedGold(account, weight)
        await governance.vote(proposalId, index, value)
      })

      it('should return true', async () => {
        assert.isTrue(await governance.isVoting(account))
      })

      describe('when that proposal is no longer in the referendum stage', () => {
        beforeEach(async () => {
          await timeTravel(referendumStageDuration, web3)
        })

        it('should return false', async () => {
          assert.isFalse(await governance.isVoting(account))
        })
      })
    })
  })

  describe('#isProposalPassing()', () => {
    const proposalId = 1
    const index = 0
    beforeEach(async () => {
      await accountsInstance.createAccount({ from: otherAccount })
      await governance.propose(
        [transactionSuccess1.value],
        [transactionSuccess1.destination],
        // @ts-ignore bytes type
        transactionSuccess1.data,
        [transactionSuccess1.data.length],
        descriptionUrl,
        // @ts-ignore: TODO(mcortesi) fix typings for TransactionDetails
        { value: minDeposit }
      )
      await timeTravel(dequeueFrequency, web3)
      await governance.approve(proposalId, index)
      await timeTravel(approvalStageDuration, web3)
    })

    describe('when the adjusted support is greater than threshold', () => {
      beforeEach(async () => {
        await mockLockedGold.setAccountTotalLockedGold(account, (weight * 51) / 100)
        await mockLockedGold.setAccountTotalLockedGold(otherAccount, (weight * 49) / 100)
        await governance.vote(proposalId, index, VoteValue.Yes)
        await governance.vote(proposalId, index, VoteValue.No, { from: otherAccount })
      })

      it('should return true', async () => {
        const passing = await governance.isProposalPassing(proposalId)
        assert.isTrue(passing)
      })
    })

    describe('when the adjusted support is less than or equal to threshold', () => {
      beforeEach(async () => {
        await mockLockedGold.setAccountTotalLockedGold(account, (weight * 50) / 100)
        await mockLockedGold.setAccountTotalLockedGold(otherAccount, (weight * 50) / 100)
        await governance.vote(proposalId, index, VoteValue.Yes)
        await governance.vote(proposalId, index, VoteValue.No, { from: otherAccount })
      })

      it('should return false', async () => {
        const passing = await governance.isProposalPassing(proposalId)
        assert.isFalse(passing)
      })
    })
  })
})
