import { NULL_ADDRESS, trimLeading0x } from '@celo/base/lib/address'
import { CeloContractName } from '@celo/protocol/lib/registry-utils'
import { getParsedSignatureOfAddress } from '@celo/protocol/lib/signing-utils'
import {
  assertBalance,
  assertEqualBN,
  assertLogMatches2,
  assertRevert,
  assertTransactionRevertWithReason,
  createAndAssertDelegatorDelegateeSigners,
  matchAny,
  mineToNextEpoch,
  stripHexEncoding,
  timeTravel,
} from '@celo/protocol/lib/test-utils'
import { concurrentMap } from '@celo/utils/lib/async'
import { zip } from '@celo/utils/lib/collections'
import { fixed1, multiply, toFixed } from '@celo/utils/lib/fixidity'
import { bufferToHex, toBuffer } from '@ethereumjs/util'
import BigNumber from 'bignumber.js'
import { keccak256 } from 'ethereum-cryptography/keccak'
import { hexToBytes, utf8ToBytes } from 'ethereum-cryptography/utils'
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
    networkWeight: proposalParams[5],
    approved: proposalParams[6],
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

enum Stage {
  None = 0,
  Queued,
  Approval,
  Referendum,
  Execution,
  Expiration,
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
  const referendumStageDuration = 5 * 60 // 5 minutes
  const executionStageDuration = 1 * 60 // 1 minute
  const participationBaseline = toFixed(5 / 10)
  const participationFloor = toFixed(5 / 100)
  const baselineUpdateFactor = toFixed(1 / 5)
  const baselineQuorumFactor = toFixed(1)
  const yesVotes = 100
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
    accountsInstance = await Accounts.new(true)
    governance = await Governance.new()
    mockLockedGold = await MockLockedGold.new()
    mockValidators = await MockValidators.new()
    registry = await Registry.new(true)
    testTransactions = await TestTransactions.new()
    await governance.initialize(
      registry.address,
      approver,
      concurrentProposals,
      minDeposit,
      queueExpiry,
      dequeueFrequency,
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
    await mockLockedGold.setAccountTotalGovernancePower(account, yesVotes)
    await mockLockedGold.setTotalLockedGold(yesVotes)
    transactionSuccess1 = {
      value: 0,
      destination: testTransactions.address,
      data: toBuffer(
        // @ts-ignore
        testTransactions.contract.methods.setValue(1, 1, true).encodeABI()
      ),
    }
    transactionSuccess2 = {
      value: 0,
      destination: testTransactions.address,
      data: toBuffer(
        // @ts-ignore
        testTransactions.contract.methods.setValue(2, 1, true).encodeABI()
      ),
    }
    transactionFail = {
      value: 0,
      destination: testTransactions.address,
      data: toBuffer(
        // @ts-ignore
        testTransactions.contract.methods.setValue(3, 1, false).encodeABI()
      ),
    }
    salt = '0x657ed9d64e84fa3d1af43b3a307db22aba2d90a158015df1c588c02e24ca08f0'
    const encodedParam = web3.eth.abi.encodeParameters(
      ['uint256[]', 'address[]', 'bytes', 'uint256[]', 'bytes32'],
      [
        [String(transactionSuccess1.value)],
        [transactionSuccess1.destination.toString()],
        transactionSuccess1.data,
        [String(transactionSuccess1.data.length)],
        salt,
      ]
    )

    hotfixHash = toBuffer(keccak256(hexToBytes(trimLeading0x(encodedParam))))
    hotfixHashStr = bufferToHex(hotfixHash)
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
      const actualReferendumStageDuration = await governance.getReferendumStageDuration()
      const actualExecutionStageDuration = await governance.getExecutionStageDuration()
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
      await assertTransactionRevertWithReason(
        governance.initialize(
          registry.address,
          approver,
          concurrentProposals,
          minDeposit,
          queueExpiry,
          dequeueFrequency,
          referendumStageDuration,
          executionStageDuration,
          participationBaseline,
          participationFloor,
          baselineUpdateFactor,
          baselineQuorumFactor
        ),
        'contract already initialized'
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
      await assertTransactionRevertWithReason(
        governance.setApprover(NULL_ADDRESS),
        'Approver cannot be 0'
      )
    })

    it('should revert when the approver is unchanged', async () => {
      await assertTransactionRevertWithReason(
        governance.setApprover(approver),
        'Approver unchanged'
      )
    })

    it('should revert when called by anyone other than the owner', async () => {
      await assertTransactionRevertWithReason(
        governance.setApprover(newApprover, { from: nonOwner }),
        'Ownable: caller is not the owner'
      )
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
      await assertTransactionRevertWithReason(
        governance.setMinDeposit(minDeposit),
        'Minimum deposit unchanged'
      )
    })

    it('should revert when called by anyone other than the owner', async () => {
      await assertTransactionRevertWithReason(
        governance.setMinDeposit(newMinDeposit, { from: nonOwner }),
        'Ownable: caller is not the owner'
      )
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
      await assertTransactionRevertWithReason(
        governance.setConcurrentProposals(0),
        'Number of proposals must be larger than zero'
      )
    })

    it('should revert when concurrent proposals is unchanged', async () => {
      await assertTransactionRevertWithReason(
        governance.setConcurrentProposals(concurrentProposals),
        'Number of proposals unchanged'
      )
    })

    it('should revert when called by anyone other than the owner', async () => {
      await assertTransactionRevertWithReason(
        governance.setConcurrentProposals(newConcurrentProposals, { from: nonOwner }),
        'Ownable: caller is not the owner'
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
      await assertTransactionRevertWithReason(
        governance.setQueueExpiry(0),
        'QueueExpiry must be larger than 0'
      )
    })

    it('should revert when queue expiry is unchanged', async () => {
      await assertTransactionRevertWithReason(
        governance.setQueueExpiry(queueExpiry),
        'QueueExpiry unchanged'
      )
    })

    it('should revert when called by anyone other than the owner', async () => {
      await assertTransactionRevertWithReason(
        governance.setQueueExpiry(newQueueExpiry, { from: nonOwner }),
        'Ownable: caller is not the owner'
      )
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
      await assertTransactionRevertWithReason(
        governance.setDequeueFrequency(0),
        'dequeueFrequency must be larger than 0'
      )
    })

    it('should revert when dequeue frequency is unchanged', async () => {
      await assertTransactionRevertWithReason(
        governance.setDequeueFrequency(dequeueFrequency),
        'dequeueFrequency unchanged'
      )
    })

    it('should revert when called by anyone other than the owner', async () => {
      await assertTransactionRevertWithReason(
        governance.setDequeueFrequency(newDequeueFrequency, { from: nonOwner }),
        'Ownable: caller is not the owner'
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
      await assertTransactionRevertWithReason(
        governance.setReferendumStageDuration(0),
        'Duration must be larger than 0'
      )
    })

    it('should revert when referendum stage duration is unchanged', async () => {
      await assertTransactionRevertWithReason(
        governance.setReferendumStageDuration(referendumStageDuration),
        'Duration unchanged'
      )
    })

    it('should revert when called by anyone other than the owner', async () => {
      await assertTransactionRevertWithReason(
        governance.setReferendumStageDuration(newReferendumStageDuration, { from: nonOwner }),
        'Ownable: caller is not the owner'
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
      await assertTransactionRevertWithReason(
        governance.setExecutionStageDuration(0),
        'Duration must be larger than 0'
      )
    })

    it('should revert when execution stage duration is unchanged', async () => {
      await assertTransactionRevertWithReason(
        governance.setExecutionStageDuration(executionStageDuration),
        'Duration unchanged'
      )
    })

    it('should revert when called by anyone other than the owner', async () => {
      await assertTransactionRevertWithReason(
        governance.setExecutionStageDuration(newExecutionStageDuration, { from: nonOwner }),
        'Ownable: caller is not the owner'
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
      await assertTransactionRevertWithReason(
        governance.setParticipationFloor(toFixed(101 / 100)),
        'Participation floor greater than one'
      )
    })

    it('should revert when called by anyone other than the owner', async () => {
      await assertTransactionRevertWithReason(
        governance.setParticipationFloor(differentParticipationFloor, { from: nonOwner }),
        'Ownable: caller is not the owner'
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
      await assertTransactionRevertWithReason(
        governance.setBaselineUpdateFactor(toFixed(101 / 100)),
        'Baseline update factor greater than one'
      )
    })

    it('should revert when called by anyone other than the owner', async () => {
      await assertTransactionRevertWithReason(
        governance.setBaselineUpdateFactor(differentBaselineUpdateFactor, { from: nonOwner }),
        'Ownable: caller is not the owner'
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
      await assertTransactionRevertWithReason(
        governance.setBaselineQuorumFactor(toFixed(101 / 100)),
        'Baseline quorum factor greater than one'
      )
    })

    it('should revert when called by anyone other than the owner', async () => {
      await assertTransactionRevertWithReason(
        governance.setBaselineQuorumFactor(differentBaselineQuorumFactor, { from: nonOwner }),
        'Ownable: caller is not the owner'
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
      await assertTransactionRevertWithReason(
        governance.setConstitution(NULL_ADDRESS, nullFunctionId, threshold),
        'Destination cannot be zero'
      )
    })

    it('should revert when the threshold is zero', async () => {
      await assertTransactionRevertWithReason(
        governance.setConstitution(destination, nullFunctionId, 0),
        'Threshold has to be greater than majority and not greater than unanimity'
      )
    })

    it('should revert when the threshold is not greater than a majority', async () => {
      await assertTransactionRevertWithReason(
        governance.setConstitution(destination, nullFunctionId, toFixed(1 / 2)),
        'Threshold has to be greater than majority and not greater than unanimity'
      )
    })

    it('should revert when the threshold is greater than 100%', async () => {
      await assertTransactionRevertWithReason(
        governance.setConstitution(destination, nullFunctionId, toFixed(101 / 100)),
        'Threshold has to be greater than majority and not greater than unanimity'
      )
    })

    it('should revert when called by anyone other than the owner', async () => {
      await assertTransactionRevertWithReason(
        governance.setConstitution(destination, nullFunctionId, threshold, {
          from: nonOwner,
        }),
        'Ownable: caller is not the owner'
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
        assertEqualBN(proposal.networkWeight, 0)
        assert.equal(proposal.approved, false)
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
        assertEqualBN(proposal.networkWeight, 0)
        assert.equal(proposal.approved, false)
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
        assertEqualBN(proposal.networkWeight, 0)
        assert.equal(proposal.approved, false)
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
      let originalLastDequeue: BigNumber
      beforeEach(async () => {
        originalLastDequeue = await governance.lastDequeue()
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
        assert.isBelow(originalLastDequeue.toNumber(), (await governance.lastDequeue()).toNumber())
      })
    })

    it('should not update lastDequeue when no queued proposal(s)', async () => {
      const originalLastDequeue = await governance.lastDequeue()
      await timeTravel(dequeueFrequency, web3)

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

      assert.equal((await governance.getQueueLength()).toNumber(), 1)
      assert.equal((await governance.lastDequeue()).toNumber(), originalLastDequeue.toNumber())
    })
  })

  describe('#upvote()', () => {
    const proposalId = new BigNumber(1)
    beforeEach(async () => {
      await mockLockedGold.setAccountTotalLockedGold(account, yesVotes)
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
      assertEqualBN(await governance.getUpvotes(proposalId), yesVotes)
    })

    it('should mark the account as having upvoted the proposal', async () => {
      await governance.upvote(proposalId, 0, 0)
      const [recordId, recordWeight] = await governance.getUpvoteRecord(account)
      assertEqualBN(recordId, proposalId)
      assertEqualBN(recordWeight, yesVotes)
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
          upvotes: new BigNumber(yesVotes),
        },
      })
    })

    it('should revert when upvoting a proposal that is not queued', async () => {
      await assertTransactionRevertWithReason(
        governance.upvote(proposalId.plus(1), 0, 0),
        'cannot upvote a proposal not in the queue'
      )
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
        assertEqualBN(upvotes[0], yesVotes)
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
        await mockLockedGold.setAccountTotalLockedGold(otherAccount1, yesVotes)
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
          proposalId.toNumber()
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
      let originalLastDequeue: BigNumber
      beforeEach(async () => {
        originalLastDequeue = await governance.lastDequeue()
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
        assert.isBelow(originalLastDequeue.toNumber(), (await governance.lastDequeue()).toNumber())
      })

      it('should revert when upvoting a proposal that will be dequeued', async () => {
        await assertTransactionRevertWithReason(
          governance.upvote(proposalId, 0, 0),
          'cannot upvote a proposal not in the queue'
        )
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
        assertEqualBN(await governance.getUpvotes(upvotedProposalId), yesVotes)
      })

      it('should mark the account as having upvoted the proposal', async () => {
        await governance.upvote(upvotedProposalId, 0, 0)
        const [recordId, recordWeight] = await governance.getUpvoteRecord(account)
        assertEqualBN(recordId, upvotedProposalId)
        assertEqualBN(recordWeight, yesVotes)
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
            upvotes: new BigNumber(yesVotes),
          },
        })
      })
    })
  })

  describe('#revokeUpvote()', () => {
    const proposalId = new BigNumber(1)
    beforeEach(async () => {
      await mockLockedGold.setAccountTotalLockedGold(account, yesVotes)
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
          revokedUpvotes: new BigNumber(yesVotes),
        },
      })
    })

    it('should revert when the account does not have an upvoted proposal', async () => {
      await governance.revokeUpvote(0, 0)
      await assertTransactionRevertWithReason(
        governance.revokeUpvote(0, 0),
        'Account has no historical upvote'
      )
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
      let originalLastDequeue: BigNumber
      beforeEach(async () => {
        originalLastDequeue = await governance.lastDequeue()
        await timeTravel(dequeueFrequency, web3)
      })

      it('should dequeue the proposal', async () => {
        await governance.revokeUpvote(0, 0)
        assert.isFalse(await governance.isQueued(proposalId))
        assert.equal((await governance.getQueueLength()).toNumber(), 0)
        assertEqualBN(await governance.dequeued(0), proposalId)
        assert.isBelow(originalLastDequeue.toNumber(), (await governance.lastDequeue()).toNumber())
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
      await assertTransactionRevertWithReason(
        governance.withdraw({ from: accounts[1] }),
        'Nothing to withdraw'
      )
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

    it('should return updated proposal details correctly', async () => {
      await governance.approve(proposalId, index)
      const proposal = parseProposalParams(await governance.getProposal(proposalId))
      assert.equal(proposal.proposer, accounts[0])
      assert.equal(proposal.deposit, minDeposit)
      assert.equal(proposal.transactionCount, 1)
      assert.equal(proposal.descriptionUrl, descriptionUrl)
      assert.equal(proposal.approved, true)
      assertEqualBN(proposal.networkWeight, yesVotes)
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
      await assertTransactionRevertWithReason(
        governance.approve(proposalId, index + 1),
        'Provided index greater than dequeue length.'
      )
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
      await assertTransactionRevertWithReason(
        governance.approve(otherProposalId, index),
        'Proposal not dequeued'
      )
    })

    it('should revert when not called by the approver', async () => {
      await assertTransactionRevertWithReason(
        governance.approve(proposalId, index, { from: nonApprover }),
        'msg.sender not approver'
      )
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
      await assertTransactionRevertWithReason(
        governance.approve(proposalId + 1, index),
        'Proposal not dequeued'
      )
    })

    it('should revert if the proposal has already been approved', async () => {
      await governance.approve(proposalId, index)
      await assertTransactionRevertWithReason(
        governance.approve(proposalId, index),
        'Proposal already approved'
      )
    })

    describe('when the proposal is within referendum stage', () => {
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
      })

      it('should return true', async () => {
        const success = await governance.approve.call(proposalId, index)
        assert.isTrue(success)
      })

      it('should not delete the proposal', async () => {
        await governance.approve(proposalId, index)
        assert.isTrue(await governance.proposalExists(proposalId))
      })

      it('should not remove the proposal ID from dequeued', async () => {
        await governance.approve(proposalId, index)
        const dequeued = await governance.getDequeue()
        assert.include(
          dequeued.map((x) => x.toNumber()),
          proposalId
        )
      })

      it('should emit the ParticipationBaselineUpdated event', async () => {
        const resp = await governance.approve(proposalId, index)
        assert.equal(resp.logs.length, 1)
        const log = resp.logs[0]
        assertLogMatches2(log, {
          event: 'ProposalApproved',
          args: {
            proposalId: new BigNumber(proposalId),
          },
        })
      })
    })

    describe('when the proposal is past the referendum stage', () => {
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
        await timeTravel(referendumStageDuration + 1, web3)
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

  describe('#revokeVotes()', () => {
    beforeEach(async () => {
      await governance.setConcurrentProposals(3)
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
      await governance.propose(
        [transactionSuccess2.value],
        [transactionSuccess2.destination],
        // @ts-ignore bytes type
        transactionSuccess2.data,
        [transactionSuccess2.data.length],
        descriptionUrl,
        // @ts-ignore: TODO(mcortesi) fix typings for TransactionDetails
        { value: minDeposit }
      )
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
      await governance.approve(1, 0)
      await governance.approve(2, 1)
      await governance.approve(3, 2)
      await mockLockedGold.setAccountTotalGovernancePower(account, yesVotes)
    })

    for (let numVoted = 0; numVoted < 3; numVoted++) {
      describe(`when account has voted on ${numVoted} proposals`, () => {
        const value = VoteValue.Yes
        beforeEach(async () => {
          for (let i = 0; i < numVoted; i++) {
            await governance.vote(i + 1, i, value)
          }
        })

        it('should unset the most recent referendum proposal voted on', async () => {
          await governance.revokeVotes()
          const mostRecentReferendum = await governance.getMostRecentReferendumProposal(account)
          assert.equal(mostRecentReferendum.toNumber(), 0)
        })

        it('should return false on `isVoting`', async () => {
          await governance.revokeVotes()
          const voting = await governance.isVoting(accounts[0])
          assert.isFalse(voting)
        })

        it(`should emit the ProposalVoteRevokedV2 event ${numVoted} times`, async () => {
          const resp = await governance.revokeVotes()
          assert.equal(resp.logs.length, numVoted)
          resp.logs.map((log, i) =>
            assertLogMatches2(log, {
              event: 'ProposalVoteRevokedV2',
              args: {
                proposalId: i + 1,
                account,
                yesVotes,
                noVotes: 0,
                abstainVotes: 0,
              },
            })
          )
        })

        it('should not revert when proposals are not in the Referendum stage', async () => {
          await timeTravel(referendumStageDuration, web3)
          const success = await governance.revokeVotes.call()
          assert.isTrue(success)
        })
      })
    }

    for (let numVoted = 0; numVoted < 3; numVoted++) {
      describe(`when account has partially voted on ${numVoted} proposals`, () => {
        const yes = 10
        const no = 30
        const abstain = 0
        beforeEach(async () => {
          for (let i = 0; i < numVoted; i++) {
            await governance.votePartially(i + 1, i, yes, no, abstain)
          }
        })

        it('should unset the most recent referendum proposal voted on', async () => {
          await governance.revokeVotes()
          const mostRecentReferendum = await governance.getMostRecentReferendumProposal(account)
          assert.equal(mostRecentReferendum.toNumber(), 0)
        })

        it('should return false on `isVoting`', async () => {
          await governance.revokeVotes()
          const voting = await governance.isVoting(accounts[0])
          const totalVotesByAccount = await governance.getAmountOfGoldUsedForVoting(accounts[0])
          assert.isFalse(voting)
          assert.isTrue(totalVotesByAccount.eq(0))
        })

        it(`should emit the ProposalVoteRevokedV2 event ${numVoted} times`, async () => {
          const resp = await governance.revokeVotes()
          assert.equal(resp.logs.length, numVoted)
          resp.logs.map((log, i) =>
            assertLogMatches2(log, {
              event: 'ProposalVoteRevokedV2',
              args: {
                proposalId: i + 1,
                account,
                yesVotes: yes,
                noVotes: no,
                abstainVotes: abstain,
              },
            })
          )
        })

        it('should not revert when proposals are not in the Referendum stage', async () => {
          await timeTravel(referendumStageDuration, web3)
          const success = await governance.revokeVotes.call()
          assert.isTrue(success)
        })
      })
    }
  })

  describe('#vote()', () => {
    const proposalId = 1
    const index = 0
    const value = VoteValue.Yes

    describe('when proposal is approved', () => {
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
        await mockLockedGold.setAccountTotalGovernancePower(account, yesVotes)
      })

      it('should return true', async () => {
        const success = await governance.vote.call(proposalId, index, value, {
          gas: 7000000,
          from: account,
        })
        assert.isTrue(success)
      })

      it('should increment the vote totals', async () => {
        await governance.vote(proposalId, index, value)
        const [yes, ,] = await governance.getVoteTotals(proposalId)
        assert.equal(yes.toNumber(), yesVotes)
      })

      it("should set the voter's vote record", async () => {
        await governance.vote(proposalId, index, value)
        const [recordProposalId, , , yesVotesRecord, noVotesRecord, abstainVotesRecord] =
          await governance.getVoteRecord(account, index)
        assertEqualBN(recordProposalId, proposalId)
        assertEqualBN(yesVotesRecord, yesVotes)
        assertEqualBN(noVotesRecord, 0)
        assertEqualBN(abstainVotesRecord, 0)
      })

      it('should set the most recent referendum proposal voted on', async () => {
        await governance.vote(proposalId, index, value)
        assert.equal(
          (await governance.getMostRecentReferendumProposal(account)).toNumber(),
          proposalId
        )
      })

      it('should emit the ProposalVotedV2 event', async () => {
        const resp = await governance.vote(proposalId, index, value)
        assert.equal(resp.logs.length, 1)
        const log = resp.logs[0]
        assertLogMatches2(log, {
          event: 'ProposalVotedV2',
          args: {
            proposalId: new BigNumber(proposalId),
            account,
            yesVotes,
            noVotes: 0,
            abstainVotes: 0,
          },
        })
      })

      it('should revert when the account weight is 0', async () => {
        await mockLockedGold.setAccountTotalGovernancePower(account, 0)
        await assertTransactionRevertWithReason(
          governance.vote(proposalId, index, value),
          'Voter weight zero'
        )
      })

      it('should revert when the index is out of bounds', async () => {
        await assertTransactionRevertWithReason(
          governance.vote(proposalId, index + 1, value),
          'Provided index greater than dequeue length.'
        )
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
        await assertTransactionRevertWithReason(
          governance.vote(otherProposalId, index, value),
          'Proposal not dequeued'
        )
      })

      describe('when voting on two proposals', () => {
        const proposalId1 = 2
        const proposalId2 = 3
        const index1 = 1
        const index2 = 2
        beforeEach(async () => {
          const newDequeueFrequency = 60
          await governance.setDequeueFrequency(newDequeueFrequency)
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
          await timeTravel(newDequeueFrequency, web3)
          await governance.approve(proposalId1, index1)
          await governance.propose(
            [transactionSuccess2.value],
            [transactionSuccess2.destination],
            // @ts-ignore bytes type
            transactionSuccess2.data,
            [transactionSuccess2.data.length],
            descriptionUrl,
            // @ts-ignore: TODO(mcortesi) fix typings for TransactionDetails
            { value: minDeposit }
          )
          await timeTravel(newDequeueFrequency, web3)
          await governance.approve(proposalId2, index2)
          await mockLockedGold.setAccountTotalGovernancePower(account, yesVotes)
        })

        it('should set mostRecentReferendumProposal to the youngest proposal voted on', async () => {
          await governance.vote(proposalId2, index2, value)
          await governance.vote(proposalId1, index1, value)
          const mostRecent = await governance.getMostRecentReferendumProposal(accounts[0])
          assert.equal(mostRecent.toNumber(), proposalId2)
        })

        it('should return true on `isVoting`', async () => {
          await governance.vote(proposalId2, index2, value)
          await governance.vote(proposalId1, index1, value)
          const voting = await governance.isVoting(accounts[0])
          assert.isTrue(voting)
        })

        describe('after the first proposal expires', () => {
          beforeEach(async () => {
            await governance.vote(proposalId2, index2, value)
            await governance.vote(proposalId1, index1, value)
            await timeTravel(referendumStageDuration - 10, web3)
          })

          it('should still return true on `isVoting`', async () => {
            const voting = await governance.isVoting(accounts[0])
            assert.isTrue(voting)
          })

          it('should no longer return true on `isVoting` after both expire', async () => {
            await timeTravel(11, web3)
            const voting = await governance.isVoting(accounts[0])
            assert.isFalse(voting)
          })
        })
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
            assert.equal(voteTotals[3 - newValue].toNumber(), yesVotes)
          })

          it("should set the voter's vote record", async () => {
            await governance.vote(proposalId, index, newValue)
            const [recordProposalId, , , yesVotesRecord, noVotesRecord, abstainVotesRecord] =
              await governance.getVoteRecord(account, index)
            assert.equal(recordProposalId.toNumber(), proposalId)

            const votesNormalized = [0, abstainVotesRecord, noVotesRecord, yesVotesRecord]

            assertEqualBN(votesNormalized[newValue], yesVotes)
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

    describe('When proposal is approved and have signer', () => {
      let accountSigner
      beforeEach(async () => {
        ;[accountSigner] = await createAndAssertDelegatorDelegateeSigners(
          accountsInstance,
          accounts,
          account
        )

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
        await mockLockedGold.setAccountTotalGovernancePower(account, yesVotes)
      })

      it('should return true', async () => {
        const success = await governance.vote.call(proposalId, index, value, {
          from: accountSigner,
        })
        assert.isTrue(success)
      })

      it('should increment the vote totals', async () => {
        await governance.vote(proposalId, index, value, { from: accountSigner })
        const [yes, ,] = await governance.getVoteTotals(proposalId)
        assert.equal(yes.toNumber(), yesVotes)
      })

      it("should set the voter's vote record", async () => {
        await governance.vote(proposalId, index, value, { from: accountSigner })
        const [recordProposalId, , , yesVotesRecord, noVotesRecord, abstainVotesRecord] =
          await governance.getVoteRecord(account, index)
        assertEqualBN(recordProposalId, proposalId)
        assertEqualBN(yesVotesRecord, yesVotes)
        assertEqualBN(noVotesRecord, 0)
        assertEqualBN(abstainVotesRecord, 0)
      })

      it('should set the most recent referendum proposal voted on', async () => {
        await governance.vote(proposalId, index, value, { from: accountSigner })
        assert.equal(
          (await governance.getMostRecentReferendumProposal(account)).toNumber(),
          proposalId
        )
      })

      it('should emit the ProposalVotedV2 event', async () => {
        await governance.dequeueProposalsIfReady()
        const resp = await governance.vote(proposalId, index, value, { from: accountSigner })
        assert.equal(resp.logs.length, resp.logs.length)
        const log = resp.logs[0]
        assertLogMatches2(log, {
          event: 'ProposalVotedV2',
          args: {
            proposalId: new BigNumber(proposalId),
            account,
            yesVotes,
            noVotes: 0,
            abstainVotes: 0,
          },
        })
      })

      it('should revert when the account weight is 0', async () => {
        await mockLockedGold.setAccountTotalGovernancePower(account, 0)
        await assertTransactionRevertWithReason(
          governance.vote(proposalId, index, value, { from: accountSigner }),
          'Voter weight zero'
        )
      })
    })

    describe('when proposal is not approved', () => {
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
        await mockLockedGold.setAccountTotalGovernancePower(account, yesVotes)
      })

      it('should return true', async () => {
        const success = await governance.vote.call(proposalId, index, value)
        assert.isTrue(success)
      })

      it('should increment the vote totals', async () => {
        await governance.vote(proposalId, index, value)
        const [yes, ,] = await governance.getVoteTotals(proposalId)
        assert.equal(yes.toNumber(), yesVotes)
      })

      it("should set the voter's vote record", async () => {
        await governance.vote(proposalId, index, value)
        const [recordProposalId, , , yesVotesRecord, noVotesRecord, abstainVotesRecord] =
          await governance.getVoteRecord(account, index)
        assertEqualBN(recordProposalId, proposalId)
        assertEqualBN(yesVotesRecord, yesVotes)
        assertEqualBN(noVotesRecord, 0)
        assertEqualBN(abstainVotesRecord, 0)
      })

      it('should set the most recent referendum proposal voted on', async () => {
        await governance.vote(proposalId, index, value)
        assert.equal(
          (await governance.getMostRecentReferendumProposal(account)).toNumber(),
          proposalId
        )
      })

      it('should emit the ProposalVotedV2 event', async () => {
        await governance.dequeueProposalsIfReady()
        const resp = await governance.vote(proposalId, index, value)
        assert.equal(resp.logs.length, resp.logs.length)
        const log = resp.logs[0]
        assertLogMatches2(log, {
          event: 'ProposalVotedV2',
          args: {
            proposalId: new BigNumber(proposalId),
            account,
            yesVotes,
            noVotes: 0,
            abstainVotes: 0,
          },
        })
      })

      it('should revert when the account weight is 0', async () => {
        await mockLockedGold.setAccountTotalGovernancePower(account, 0)
        await assertTransactionRevertWithReason(
          governance.vote(proposalId, index, value),
          'Voter weight zero'
        )
      })

      it('should revert when the index is out of bounds', async () => {
        await assertTransactionRevertWithReason(
          governance.vote(proposalId, index + 1, value),
          'Provided index greater than dequeue length.'
        )
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
        await assertTransactionRevertWithReason(
          governance.vote(otherProposalId, index, value),
          'Proposal not dequeued'
        )
      })
    })

    describe('When voting on different proposal with same index', () => {
      const proposalId2 = 2
      const otherAccountWeight = 100
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
        await mockLockedGold.setAccountTotalGovernancePower(account, yesVotes)
        await governance.vote(proposalId, index, value)
        await timeTravel(referendumStageDuration, web3)
        await timeTravel(executionStageDuration, web3)
      })

      it('should ignore votes from previous proposal', async () => {
        const dequeuedProposal1Dequeued = await governance.dequeued(index)
        assertEqualBN(dequeuedProposal1Dequeued, proposalId)

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
        await governance.execute(proposalId, index)
        assert.isFalse(await governance.proposalExists(proposalId))

        await timeTravel(dequeueFrequency + 1, web3)
        await governance.dequeueProposalsIfReady()
        await governance.approve.call(proposalId2, index)
        assert.isTrue(await governance.proposalExists(proposalId2))

        const dequeuedProposal2 = await governance.dequeued(index)
        assertEqualBN(dequeuedProposal2, proposalId2)
        await governance.getVoteTotals(proposalId2)

        const otherAccount1 = accounts[1]
        await accountsInstance.createAccount({ from: otherAccount1 })
        await mockLockedGold.setAccountTotalGovernancePower(otherAccount1, otherAccountWeight)
        await governance.vote(proposalId2, index, value, { from: otherAccount1 })

        await governance.vote(proposalId2, index, VoteValue.No)

        const [yesVotesTotal, noVotesTotal, abstainVotesTotal] = await governance.getVoteTotals(
          proposalId2
        )

        assertEqualBN(yesVotesTotal, otherAccountWeight)
        assertEqualBN(noVotesTotal, yesVotes)
        assertEqualBN(abstainVotesTotal, 0)
      })
    })
  })

  describe('#votePartially()', () => {
    const proposalId = 1
    const index = 0

    describe('when proposal is approved', () => {
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
        await mockLockedGold.setAccountTotalGovernancePower(account, yesVotes)
      })

      it('should return true', async () => {
        const success = await governance.votePartially.call(proposalId, index, yesVotes, 0, 0, {
          gas: 7000000,
          from: account,
        })
        assert.isTrue(success)
      })

      it('should increment the vote totals', async () => {
        await governance.votePartially(proposalId, index, yesVotes, 0, 0)
        const [yes, ,] = await governance.getVoteTotals(proposalId)
        assert.equal(yes.toNumber(), yesVotes)
      })

      it('should increment the vote totals when voting partially', async () => {
        const yes = 10
        const no = 50
        const abstain = 30
        await governance.votePartially(proposalId, index, yes, no, abstain)
        const [yesTotal, noTotal, abstainTotal] = await governance.getVoteTotals(proposalId)
        assert.equal(yesTotal.toNumber(), yes)
        assert.equal(noTotal.toNumber(), no)
        assert.equal(abstainTotal.toNumber(), abstain)
      })

      it("should set the voter's vote record", async () => {
        await governance.votePartially(proposalId, index, yesVotes, 0, 0)
        const [recordProposalId, , , yesVotesRecord] = await governance.getVoteRecord(
          account,
          index
        )
        assertEqualBN(recordProposalId, proposalId)
        assertEqualBN(yesVotesRecord, yesVotes)
      })

      it('should set the most recent referendum proposal voted on', async () => {
        await governance.votePartially(proposalId, index, yesVotes, 0, 0)
        assert.equal(
          (await governance.getMostRecentReferendumProposal(account)).toNumber(),
          proposalId
        )
      })

      it('should emit the ProposalVotedV2 event', async () => {
        const resp = await governance.votePartially(proposalId, index, yesVotes, 0, 0)
        assert.equal(resp.logs.length, 1)
        const log = resp.logs[0]
        assertLogMatches2(log, {
          event: 'ProposalVotedV2',
          args: {
            proposalId: new BigNumber(proposalId),
            account,
            yesVotes,
            noVotes: 0,
            abstainVotes: 0,
          },
        })
      })

      it('should revert when the account weight is 0', async () => {
        await mockLockedGold.setAccountTotalGovernancePower(account, 0)
        await assertTransactionRevertWithReason(
          governance.votePartially(proposalId, index, yesVotes, 0, 0),
          "Voter doesn't have enough locked Celo [(]formerly known as Celo Gold[)]"
        )
      })

      it('should revert when the account does not have enough gold', async () => {
        await assertTransactionRevertWithReason(
          governance.votePartially(proposalId, index, yesVotes + 1, 0, 0),
          "Voter doesn't have enough locked Celo [(]formerly known as Celo Gold[)]"
        )
      })

      it('should revert when the account does not have enough gold when voting partially', async () => {
        const noVotes = yesVotes
        await assertTransactionRevertWithReason(
          governance.votePartially(proposalId, index, yesVotes, noVotes, 0),
          "Voter doesn't have enough locked Celo [(]formerly known as Celo Gold[)]"
        )
      })

      it('should revert when the index is out of bounds', async () => {
        await assertTransactionRevertWithReason(
          governance.votePartially(proposalId, index + 1, yesVotes, 0, 0),
          'Provided index greater than dequeue length.'
        )
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
        await assertTransactionRevertWithReason(
          governance.votePartially(otherProposalId, index, yesVotes, 0, 0),
          'Proposal not dequeued'
        )
      })

      describe('when voting on two proposals', () => {
        const proposalId1 = 2
        const proposalId2 = 3
        const index1 = 1
        const index2 = 2
        beforeEach(async () => {
          const newDequeueFrequency = 60
          await governance.setDequeueFrequency(newDequeueFrequency)
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
          await timeTravel(newDequeueFrequency, web3)
          await governance.approve(proposalId1, index1)
          await governance.propose(
            [transactionSuccess2.value],
            [transactionSuccess2.destination],
            // @ts-ignore bytes type
            transactionSuccess2.data,
            [transactionSuccess2.data.length],
            descriptionUrl,
            // @ts-ignore: TODO(mcortesi) fix typings for TransactionDetails
            { value: minDeposit }
          )
          await timeTravel(newDequeueFrequency, web3)
          await governance.approve(proposalId2, index2)
          await mockLockedGold.setAccountTotalGovernancePower(account, yesVotes)
        })

        it('should set mostRecentReferendumProposal to the youngest proposal voted on', async () => {
          await governance.votePartially(proposalId1, index1, yesVotes, 0, 0)
          await governance.votePartially(proposalId2, index2, yesVotes, 0, 0)
          const mostRecent = await governance.getMostRecentReferendumProposal(accounts[0])
          assert.equal(mostRecent.toNumber(), proposalId2)
        })

        it('should return true on `isVoting`', async () => {
          await governance.votePartially(proposalId2, index2, yesVotes, 0, 0)
          await governance.votePartially(proposalId1, index1, yesVotes, 0, 0)
          const voting = await governance.isVoting(accounts[0])
          assert.isTrue(voting)
        })

        describe('after the first proposal expires', () => {
          beforeEach(async () => {
            await governance.votePartially(proposalId2, index2, yesVotes, 0, 0)
            await governance.votePartially(proposalId1, index1, yesVotes, 0, 0)
            await timeTravel(referendumStageDuration - 10, web3)
          })

          it('should still return true on `isVoting`', async () => {
            const voting = await governance.isVoting(accounts[0])
            assert.isTrue(voting)
          })

          it('should no longer return true on `isVoting` after both expire', async () => {
            await timeTravel(11, web3)
            const voting = await governance.isVoting(accounts[0])
            assert.isFalse(voting)
          })
        })
      })

      describe('when the account has already voted partially on this proposal', () => {
        const revoteTests = (newYes: number, newNo: number, newAbstain) => {
          it('should set vote total correctly', async () => {
            await governance.votePartially(proposalId, index, newYes, newNo, newAbstain)
            const voteTotals = await governance.getVoteTotals(proposalId)

            assertEqualBN(voteTotals[0], newYes)
            assertEqualBN(voteTotals[1], newNo)
            assertEqualBN(voteTotals[2], newAbstain)
          })

          it("should set the voter's vote record", async () => {
            await governance.votePartially(proposalId, index, newYes, newNo, newAbstain)
            const [recordProposalId, , , yesVotesRecord, noVotesRecord, abstainVotesRecord] =
              await governance.getVoteRecord(account, index)
            assert.equal(recordProposalId.toNumber(), proposalId)

            assertEqualBN(yesVotesRecord, newYes)
            assertEqualBN(noVotesRecord, newNo)
            assertEqualBN(abstainVotesRecord, newAbstain)
          })
        }

        describe('when the account has already voted yes and no on this proposal', () => {
          const oldYes = 70
          const oldNo = 30
          const oldAbstain = 0

          beforeEach(async () => {
            await governance.votePartially(proposalId, index, oldYes, oldNo, oldAbstain)
          })

          revoteTests(30, 70, 0)
        })

        describe('when the account has already voted abstain and yes on this proposal', () => {
          const oldYes = 0
          const oldNo = 70
          const oldAbstain = 30

          beforeEach(async () => {
            await governance.votePartially(proposalId, index, oldYes, oldNo, oldAbstain)
          })

          revoteTests(30, 0, 20)
        })
      })

      describe('when the account has already voted on this proposal', () => {
        const voteWeight = yesVotes
        const revoteTests = (newYes, newNo, newAbstain) => {
          it('should decrement the vote total from the previous vote', async () => {
            await governance.votePartially(proposalId, index, newYes, newNo, newAbstain)
            const voteTotals = await governance.getVoteTotals(proposalId)
            assertEqualBN(voteTotals[0], newYes)
            assertEqualBN(voteTotals[1], newNo)
            assertEqualBN(voteTotals[2], newAbstain)
          })

          it('should increment the vote total for the new vote', async () => {
            await governance.votePartially(proposalId, index, newYes, newNo, newAbstain)
            const voteTotals = await governance.getVoteTotals(proposalId)
            assertEqualBN(voteTotals[0], newYes)
            assertEqualBN(voteTotals[1], newNo)
            assertEqualBN(voteTotals[2], newAbstain)
          })

          it("should set the voter's vote record", async () => {
            await governance.votePartially(proposalId, index, newYes, newNo, newAbstain)
            const [recordProposalId, , , yesVotesRecord, noVotesRecord, abstainVotesRecord] =
              await governance.getVoteRecord(account, index)
            assert.equal(recordProposalId.toNumber(), proposalId)
            assertEqualBN(yesVotesRecord, newYes)
            assertEqualBN(noVotesRecord, newNo)
            assertEqualBN(abstainVotesRecord, newAbstain)
          })
        }

        describe('when the account has already voted yes on this proposal', () => {
          beforeEach(async () => {
            await governance.votePartially(proposalId, index, yesVotes, 0, 0)
          })

          revoteTests(0, voteWeight, 0)
        })

        describe('when the account has already voted no on this proposal', () => {
          beforeEach(async () => {
            await governance.votePartially(proposalId, index, voteWeight, 0, 0)
          })

          revoteTests(0, 0, voteWeight)
        })

        describe('when the account has already voted abstain on this proposal', () => {
          beforeEach(async () => {
            await governance.votePartially(proposalId, index, 0, 0, voteWeight)
          })

          revoteTests(voteWeight, 0, 0)
        })
      })

      describe('when the proposal is past the referendum stage and passing', () => {
        beforeEach(async () => {
          await governance.votePartially(proposalId, index, yesVotes, 0, 0)
          await timeTravel(referendumStageDuration, web3)
        })

        it('should revert', async () => {
          await assertRevert(governance.votePartially.call(proposalId, index, yesVotes, 0, 0))
        })
      })

      describe('when the proposal is past the referendum stage and failing', () => {
        beforeEach(async () => {
          await governance.votePartially(proposalId, index, 0, yesVotes, 0)
          await timeTravel(referendumStageDuration, web3)
        })

        it('should return false', async () => {
          const success = await governance.votePartially.call(proposalId, index, yesVotes, 0, 0)
          assert.isFalse(success)
        })

        it('should delete the proposal', async () => {
          await governance.votePartially(proposalId, index, yesVotes, 0, 0)
          assert.isFalse(await governance.proposalExists(proposalId))
        })

        it('should remove the proposal ID from dequeued', async () => {
          await governance.votePartially(proposalId, index, yesVotes, 0, 0)
          const dequeued = await governance.getDequeue()
          assert.notInclude(
            dequeued.map((x) => x.toNumber()),
            proposalId
          )
        })

        it('should add the index to empty indices', async () => {
          await governance.votePartially(proposalId, index, yesVotes, 0, 0)
          const emptyIndex = await governance.emptyIndices(0)
          assert.equal(emptyIndex.toNumber(), index)
        })

        it('should update the participation baseline', async () => {
          await governance.votePartially(proposalId, index, yesVotes, 0, 0)
          const [actualParticipationBaseline, , ,] = await governance.getParticipationParameters()
          assertEqualBN(actualParticipationBaseline, expectedParticipationBaseline)
        })

        it('should emit the ParticipationBaselineUpdated event', async () => {
          const resp = await governance.votePartially(proposalId, index, yesVotes, 0, 0)
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

    describe('when proposal is approved with signer', () => {
      let accountSigner

      beforeEach(async () => {
        ;[accountSigner] = await createAndAssertDelegatorDelegateeSigners(
          accountsInstance,
          accounts,
          account
        )
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
        await mockLockedGold.setAccountTotalGovernancePower(account, yesVotes)
      })

      it('should return true', async () => {
        const success = await governance.votePartially.call(proposalId, index, yesVotes, 0, 0, {
          gas: 7000000,
          from: accountSigner,
        })
        assert.isTrue(success)
      })

      it('should increment the vote totals', async () => {
        await governance.votePartially(proposalId, index, yesVotes, 0, 0, { from: accountSigner })
        const [yes, ,] = await governance.getVoteTotals(proposalId)
        assert.equal(yes.toNumber(), yesVotes)
      })

      it('should increment the vote totals when voting partially', async () => {
        const yes = 10
        const no = 50
        const abstain = 30
        await governance.votePartially(proposalId, index, yes, no, abstain, { from: accountSigner })
        const [yesTotal, noTotal, abstainTotal] = await governance.getVoteTotals(proposalId)
        assert.equal(yesTotal.toNumber(), yes)
        assert.equal(noTotal.toNumber(), no)
        assert.equal(abstainTotal.toNumber(), abstain)
      })

      it("should set the voter's vote record", async () => {
        await governance.votePartially(proposalId, index, yesVotes, 0, 0, { from: accountSigner })
        const [recordProposalId, , , yesVotesRecord] = await governance.getVoteRecord(
          account,
          index
        )
        assertEqualBN(recordProposalId, proposalId)
        assertEqualBN(yesVotesRecord, yesVotes)
      })

      it('should set the most recent referendum proposal voted on', async () => {
        await governance.votePartially(proposalId, index, yesVotes, 0, 0, { from: accountSigner })
        assert.equal(
          (await governance.getMostRecentReferendumProposal(account)).toNumber(),
          proposalId
        )
      })

      it('should emit the ProposalVotedV2 event', async () => {
        const resp = await governance.votePartially(proposalId, index, yesVotes, 0, 0, {
          from: accountSigner,
        })
        assert.equal(resp.logs.length, 1)
        const log = resp.logs[0]
        assertLogMatches2(log, {
          event: 'ProposalVotedV2',
          args: {
            proposalId: new BigNumber(proposalId),
            account,
            yesVotes,
            noVotes: 0,
            abstainVotes: 0,
          },
        })
      })

      it('should revert when the account weight is 0', async () => {
        await mockLockedGold.setAccountTotalGovernancePower(account, 0)
        await assertTransactionRevertWithReason(
          governance.votePartially(proposalId, index, yesVotes, 0, 0, { from: accountSigner }),
          "Voter doesn't have enough locked Celo [(]formerly known as Celo Gold[)]"
        )
      })

      it('should revert when the account does not have enough gold', async () => {
        await assertTransactionRevertWithReason(
          governance.votePartially(proposalId, index, yesVotes + 1, 0, 0, { from: accountSigner }),
          "Voter doesn't have enough locked Celo [(]formerly known as Celo Gold[)]"
        )
      })

      it('should revert when the account does not have enough gold when voting partially', async () => {
        const noVotes = yesVotes
        await assertTransactionRevertWithReason(
          governance.votePartially(proposalId, index, yesVotes, noVotes, 0, {
            from: accountSigner,
          }),
          "Voter doesn't have enough locked Celo [(]formerly known as Celo Gold[)]"
        )
      })

      it('should revert when the index is out of bounds', async () => {
        await assertTransactionRevertWithReason(
          governance.votePartially(proposalId, index + 1, yesVotes, 0, 0, { from: accountSigner }),
          'Provided index greater than dequeue length.'
        )
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
        await assertTransactionRevertWithReason(
          governance.votePartially(otherProposalId, index, yesVotes, 0, 0, { from: accountSigner }),
          'Reason given: Proposal not dequeued.'
        )
      })
    })

    describe('when proposal is not approved', () => {
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
        await mockLockedGold.setAccountTotalGovernancePower(account, yesVotes)
      })

      it('should return true', async () => {
        const success = await governance.votePartially.call(proposalId, index, yesVotes, 0, 0)
        assert.isTrue(success)
      })

      it('should increment the vote totals', async () => {
        await governance.votePartially(proposalId, index, yesVotes, 0, 0)
        const [yes, ,] = await governance.getVoteTotals(proposalId)
        assert.equal(yes.toNumber(), yesVotes)
      })

      it("should set the voter's vote record", async () => {
        await governance.votePartially(proposalId, index, yesVotes, 0, 0)
        const [recordProposalId, , , yesVotesRecord, noVotesRecord, abstainVotesRecord] =
          await governance.getVoteRecord(account, index)
        assertEqualBN(recordProposalId, proposalId)
        assertEqualBN(yesVotesRecord, yesVotes)
        assertEqualBN(noVotesRecord, 0)
        assertEqualBN(abstainVotesRecord, 0)
      })

      it('should set the most recent referendum proposal voted on', async () => {
        await governance.votePartially(proposalId, index, yesVotes, 0, 0)
        assert.equal(
          (await governance.getMostRecentReferendumProposal(account)).toNumber(),
          proposalId
        )
      })

      it('should emit the ProposalVotedV2 event', async () => {
        await governance.dequeueProposalsIfReady()
        const resp = await governance.votePartially(proposalId, index, yesVotes, 0, 0)
        assert.equal(resp.logs.length, resp.logs.length)
        const log = resp.logs[0]
        assertLogMatches2(log, {
          event: 'ProposalVotedV2',
          args: {
            proposalId: new BigNumber(proposalId),
            account,
            yesVotes: new BigNumber(yesVotes),
            noVotes: new BigNumber(0),
            abstainVotes: new BigNumber(0),
          },
        })
      })

      it('should revert when the account weight is 0', async () => {
        await mockLockedGold.setAccountTotalGovernancePower(account, 0)
        await assertTransactionRevertWithReason(
          governance.votePartially(proposalId, index, yesVotes, 0, 0)
        )
      })

      it('should revert when the index is out of bounds', async () => {
        await assertTransactionRevertWithReason(
          governance.votePartially(proposalId, index + 1, yesVotes, 0, 0),
          'Provided index greater than dequeue length.'
        )
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
        await assertTransactionRevertWithReason(
          governance.votePartially(otherProposalId, index, yesVotes, 0, 0),
          'Proposal not dequeued'
        )
      })
    })

    describe('When voting on different proposal with same index', () => {
      const proposalId2 = 2
      const otherAccountWeight = 100
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
        await mockLockedGold.setAccountTotalGovernancePower(account, yesVotes)
        await governance.votePartially(proposalId, index, yesVotes, 0, 0)
        await timeTravel(referendumStageDuration, web3)
        await timeTravel(executionStageDuration, web3)
      })

      it('should ignore votes from previous proposal', async () => {
        const dequeuedProposal1Dequeued = await governance.dequeued(index)
        assertEqualBN(dequeuedProposal1Dequeued, proposalId)

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
        await governance.execute(proposalId, index)
        assert.isFalse(await governance.proposalExists(proposalId))

        await timeTravel(dequeueFrequency + 1, web3)
        await governance.dequeueProposalsIfReady()
        await governance.approve.call(proposalId2, index)
        assert.isTrue(await governance.proposalExists(proposalId2))

        const dequeuedProposal2 = await governance.dequeued(index)
        assertEqualBN(dequeuedProposal2, proposalId2)
        await governance.getVoteTotals(proposalId2)

        const otherAccount1 = accounts[1]
        await accountsInstance.createAccount({ from: otherAccount1 })
        await mockLockedGold.setAccountTotalGovernancePower(otherAccount1, otherAccountWeight)
        await governance.votePartially(proposalId2, index, otherAccountWeight, 0, 0, {
          from: otherAccount1,
        })

        await governance.votePartially(proposalId2, index, 0, yesVotes, 0)

        const [yesVotesRecord, noVotesRecord, abstainVotesRecord] = await governance.getVoteTotals(
          proposalId2
        )

        assertEqualBN(yesVotesRecord, otherAccountWeight)
        assertEqualBN(noVotesRecord, yesVotes)
        assertEqualBN(abstainVotesRecord, 0)
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
          await mockLockedGold.setAccountTotalGovernancePower(account, yesVotes)
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
          await assertTransactionRevertWithReason(
            governance.execute(proposalId, index + 1),
            'Provided index greater than dequeue length.'
          )
        })
      })

      describe('when the proposal can execute successfully - approved in execution stage', () => {
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
          await mockLockedGold.setAccountTotalGovernancePower(account, yesVotes)
          await governance.vote(proposalId, index, value)
          await timeTravel(referendumStageDuration + 1, web3)
          await governance.approve(proposalId, index)
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
          await assertTransactionRevertWithReason(
            governance.execute(proposalId, index + 1),
            'Provided index greater than dequeue length.'
          )
        })
      })

      describe('when the proposal cannot execute successfully because it is not approved', () => {
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
          await mockLockedGold.setAccountTotalGovernancePower(account, yesVotes)
          await governance.vote(proposalId, index, value)
          await timeTravel(referendumStageDuration, web3)
        })

        it('should revert', async () => {
          await assertTransactionRevertWithReason(
            governance.execute(proposalId, index),
            'Proposal not approved'
          )
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
          await mockLockedGold.setAccountTotalGovernancePower(account, yesVotes)
          await governance.vote(proposalId, index, value)
          await timeTravel(referendumStageDuration, web3)
        })

        it('should revert', async () => {
          await assertTransactionRevertWithReason(
            governance.execute(proposalId, index),
            'Proposal execution failed'
          )
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
          await mockLockedGold.setAccountTotalGovernancePower(account, yesVotes)
          await governance.vote(proposalId, index, value)
          await timeTravel(referendumStageDuration, web3)
        })

        it('should revert', async () => {
          await assertTransactionRevertWithReason(
            governance.execute(proposalId, index),
            'Invalid contract address'
          )
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
          await mockLockedGold.setAccountTotalGovernancePower(account, yesVotes)
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
            await mockLockedGold.setAccountTotalGovernancePower(account, yesVotes)
            await governance.vote(proposalId, index, value)
            await timeTravel(referendumStageDuration, web3)
          })

          it('should revert', async () => {
            await assertTransactionRevertWithReason(
              governance.execute(proposalId, index),
              'Proposal execution failed'
            )
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
            await mockLockedGold.setAccountTotalGovernancePower(account, yesVotes)
            await governance.vote(proposalId, index, value)
            await timeTravel(referendumStageDuration, web3)
          })

          it('should revert', async () => {
            await assertTransactionRevertWithReason(
              governance.execute(proposalId, index),
              'Proposal execution failed'
            )
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
        await mockLockedGold.setAccountTotalGovernancePower(account, yesVotes)
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

    describe('when a proposal with 0 transactions is past the execution stage', () => {
      beforeEach(async () => {
        await governance.propose(
          [],
          [],
          // @ts-ignore
          [],
          [],
          descriptionUrl,
          // @ts-ignore: TODO(mcortesi) fix typings for TransactionDetails
          { value: minDeposit }
        )
        await timeTravel(dequeueFrequency, web3)
        await mockLockedGold.setAccountTotalGovernancePower(account, yesVotes)
      })

      it('should not emit ProposalExecuted when not approved', async () => {
        await governance.vote(proposalId, index, value)
        await timeTravel(referendumStageDuration, web3)
        await timeTravel(executionStageDuration, web3)
        const resp = await governance.execute(proposalId, index)
        assert.isTrue(
          resp.logs.every((log) => log.event !== 'ProposalExecuted'),
          'ProposalExecuted should not be emitted'
        )
      })

      it('should not emit ProposalExecuted when not passing', async () => {
        await governance.approve(proposalId, index)
        await timeTravel(referendumStageDuration, web3)
        await timeTravel(executionStageDuration, web3)
        const resp = await governance.execute(proposalId, index)
        assert.isTrue(
          resp.logs.every((log) => log.event !== 'ProposalExecuted'),
          'ProposalExecuted should not be emitted'
        )
      })

      describe('Proposal approved and passing', () => {
        beforeEach(async () => {
          await governance.approve(proposalId, index)
          await governance.vote(proposalId, index, value)
          await timeTravel(referendumStageDuration, web3)
          await timeTravel(executionStageDuration, web3)
        })

        it('should return true', async () => {
          const success = await governance.execute.call(proposalId, index)
          assert.isTrue(success)
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

        it('should emit ProposalExecuted and ParticipationBaselineUpdated event', async () => {
          const resp = await governance.execute(proposalId, index)
          assert.equal(resp.logs.length, 2)
          const log = resp.logs[0]
          assertLogMatches2(log, {
            event: 'ProposalExecuted',
            args: {
              proposalId: new BigNumber(proposalId),
            },
          })
          const log2 = resp.logs[1]
          assertLogMatches2(log2, {
            event: 'ParticipationBaselineUpdated',
            args: {
              participationBaseline: expectedParticipationBaseline,
            },
          })
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
      await assertTransactionRevertWithReason(
        governance.approveHotfix(hotfixHashStr, { from: accounts[2] }),
        'msg.sender not approver'
      )
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
    const newHotfixHash = bufferToHex(toBuffer(keccak256(utf8ToBytes('celo bug fix'))))

    const validators = zip(
      (_account, signer) => ({ account: _account, signer }),
      accounts.slice(2, 5),
      accounts.slice(5, 8)
    )

    beforeEach(async () => {
      for (const validator of validators) {
        await accountsInstance.createAccount({ from: validator.account })
        const sig = await getParsedSignatureOfAddress(web3, validator.account, validator.signer)
        await accountsInstance.authorizeValidatorSigner(validator.signer, sig.v, sig.r, sig.s, {
          from: validator.account,
        })
        // add signers for mock precompile
        await governance.addValidator(validator.signer)
      }
    })

    const whitelistFrom = (t: keyof (typeof validators)[0]) =>
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
      await assertTransactionRevertWithReason(
        governance.prepareHotfix(hotfixHashStr),
        'hotfix not whitelisted by 2f[+]1 validators'
      )
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
        await assertTransactionRevertWithReason(
          governance.prepareHotfix(hotfixHashStr),
          'hotfix already prepared for this epoch'
        )
      })

      it('should succeed for epoch != preparedEpoch', async () => {
        await governance.prepareHotfix(hotfixHashStr)
        await mineToNextEpoch(web3)
        await governance.prepareHotfix(hotfixHashStr)
      })
    })
  })

  describe('#executeHotfix()', () => {
    const executeHotfixTx = () => {
      return governance.executeHotfix(
        [transactionSuccess1.value],
        [transactionSuccess1.destination],
        // @ts-ignore bytes type
        transactionSuccess1.data,
        [transactionSuccess1.data.length],
        salt
      )
    }

    it('should revert when hotfix not approved', async () => {
      await assertTransactionRevertWithReason(executeHotfixTx(), 'hotfix not approved')
    })

    it('should revert when hotfix not prepared for current epoch', async () => {
      await mineToNextEpoch(web3)
      await governance.approveHotfix(hotfixHashStr, { from: approver })
      await assertTransactionRevertWithReason(
        executeHotfixTx(),
        'hotfix must be prepared for this epoch'
      )
    })

    it('should revert when hotfix prepared but not for current epoch', async () => {
      await governance.approveHotfix(hotfixHashStr, { from: approver })
      await governance.addValidator(accounts[2])
      await accountsInstance.createAccount({ from: accounts[2] })
      await governance.whitelistHotfix(hotfixHashStr, { from: accounts[2] })
      await governance.prepareHotfix(hotfixHashStr, { from: accounts[2] })
      await mineToNextEpoch(web3)
      await assertTransactionRevertWithReason(
        executeHotfixTx(),
        'hotfix must be prepared for this epoch'
      )
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
        await assertTransactionRevertWithReason(executeHotfixTx(), 'hotfix already executed')
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
        await mockLockedGold.setAccountTotalLockedGold(account, yesVotes)
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
        await mockLockedGold.setAccountTotalGovernancePower(account, yesVotes)
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
    })

    describe('when the adjusted support is greater than threshold', () => {
      beforeEach(async () => {
        await mockLockedGold.setAccountTotalGovernancePower(account, (yesVotes * 51) / 100)
        await mockLockedGold.setAccountTotalGovernancePower(otherAccount, (yesVotes * 49) / 100)
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
        await mockLockedGold.setAccountTotalGovernancePower(account, (yesVotes * 50) / 100)
        await mockLockedGold.setAccountTotalGovernancePower(otherAccount, (yesVotes * 50) / 100)
        await governance.vote(proposalId, index, VoteValue.Yes)
        await governance.vote(proposalId, index, VoteValue.No, { from: otherAccount })
      })

      it('should return false', async () => {
        const passing = await governance.isProposalPassing(proposalId)
        assert.isFalse(passing)
      })
    })
  })

  describe('#dequeueProposalsIfReady()', () => {
    it('should not update lastDequeue when there are no queued proposals', async () => {
      const originalLastDequeue = await governance.lastDequeue()
      await timeTravel(dequeueFrequency, web3)
      await governance.dequeueProposalsIfReady()

      assert.equal((await governance.getQueueLength()).toNumber(), 0)
      assert.equal((await governance.lastDequeue()).toNumber(), originalLastDequeue.toNumber())
    })

    describe('when a proposal exists', () => {
      beforeEach(async () => {
        await governance.propose(
          [transactionSuccess1.value],
          [transactionSuccess1.destination],
          // @ts-ignore bytes type
          transactionSuccess1.data,
          [transactionSuccess1.data.length],
          descriptionUrl,
          { value: minDeposit }
        )
      })

      it('should update lastDequeue', async () => {
        const originalLastDequeue = await governance.lastDequeue()

        await timeTravel(dequeueFrequency, web3)
        await governance.dequeueProposalsIfReady()

        assert.equal((await governance.getQueueLength()).toNumber(), 0)
        assert.isTrue((await governance.lastDequeue()).toNumber() > originalLastDequeue.toNumber())
      })

      it('should not update lastDequeue when only expired proposal queued', async () => {
        const originalLastDequeue = await governance.lastDequeue()

        await timeTravel(queueExpiry, web3)
        await governance.dequeueProposalsIfReady()

        assert.equal((await governance.getQueueLength()).toNumber(), 0)
        assert.equal((await governance.lastDequeue()).toNumber(), originalLastDequeue.toNumber())
      })
    })
  })

  describe('#getProposalStage()', () => {
    const expectStage = async (expected: Stage, _proposalId: number) => {
      const stage = await governance.getProposalStage(_proposalId)
      assertEqualBN(stage, expected)
    }

    it('should return None stage when proposal does not exist', async () => {
      await expectStage(Stage.None, 0)
      await expectStage(Stage.None, 1)
    })

    describe('when proposal exists', () => {
      let proposalId: number
      beforeEach(async () => {
        await governance.propose(
          [transactionSuccess1.value],
          [transactionSuccess1.destination],
          // @ts-ignore bytes type
          transactionSuccess1.data,
          [transactionSuccess1.data.length],
          descriptionUrl,
          { value: minDeposit }
        )
        proposalId = 1
        const exists = await governance.proposalExists(proposalId)
        assert.isTrue(exists, 'proposal does not exist')
      })

      describe('when proposal is queued', () => {
        beforeEach(async () => {
          const queued = await governance.isQueued(proposalId)
          assert.isTrue(queued, 'proposal not queued')
        })

        it('should return Queued when not expired', () => expectStage(Stage.Queued, proposalId))

        it('should return Expiration when expired', async () => {
          await timeTravel(queueExpiry, web3)
          await expectStage(Stage.Expiration, proposalId)
        })
      })

      describe('when proposal is dequeued', () => {
        const index = 0
        beforeEach(async () => {
          await timeTravel(dequeueFrequency, web3)
          await governance.dequeueProposalsIfReady()
          const dequeued = await governance.isDequeuedProposal(proposalId, index)
          assert.isTrue(dequeued, 'proposal not dequeued')
        })

        describe('when in referendum stage', () => {
          describe('when not approved', () => {
            it('should return Referendum when not voted and not expired', () =>
              expectStage(Stage.Referendum, proposalId))

            it('should return Expiration when expired', async () => {
              await timeTravel(referendumStageDuration, web3)
              await expectStage(Stage.Expiration, proposalId)
            })
          })

          describe('when approved', () => {
            beforeEach(async () => {
              await governance.approve(proposalId, index)
            })

            it('should return Referendum when not expired', () =>
              expectStage(Stage.Referendum, proposalId))

            it('should return Expiration when expired', async () => {
              await timeTravel(referendumStageDuration, web3)
              await expectStage(Stage.Expiration, proposalId)
            })
          })
        })

        describe('when in execution stage', () => {
          beforeEach(async () => {
            await governance.approve(proposalId, index)
            await governance.vote(proposalId, index, VoteValue.Yes)
            const passing = await governance.isProposalPassing(proposalId)
            assert.isTrue(passing, 'proposal not passing')
            await timeTravel(referendumStageDuration, web3)
          })

          it('should return Execution when not expired', () =>
            expectStage(Stage.Execution, proposalId))

          it('should return Expiration when expired', async () => {
            await timeTravel(executionStageDuration, web3)
            await expectStage(Stage.Expiration, proposalId)
            const isDequeuedProposalExpired = await governance.isDequeuedProposalExpired(proposalId)
            assert.isTrue(isDequeuedProposalExpired)
          })
        })
      })
    })

    describe('when a proposal with 0 transactions exists', () => {
      let proposalId: number
      beforeEach(async () => {
        await governance.propose(
          [],
          [],
          // @ts-ignore
          [],
          [],
          descriptionUrl,
          // @ts-ignore: TODO(mcortesi) fix typings for TransactionDetails
          { value: minDeposit }
        )
        proposalId = 1
        const exists = await governance.proposalExists(proposalId)
        assert.isTrue(exists, 'proposal does not exist')
      })

      describe('when proposal with 0 transactions is dequeued', () => {
        const index = 0
        beforeEach(async () => {
          await timeTravel(dequeueFrequency, web3)
          await governance.dequeueProposalsIfReady()
          const dequeued = await governance.isDequeuedProposal(proposalId, index)
          assert.isTrue(dequeued, 'proposal not dequeued')
        })

        it('should return Expiration past the execution stage when not approved', async () => {
          await governance.vote(proposalId, index, VoteValue.Yes)
          await timeTravel(referendumStageDuration + executionStageDuration + 1, web3)
          await expectStage(Stage.Expiration, proposalId)
          const isDequeuedProposalExpired = await governance.isDequeuedProposalExpired(proposalId)
          assert.isTrue(isDequeuedProposalExpired)
        })

        it('should return Expiration past the execution stage when not passing', async () => {
          await governance.approve(proposalId, index)
          await timeTravel(referendumStageDuration + executionStageDuration + 1, web3)
          await expectStage(Stage.Expiration, proposalId)
          const isDequeuedProposalExpired = await governance.isDequeuedProposalExpired(proposalId)
          assert.isTrue(isDequeuedProposalExpired)
        })

        describe('when in execution stage', () => {
          beforeEach(async () => {
            await governance.approve(proposalId, index)
            await governance.vote(proposalId, index, VoteValue.Yes)
            const passing = await governance.isProposalPassing(proposalId)
            assert.isTrue(passing, 'proposal not passing')
            await timeTravel(referendumStageDuration, web3)
          })

          it('should return Execution when not expired', () =>
            expectStage(Stage.Execution, proposalId))

          it('should return Execution past the execution stage if passed and approved', async () => {
            await timeTravel(executionStageDuration + 1, web3)
            await expectStage(Stage.Execution, proposalId)
            const isDequeuedProposalExpired = await governance.isDequeuedProposalExpired(proposalId)
            assert.isFalse(isDequeuedProposalExpired)
          })
        })
      })
    })
  })

  describe('#getAmountOfGoldUsedForVoting()', () => {
    describe('3 concurrent proposals dequeued', () => {
      beforeEach(async () => {
        await governance.setConcurrentProposals(3)
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
        await governance.propose(
          [transactionSuccess2.value],
          [transactionSuccess2.destination],
          // @ts-ignore bytes type
          transactionSuccess2.data,
          [transactionSuccess2.data.length],
          descriptionUrl,
          // @ts-ignore: TODO(mcortesi) fix typings for TransactionDetails
          { value: minDeposit }
        )
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
        await governance.approve(1, 0)
        await governance.approve(2, 1)
        await governance.approve(3, 2)
        await mockLockedGold.setAccountTotalGovernancePower(account, yesVotes)
      })
      for (let numVoted = 0; numVoted < 3; numVoted++) {
        describe(`when account has partially voted on ${numVoted} proposals`, () => {
          const yes = 10
          const no = 30
          const abstain = 0

          beforeEach(async () => {
            for (let i = 0; i < numVoted; i++) {
              await governance.votePartially(1, 0, yes, no, abstain)
            }
          })

          it('Should return correct number of votes', async () => {
            const totalVotesByAccount = await governance.getAmountOfGoldUsedForVoting(accounts[0])
            const expectedArraySum = yes + no + abstain
            assertEqualBN(totalVotesByAccount, numVoted === 0 ? 0 : expectedArraySum)
          })
        })
      }
    })

    describe('proposal dequeued', () => {
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
        await governance.approve(1, 0)
        await mockLockedGold.setAccountTotalGovernancePower(account, yesVotes)
      })

      describe('When account voted on proposal in V8', () => {
        beforeEach(async () => {
          await governance.setDeprecatedWeight(accounts[0], 0, 100)
        })

        it('Should return correct number of votes', async () => {
          const totalVotesByAccount = await governance.getAmountOfGoldUsedForVoting(accounts[0])
          assertEqualBN(totalVotesByAccount, 100)
        })
      })

      describe(`when account has partially voted on proposal`, () => {
        const yes = 10
        const no = 30
        const abstain = 0

        beforeEach(async () => {
          await governance.votePartially(1, 0, yes, no, abstain)
        })

        it('Should return correct number of votes', async () => {
          const totalVotesByAccount = await governance.getAmountOfGoldUsedForVoting(accounts[0])
          const expectedArraySum = yes + no + abstain

          assertEqualBN(totalVotesByAccount, expectedArraySum)
        })

        it('Should return 0 votes since expired', async () => {
          await timeTravel(executionStageDuration + referendumStageDuration + 1, web3)
          const totalVotesByAccount = await governance.getAmountOfGoldUsedForVoting(accounts[0])

          assertEqualBN(totalVotesByAccount, 0)
        })
      })
    })

    describe('proposal in queue', () => {
      beforeEach(async () => {
        const proposalId1 = 1

        await governance.setConcurrentProposals(3)
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
        await mockLockedGold.setAccountTotalLockedGold(account, yesVotes)
        await governance.upvote(proposalId1, 0, 0)
      })

      it('should return full weight when upvoting', async () => {
        const totalVotesByAccount = await governance.getAmountOfGoldUsedForVoting(accounts[0])
        assertEqualBN(totalVotesByAccount, yesVotes)
      })

      it('should return 0 since proposal is already expired', async () => {
        await timeTravel(queueExpiry, web3)
        const totalVotesByAccount = await governance.getAmountOfGoldUsedForVoting(accounts[0])
        assertEqualBN(totalVotesByAccount, 0)
      })
    })
  })

  describe('#removeVotesWhenRevokingDelegatedVotes()', () => {
    it('should revert when not called by staked celo contract', async () => {
      await assertTransactionRevertWithReason(
        governance.removeVotesWhenRevokingDelegatedVotes(NULL_ADDRESS, 0),
        'msg.sender not lockedGold'
      )
    })

    it('should should pass when no proposal is dequeued', async () => {
      await governance.removeVotesWhenRevokingDelegatedVotesTest(NULL_ADDRESS, 0)
    })

    describe('When having three proposals voted', () => {
      const proposalId = 1
      const index = 0

      const proposal2Id = 2
      const index2 = 1

      const proposal3Id = 3
      const index3 = 2
      beforeEach(async () => {
        const newDequeueFrequency = 60
        await governance.setDequeueFrequency(newDequeueFrequency)

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

        await governance.propose(
          [transactionSuccess2.value],
          [transactionSuccess2.destination],
          // @ts-ignore bytes type
          transactionSuccess2.data,
          [transactionSuccess2.data.length],
          descriptionUrl,
          // @ts-ignore: TODO(mcortesi) fix typings for TransactionDetails
          { value: minDeposit }
        )

        await governance.propose(
          [transactionSuccess2.value],
          [transactionSuccess2.destination],
          // @ts-ignore bytes type
          transactionSuccess2.data,
          [transactionSuccess2.data.length],
          descriptionUrl,
          // @ts-ignore: TODO(mcortesi) fix typings for TransactionDetails
          { value: minDeposit }
        )

        await governance.setConcurrentProposals(3)
        await timeTravel(newDequeueFrequency, web3)
        await governance.approve(proposalId, index)
        await timeTravel(newDequeueFrequency, web3)
        await governance.approve(proposal2Id, index2)
        await timeTravel(newDequeueFrequency, web3)
        await governance.approve(proposal3Id, index3)
        await mockLockedGold.setAccountTotalGovernancePower(account, yesVotes)
      })

      describe('When voting only for yes', () => {
        const yes = 100
        const no = 0
        const abstain = 0

        const yes2 = 0
        const no2 = 100
        const abstain2 = 0
        beforeEach(async () => {
          await governance.votePartially(proposalId, index, yes, no, abstain)
          await governance.votePartially(proposal2Id, index2, yes2, no2, abstain2)

          await assertVoteRecord(governance, account, index, proposalId, yes, no, abstain)
          await assertVoteRecord(governance, account, index2, proposal2Id, yes2, no2, abstain2)

          await assertVotesTotal(governance, proposalId, yes, no, abstain)
          await assertVotesTotal(governance, proposal2Id, yes2, no2, abstain2)
        })

        it('should adjust votes correctly to 0', async () => {
          const maxAmount = 0

          await governance.removeVotesWhenRevokingDelegatedVotesTest(account, maxAmount)

          await assertVoteRecord(governance, account, index, proposalId, 0, 0, 0)
          await assertVoteRecord(governance, account, index2, proposal2Id, 0, 0, 0)

          await assertVotesTotal(governance, proposalId, 0, 0, 0)
          await assertVotesTotal(governance, proposal2Id, 0, 0, 0)
        })

        it('should adjust votes correctly to 30', async () => {
          const maxAmount = 30

          await governance.removeVotesWhenRevokingDelegatedVotesTest(account, maxAmount)

          await assertVoteRecord(governance, account, index, proposalId, maxAmount, 0, 0)
          await assertVoteRecord(governance, account, index2, proposal2Id, 0, maxAmount, 0)

          await assertVotesTotal(governance, proposalId, maxAmount, 0, 0)
          await assertVotesTotal(governance, proposal2Id, 0, maxAmount, 0)
        })
      })

      describe('When voting for all choices', () => {
        const yes = 34
        const no = 33
        const abstain = 33

        const yes2 = 0
        const no2 = 35
        const abstain2 = 65

        const yes3 = 0
        const no3 = 0
        const abstain3 = 51

        beforeEach(async () => {
          await governance.votePartially(proposalId, index, yes, no, abstain)
          await governance.votePartially(proposal2Id, index2, yes2, no2, abstain2)
          await governance.votePartially(proposal3Id, index3, yes3, no3, abstain3)

          await assertVoteRecord(governance, account, index, proposalId, yes, no, abstain)
          await assertVoteRecord(governance, account, index2, proposal2Id, yes2, no2, abstain2)
          await assertVoteRecord(governance, account, index3, proposal3Id, yes3, no3, abstain3)
        })

        it('should adjust votes correctly to 0', async () => {
          const maxAmount = 0

          await governance.removeVotesWhenRevokingDelegatedVotesTest(account, maxAmount)

          await assertVoteRecord(governance, account, index, proposalId, 0, 0, 0)
          await assertVoteRecord(governance, account, index2, proposal2Id, 0, 0, 0)
        })

        it('should adjust votes correctly to 50', async () => {
          const maxAmount = 50
          const sumOfVotes = yes + no + abstain
          const toRemove = sumOfVotes - maxAmount
          const yesPortion = (toRemove * yes) / sumOfVotes
          const noPortion = (toRemove * no) / sumOfVotes
          const abstainPortion = (toRemove * abstain) / sumOfVotes

          const no2Portion = (toRemove * no2) / sumOfVotes
          const abstain2Portion = (toRemove * abstain2) / sumOfVotes

          await governance.removeVotesWhenRevokingDelegatedVotesTest(account, maxAmount)

          const [yes1Total, no1Total, abstain1Total] = await governance.getVoteTotals(proposalId)
          const [yes2Total, no2Total, abstain2Total] = await governance.getVoteTotals(proposal2Id)
          const [yes3Total, no3Total, abstain3Total] = await governance.getVoteTotals(proposal3Id)

          assertEqualBN(yes1Total.plus(no1Total).plus(abstain1Total), maxAmount)
          assertEqualBN(yes2Total.plus(no2Total).plus(abstain2Total), maxAmount)
          assertEqualBN(yes3Total.plus(no3Total).plus(abstain3Total), maxAmount)

          assertEqualBN(yes1Total, Math.ceil(yesPortion) - 1) // -1 because of rounding
          assertEqualBN(no1Total, Math.ceil(noPortion))
          assertEqualBN(abstain1Total, Math.ceil(abstainPortion))

          assertEqualBN(yes2Total, 0)
          assertEqualBN(no2Total, Math.ceil(no2Portion) - 1) // -1 because of rounding
          assertEqualBN(abstain2Total, Math.ceil(abstain2Portion))

          await assertVoteRecord(
            governance,
            account,
            index,
            proposalId,
            Math.ceil(yesPortion - 1), // -1 because of rounding
            Math.ceil(noPortion),
            Math.ceil(abstainPortion)
          )
          await assertVoteRecord(
            governance,
            account,
            index2,
            proposal2Id,
            Math.ceil(0),
            Math.ceil(no2Portion - 1), // -1 because of rounding
            Math.ceil(abstain2Portion)
          )
        })

        describe('When proposals are expired', () => {
          beforeEach(async () => {
            await timeTravel(queueExpiry, web3)
          })

          it('should not adjust votes', async () => {
            await assertVoteRecord(governance, account, index, proposalId, yes, no, abstain)
            await assertVoteRecord(governance, account, index2, proposal2Id, yes2, no2, abstain2)
          })
        })
      })
    })
  })
})

async function assertVoteRecord(
  governance: GovernanceTestInstance,
  account: string,
  index: number,
  assertId: number,
  assertYes: number,
  assertNo: number,
  asssertAbstain: number
) {
  const [recordProposalId2, , , yesVotesRecord2, noVotesRecord2, abstainVotesRecord2] =
    await governance.getVoteRecord(account, index)

  assertEqualBN(recordProposalId2, assertId)
  assertEqualBN(yesVotesRecord2, assertYes)
  assertEqualBN(noVotesRecord2, assertNo)
  assertEqualBN(abstainVotesRecord2, asssertAbstain)
}

async function assertVotesTotal(
  governance: GovernanceTestInstance,
  proposalId: number,
  assertYes: number,
  assertNo: number,
  assertAbstain: number
) {
  const [yesVotes, noVotes, abstainVotes] = await governance.getVoteTotals(proposalId)
  assertEqualBN(yesVotes, assertYes)
  assertEqualBN(noVotes, assertNo)
  assertEqualBN(abstainVotes, assertAbstain)
}
