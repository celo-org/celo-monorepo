import { ContractKit, newKitFromWeb3 } from '@celo/contractkit'
import { getPublicKeysData } from '@celo/utils/lib/bls'
import { fromFixed, toFixed } from '@celo/utils/lib/fixidity'
import BigNumber from 'bignumber.js'
import { assert } from 'chai'
import Web3 from 'web3'
import {
  assertAlmostEqual,
  getContext,
  getEnode,
  importGenesis,
  initAndStartGeth,
  sleep,
} from './utils'

describe('governance tests', () => {
  const gethConfig = {
    migrate: true,
    instances: [
      // Validators 0 and 1 are swapped in and out of the group.
      { name: 'validator0', validating: true, syncmode: 'full', port: 30303, rpcport: 8545 },
      { name: 'validator1', validating: true, syncmode: 'full', port: 30305, rpcport: 8547 },
      // Validator 2 will authorize a validating key every other epoch.
      { name: 'validator2', validating: true, syncmode: 'full', port: 30307, rpcport: 8549 },
      { name: 'validator3', validating: true, syncmode: 'full', port: 30309, rpcport: 8551 },
      { name: 'validator4', validating: true, syncmode: 'full', port: 30311, rpcport: 8553 },
    ],
  }

  const context: any = getContext(gethConfig)
  let web3: any
  let election: any
  let stableToken: any
  let sortedOracles: any
  let epochRewards: any
  let goldToken: any
  let registry: any
  let validators: any
  let accounts: any
  let kit: ContractKit

  before(async function(this: any) {
    this.timeout(0)
    await context.hooks.before()
  })

  after(context.hooks.after)

  const restart = async () => {
    await context.hooks.restart()
    web3 = new Web3('http://localhost:8545')
    kit = newKitFromWeb3(web3)
    goldToken = await kit._web3Contracts.getGoldToken()
    stableToken = await kit._web3Contracts.getStableToken()
    sortedOracles = await kit._web3Contracts.getSortedOracles()
    validators = await kit._web3Contracts.getValidators()
    registry = await kit._web3Contracts.getRegistry()
    election = await kit._web3Contracts.getElection()
    epochRewards = await kit._web3Contracts.getEpochRewards()
    accounts = await kit._web3Contracts.getAccounts()
  }

  const unlockAccount = async (address: string, theWeb3: any) => {
    // Assuming empty password
    await theWeb3.eth.personal.unlockAccount(address, '', 1000)
  }

  const getValidatorGroupMembers = async (blockNumber?: number) => {
    if (blockNumber) {
      const [groupAddress] = await validators.methods
        .getRegisteredValidatorGroups()
        .call({}, blockNumber)
      const groupInfo = await validators.methods
        .getValidatorGroup(groupAddress)
        .call({}, blockNumber)
      return groupInfo[0]
    } else {
      const [groupAddress] = await validators.methods.getRegisteredValidatorGroups().call()
      const groupInfo = await validators.methods.getValidatorGroup(groupAddress).call()
      return groupInfo[0]
    }
  }

  const getValidatorSigner = async (address: string, blockNumber?: number) => {
    if (blockNumber) {
      return await accounts.methods.getValidatorSigner(address).call({}, blockNumber)
    } else {
      return await accounts.methods.getValidatorSigner(address).call()
    }
  }

  const getValidatorGroupPrivateKey = async () => {
    const [groupAddress] = await validators.methods.getRegisteredValidatorGroups().call()
    const name = await accounts.methods.getName(groupAddress).call()
    const encryptedKeystore64 = name.split(' ')[1]
    const encryptedKeystore = JSON.parse(Buffer.from(encryptedKeystore64, 'base64').toString())
    // The validator group ID is the validator group keystore encrypted with validator 0's
    // private key.
    // @ts-ignore
    const encryptionKey = `0x${gethConfig.instances[0].privateKey}`
    const decryptedKeystore = web3.eth.accounts.decrypt(encryptedKeystore, encryptionKey)
    return decryptedKeystore.privateKey
  }

  const activate = async (account: string, txOptions: any = {}) => {
    await unlockAccount(account, web3)
    const [group] = await validators.methods.getRegisteredValidatorGroups().call()
    const tx = election.methods.activate(group)
    let gas = txOptions.gas
    if (!gas) {
      gas = await tx.estimateGas({ ...txOptions })
    }
    return tx.send({ from: account, ...txOptions, gas })
  }

  const removeMember = async (groupWeb3: any, member: string, txOptions: any = {}) => {
    const group = (await groupWeb3.eth.getAccounts())[0]
    await unlockAccount(group, groupWeb3)
    const tx = validators.methods.removeMember(member)
    let gas = txOptions.gas
    if (!gas) {
      gas = await tx.estimateGas({ ...txOptions })
    }
    return tx.send({ from: group, ...txOptions, gas })
  }

  const addMember = async (groupWeb3: any, member: string, txOptions: any = {}) => {
    const group = (await groupWeb3.eth.getAccounts())[0]
    await unlockAccount(group, groupWeb3)
    const tx = validators.methods.addMember(member)
    let gas = txOptions.gas
    if (!gas) {
      gas = await tx.estimateGas({ ...txOptions })
    }
    return tx.send({ from: group, ...txOptions, gas })
  }

  const authorizeValidatorSigner = async (
    validatorWeb3: any,
    signerWeb3: any,
    publicKeysData: string,
    txOptions: any = {}
  ) => {
    const validator = (await validatorWeb3.eth.getAccounts())[0]
    const signer = (await signerWeb3.eth.getAccounts())[0]
    await unlockAccount(validator, validatorWeb3)
    await unlockAccount(signer, signerWeb3)
    const pop = await (await newKitFromWeb3(
      signerWeb3
    ).contracts.getAccounts()).generateProofOfSigningKeyPossession(validator, signer)
    const validatorKit = newKitFromWeb3(validatorWeb3)
    const validatorAccounts = await validatorKit._web3Contracts.getAccounts()
    const tx = validatorAccounts.methods.authorizeValidatorSigner(
      signer,
      publicKeysData,
      pop.v,
      pop.r,
      pop.s
    )
    let gas = txOptions.gas
    if (!gas) {
      gas = await tx.estimateGas({ ...txOptions })
    }
    return tx.send({ from: validator, ...txOptions, gas })
  }

  const isLastBlockOfEpoch = (blockNumber: number, epochSize: number) => {
    return blockNumber % epochSize === 0
  }

  describe('when the validator set is changing', () => {
    let epoch: number
    const blockNumbers: number[] = []
    let validatorAccounts: string[]
    before(async function(this: any) {
      this.timeout(0) // Disable test timeout
      await restart()
      const groupPrivateKey = await getValidatorGroupPrivateKey()
      const rotation0PrivateKey =
        '0xa42ac9c99f6ab2c96ee6cae1b40d36187f65cd878737f6623cd363fb94ba7087'
      const rotation1PrivateKey =
        '0x4519cae145fb9499358be484ca60c80d8f5b7f9c13ff82c88ec9e13283e9de1a'
      const additionalNodes: any[] = [
        {
          name: 'validatorGroup',
          validating: false,
          syncmode: 'full',
          port: 30313,
          wsport: 8555,
          rpcport: 8557,
          privateKey: groupPrivateKey.slice(2),
          peers: [await getEnode(8545)],
        },
      ]
      await Promise.all(
        additionalNodes.map(
          async (nodeConfig) => await initAndStartGeth(context.hooks.gethBinaryPath, nodeConfig)
        )
      )
      // Connect the validating nodes to the non-validating nodes, to test that announce messages
      // are properly gossiped.
      const additionalValidatingNodes = [
        {
          name: 'validator2KeyRotation0',
          validating: true,
          syncmode: 'full',
          lightserv: false,
          port: 30315,
          wsport: 8559,
          privateKey: rotation0PrivateKey.slice(2),
          peers: [await getEnode(8557)],
        },
        {
          name: 'validator2KeyRotation1',
          validating: true,
          syncmode: 'full',
          lightserv: false,
          port: 30317,
          wsport: 8561,
          privateKey: rotation1PrivateKey.slice(2),
          peers: [await getEnode(8557)],
        },
      ]
      await Promise.all(
        additionalValidatingNodes.map(
          async (nodeConfig) => await initAndStartGeth(context.hooks.gethBinaryPath, nodeConfig)
        )
      )

      validatorAccounts = await getValidatorGroupMembers()
      assert.equal(validatorAccounts.length, 5)
      epoch = new BigNumber(await validators.methods.getEpochSize().call()).toNumber()
      assert.equal(epoch, 10)

      // Give the nodes time to sync, and time for an epoch transition so we can activate our vote.
      let blockNumber: number
      do {
        blockNumber = await web3.eth.getBlockNumber()
        await sleep(0.1)
      } while (blockNumber % epoch != 1)

      await activate(validatorAccounts[0])

      // Prepare for member swapping.
      const groupWeb3 = new Web3('ws://localhost:8555')
      const groupKit = newKitFromWeb3(groupWeb3)
      validators = await groupKit._web3Contracts.getValidators()
      const membersToSwap = [validatorAccounts[0], validatorAccounts[1]]
      await removeMember(groupWeb3, membersToSwap[1])

      // Prepare for key rotation.
      const validatorWeb3 = new Web3('http://localhost:8549')
      const authorizedWeb3s = [new Web3('ws://localhost:8559'), new Web3('ws://localhost:8561')]
      const authorizedPublicKeysData = [
        getPublicKeysData(rotation0PrivateKey),
        getPublicKeysData(rotation1PrivateKey),
      ]

      let index = 0
      let errorWhileChangingValidatorSet = ''
      // Can't recycle signing keys.
      let doneAuthorizing = false

      const changeValidatorSet = async (header: any) => {
        try {
          blockNumbers.push(header.number)
          // At the start of epoch N, perform actions so the validator set is different for epoch N + 1.
          if (header.number % epoch === 1) {
            // 1. Swap validator0 and validator1 so one is a member of the group and the other is not.
            const memberToRemove = membersToSwap[index]
            const memberToAdd = membersToSwap[(index + 1) % 2]
            await removeMember(groupWeb3, memberToRemove)
            await addMember(groupWeb3, memberToAdd)
            const newMembers = await getValidatorGroupMembers()
            assert.include(newMembers, memberToAdd)
            assert.notInclude(newMembers, memberToRemove)
            // 2. Rotate keys for validator 2 by authorizing a new validating key.
            if (!doneAuthorizing) {
              await authorizeValidatorSigner(
                validatorWeb3,
                authorizedWeb3s[index],
                authorizedPublicKeysData[index]
              )
            }
            doneAuthorizing = doneAuthorizing || index === 1
            const signingKeys = await Promise.all(
              newMembers.map((v: string) => getValidatorSigner(v))
            )
            // Confirm that authorizing signing keys worked.
            // @ts-ignore Type does not include `notSameMembers`
            assert.notSameMembers(newMembers, signingKeys)
            index = (index + 1) % 2
          }
        } catch (e) {
          console.error(e)
          errorWhileChangingValidatorSet = e
        }
      }

      const subscription = await groupWeb3.eth.subscribe('newBlockHeaders')
      subscription.on('data', changeValidatorSet)
      // Wait for a few epochs while changing the validator set.
      await sleep(epoch * 4)
      ;(subscription as any).unsubscribe()
      // Wait for the current epoch to complete.
      await sleep(epoch)
      assert.equal(errorWhileChangingValidatorSet, '')
    })

    const getValidatorSetSignersAtBlock = async (blockNumber: number) => {
      const validatorSetSize = await election.methods
        .numberValidatorsInCurrentSet()
        .call({}, blockNumber)
      const validatorSet = []
      for (let i = 0; i < validatorSetSize; i++) {
        validatorSet.push(
          await election.methods.validatorAddressFromCurrentSet(i).call({}, blockNumber)
        )
      }
      return validatorSet
    }

    const getValidatorSetAccountsAtBlock = async (blockNumber: number) => {
      const signingKeys = await getValidatorSetSignersAtBlock(blockNumber)
      return await Promise.all(
        signingKeys.map((address: string) =>
          accounts.methods.validatorSignerToAccount(address).call({}, blockNumber)
        )
      )
    }

    const getLastEpochBlock = (blockNumber: number) => {
      const epochNumber = Math.floor((blockNumber - 1) / epoch)
      return epochNumber * epoch
    }

    it('should always return a validator set size equal to the number of group members at the end of the last epoch', async () => {
      for (const blockNumber of blockNumbers) {
        const lastEpochBlock = getLastEpochBlock(blockNumber)
        const validatorSetSize = await election.methods
          .numberValidatorsInCurrentSet()
          .call({}, blockNumber)
        const groupMembership = await getValidatorGroupMembers(lastEpochBlock)
        assert.equal(validatorSetSize, groupMembership.length)
      }
    })

    it('should always return a validator set equal to the signing keys of the group members at the end of the last epoch', async function(this: any) {
      this.timeout(0)
      for (const blockNumber of blockNumbers) {
        const lastEpochBlock = getLastEpochBlock(blockNumber)
        const memberAccounts = await getValidatorGroupMembers(lastEpochBlock)
        const memberSigners = await Promise.all(
          memberAccounts.map((v: string) => getValidatorSigner(v, lastEpochBlock))
        )
        const validatorSetSigners = await getValidatorSetSignersAtBlock(blockNumber)
        const validatorSetAccounts = await getValidatorSetAccountsAtBlock(blockNumber)
        assert.sameMembers(memberSigners, validatorSetSigners)
        assert.sameMembers(memberAccounts, validatorSetAccounts)
      }
    })

    it('should block propose in a round robin fashion', async () => {
      let roundRobinOrder: string[] = []
      for (const blockNumber of blockNumbers) {
        const lastEpochBlock = getLastEpochBlock(blockNumber)
        // Fetch the round robin order if it hasn't already been set for this epoch.
        if (roundRobinOrder.length == 0 || blockNumber == lastEpochBlock + 1) {
          const validatorSet = await getValidatorSetSignersAtBlock(blockNumber)
          roundRobinOrder = await Promise.all(
            validatorSet.map(
              async (_, i) => (await web3.eth.getBlock(lastEpochBlock + i + 1)).miner
            )
          )
          assert.sameMembers(validatorSet, roundRobinOrder)
        }
        const indexInEpoch = blockNumber - lastEpochBlock - 1
        const expectedProposer = roundRobinOrder[indexInEpoch % roundRobinOrder.length]
        const block = await web3.eth.getBlock(blockNumber)
        assert.equal(block.miner.toLowerCase(), expectedProposer.toLowerCase())
      }
    })

    it('should update the validator scores at the end of each epoch', async () => {
      const adjustmentSpeed = fromFixed(
        new BigNumber((await validators.methods.getValidatorScoreParameters().call())[1])
      )
      const uptime = 1

      const assertScoreUnchanged = async (validator: string, blockNumber: number) => {
        const score = new BigNumber(
          (await validators.methods.getValidator(validator).call({}, blockNumber))[3]
        )
        const previousScore = new BigNumber(
          (await validators.methods.getValidator(validator).call({}, blockNumber - 1))[3]
        )
        assert.isNotNaN(score)
        assert.isNotNaN(previousScore)
        assert.equal(score.toFixed(), previousScore.toFixed())
      }

      const assertScoreChanged = async (validator: string, blockNumber: number) => {
        const score = new BigNumber(
          (await validators.methods.getValidator(validator).call({}, blockNumber))[2]
        )
        const previousScore = new BigNumber(
          (await validators.methods.getValidator(validator).call({}, blockNumber - 1))[2]
        )
        const expectedScore = adjustmentSpeed
          .times(uptime)
          .plus(new BigNumber(1).minus(adjustmentSpeed).times(fromFixed(previousScore)))
        assert.isFalse(score.isNaN())
        assert.isFalse(previousScore.isNaN())
        assert.equal(score.toFixed(), toFixed(expectedScore).toFixed())
      }

      for (const blockNumber of blockNumbers) {
        let expectUnchangedScores: string[]
        let expectChangedScores: string[]
        if (isLastBlockOfEpoch(blockNumber, epoch)) {
          expectChangedScores = await getValidatorSetAccountsAtBlock(blockNumber)
          expectUnchangedScores = validatorAccounts.filter((x) => !expectChangedScores.includes(x))
        } else {
          expectUnchangedScores = validatorAccounts
          expectChangedScores = []
        }

        for (const validator of expectUnchangedScores) {
          await assertScoreUnchanged(validator, blockNumber)
        }

        for (const validator of expectChangedScores) {
          await assertScoreChanged(validator, blockNumber)
        }
      }
    })

    it('should distribute epoch payments at the end of each epoch', async () => {
      const commission = 0.1
      const targetValidatorEpochPayment = new BigNumber(
        await epochRewards.methods.targetValidatorEpochPayment().call()
      )
      const [group] = await validators.methods.getRegisteredValidatorGroups().call()

      const assertBalanceChanged = async (
        validator: string,
        blockNumber: number,
        expected: BigNumber
      ) => {
        const currentBalance = new BigNumber(
          await stableToken.methods.balanceOf(validator).call({}, blockNumber)
        )
        const previousBalance = new BigNumber(
          await stableToken.methods.balanceOf(validator).call({}, blockNumber - 1)
        )
        assert.isNotNaN(currentBalance)
        assert.isNotNaN(previousBalance)
        assertAlmostEqual(currentBalance.minus(previousBalance), expected)
      }

      const assertBalanceUnchanged = async (validator: string, blockNumber: number) => {
        await assertBalanceChanged(validator, blockNumber, new BigNumber(0))
      }

      const getExpectedTotalPayment = async (validator: string, blockNumber: number) => {
        const score = new BigNumber(
          (await validators.methods.getValidator(validator).call({}, blockNumber))[2]
        )
        assert.isNotNaN(score)
        // We need to calculate the rewards multiplier for the previous block, before
        // the rewards actually are awarded.
        const rewardsMultiplier = new BigNumber(
          await epochRewards.methods.getRewardsMultiplier().call({}, blockNumber - 1)
        )
        return targetValidatorEpochPayment
          .times(fromFixed(score))
          .times(fromFixed(rewardsMultiplier))
      }

      for (const blockNumber of blockNumbers) {
        let expectUnchangedBalances: string[]
        let expectChangedBalances: string[]
        if (isLastBlockOfEpoch(blockNumber, epoch)) {
          expectChangedBalances = await getValidatorSetAccountsAtBlock(blockNumber)
          expectUnchangedBalances = validatorAccounts.filter(
            (x) => !expectChangedBalances.includes(x)
          )
        } else {
          expectUnchangedBalances = validatorAccounts
          expectChangedBalances = []
        }

        for (const validator of expectUnchangedBalances) {
          await assertBalanceUnchanged(validator, blockNumber)
        }

        let expectedGroupPayment = new BigNumber(0)
        for (const validator of expectChangedBalances) {
          const expectedTotalPayment = await getExpectedTotalPayment(validator, blockNumber)
          const groupPayment = expectedTotalPayment.times(commission)
          await assertBalanceChanged(
            validator,
            blockNumber,
            expectedTotalPayment.minus(groupPayment)
          )
          expectedGroupPayment = expectedGroupPayment.plus(groupPayment)
        }
        await assertBalanceChanged(group, blockNumber, expectedGroupPayment)
      }
    })

    it('should distribute epoch rewards at the end of each epoch', async () => {
      const lockedGold = await kit._web3Contracts.getLockedGold()
      const governance = await kit._web3Contracts.getGovernance()
      const [group] = await validators.methods.getRegisteredValidatorGroups().call()

      const assertVotesChanged = async (blockNumber: number, expected: BigNumber) => {
        const currentVotes = new BigNumber(
          await election.methods.getTotalVotesForGroup(group).call({}, blockNumber)
        )
        const previousVotes = new BigNumber(
          await election.methods.getTotalVotesForGroup(group).call({}, blockNumber - 1)
        )
        assertAlmostEqual(currentVotes.minus(previousVotes), expected)
      }

      const assertGoldTokenTotalSupplyChanged = async (
        blockNumber: number,
        expected: BigNumber
      ) => {
        const currentSupply = new BigNumber(
          await goldToken.methods.totalSupply().call({}, blockNumber)
        )
        const previousSupply = new BigNumber(
          await goldToken.methods.totalSupply().call({}, blockNumber - 1)
        )
        assertAlmostEqual(currentSupply.minus(previousSupply), expected)
      }

      const assertBalanceChanged = async (
        address: string,
        blockNumber: number,
        expected: BigNumber
      ) => {
        const currentBalance = new BigNumber(
          await goldToken.methods.balanceOf(address).call({}, blockNumber)
        )
        const previousBalance = new BigNumber(
          await goldToken.methods.balanceOf(address).call({}, blockNumber - 1)
        )
        assertAlmostEqual(currentBalance.minus(previousBalance), expected)
      }

      const assertLockedGoldBalanceChanged = async (blockNumber: number, expected: BigNumber) => {
        await assertBalanceChanged(lockedGold.options.address, blockNumber, expected)
      }

      const assertGovernanceBalanceChanged = async (blockNumber: number, expected: BigNumber) => {
        await assertBalanceChanged(governance.options.address, blockNumber, expected)
      }

      const assertVotesUnchanged = async (blockNumber: number) => {
        await assertVotesChanged(blockNumber, new BigNumber(0))
      }

      const assertGoldTokenTotalSupplyUnchanged = async (blockNumber: number) => {
        await assertGoldTokenTotalSupplyChanged(blockNumber, new BigNumber(0))
      }

      const assertLockedGoldBalanceUnchanged = async (blockNumber: number) => {
        await assertLockedGoldBalanceChanged(blockNumber, new BigNumber(0))
      }

      const assertGovernanceBalanceUnchanged = async (blockNumber: number) => {
        await assertGovernanceBalanceChanged(blockNumber, new BigNumber(0))
      }

      const getStableTokenSupplyChange = async (blockNumber: number) => {
        const currentSupply = new BigNumber(
          await stableToken.methods.totalSupply().call({}, blockNumber)
        )
        const previousSupply = new BigNumber(
          await stableToken.methods.totalSupply().call({}, blockNumber - 1)
        )
        return currentSupply.minus(previousSupply)
      }

      const getStableTokenExchangeRate = async (blockNumber: number) => {
        const rate = await sortedOracles.methods
          .medianRate(stableToken.options.address)
          .call({}, blockNumber)
        return new BigNumber(rate[0]).div(rate[1])
      }

      for (const blockNumber of blockNumbers) {
        if (isLastBlockOfEpoch(blockNumber, epoch)) {
          // We use the number of active votes from the previous block to calculate the expected
          // epoch reward as the number of active votes for the current block will include the
          // epoch reward.
          const activeVotes = new BigNumber(
            await election.methods.getActiveVotes().call({}, blockNumber - 1)
          )
          const targetVotingYield = new BigNumber(
            (await epochRewards.methods.getTargetVotingYieldParameters().call({}, blockNumber))[0]
          )
          // We need to calculate the rewards multiplier for the previous block, before
          // the rewards actually are awarded.
          const rewardsMultiplier = new BigNumber(
            await epochRewards.methods.getRewardsMultiplier().call({}, blockNumber - 1)
          )
          const expectedEpochReward = activeVotes
            .times(fromFixed(targetVotingYield))
            .times(fromFixed(rewardsMultiplier))
          const expectedInfraReward = new BigNumber(10).pow(18)
          const stableTokenSupplyChange = await getStableTokenSupplyChange(blockNumber)
          const exchangeRate = await getStableTokenExchangeRate(blockNumber)
          const expectedGoldTotalSupplyChange = expectedInfraReward
            .plus(expectedEpochReward)
            .plus(stableTokenSupplyChange.div(exchangeRate))
          await assertVotesChanged(blockNumber, expectedEpochReward)
          await assertLockedGoldBalanceChanged(blockNumber, expectedEpochReward)
          await assertGovernanceBalanceChanged(blockNumber, expectedInfraReward)
          await assertGoldTokenTotalSupplyChanged(blockNumber, expectedGoldTotalSupplyChange)
        } else {
          await assertVotesUnchanged(blockNumber)
          await assertGoldTokenTotalSupplyUnchanged(blockNumber)
          await assertLockedGoldBalanceUnchanged(blockNumber)
          await assertGovernanceBalanceUnchanged(blockNumber)
        }
      }
    })

    it('should update the target voting yield', async () => {
      const assertTargetVotingYieldChanged = async (blockNumber: number, expected: BigNumber) => {
        const currentTarget = new BigNumber(
          (await epochRewards.methods.getTargetVotingYieldParameters().call({}, blockNumber))[0]
        )
        const previousTarget = new BigNumber(
          (await epochRewards.methods.getTargetVotingYieldParameters().call({}, blockNumber - 1))[0]
        )
        const difference = currentTarget.minus(previousTarget)

        // Assert equal to 10 decimal places due to rounding errors.
        assert.equal(
          fromFixed(difference)
            .dp(9)
            .toFixed(),
          fromFixed(expected)
            .dp(9)
            .toFixed()
        )
      }

      const assertTargetVotingYieldUnchanged = async (blockNumber: number) => {
        await assertTargetVotingYieldChanged(blockNumber, new BigNumber(0))
      }

      for (const blockNumber of blockNumbers) {
        if (isLastBlockOfEpoch(blockNumber, epoch)) {
          // We use the voting gold fraction from before the rewards are granted.
          const votingGoldFraction = new BigNumber(
            await epochRewards.methods.getVotingGoldFraction().call({}, blockNumber - 1)
          )
          const targetVotingGoldFraction = new BigNumber(
            await epochRewards.methods.getTargetVotingGoldFraction().call({}, blockNumber)
          )
          const difference = targetVotingGoldFraction.minus(votingGoldFraction)
          const adjustmentFactor = fromFixed(
            new BigNumber(
              (await epochRewards.methods.getTargetVotingYieldParameters().call({}, blockNumber))[2]
            )
          )
          const delta = difference.times(adjustmentFactor)
          await assertTargetVotingYieldChanged(blockNumber, delta)
        } else {
          await assertTargetVotingYieldUnchanged(blockNumber)
        }
      }
    })
  })

  describe('after the gold token smart contract is registered', () => {
    let goldGenesisSupply = new BigNumber(0)
    beforeEach(async function(this: any) {
      this.timeout(0) // Disable test timeout
      await restart()
      const genesis = await importGenesis()
      Object.keys(genesis.alloc).forEach((address) => {
        goldGenesisSupply = goldGenesisSupply.plus(genesis.alloc[address].balance)
      })
    })

    it('should initialize the Celo Gold total supply correctly', async function(this: any) {
      const events = await registry.getPastEvents('RegistryUpdated', { fromBlock: 0 })
      let blockNumber = 0
      for (const e of events) {
        if (e.returnValues.identifier === 'GoldToken') {
          blockNumber = e.blockNumber
          break
        }
      }
      assert.isAtLeast(blockNumber, 1)
      const goldTotalSupply = await goldToken.methods.totalSupply().call({}, blockNumber)
      assert.equal(goldTotalSupply, goldGenesisSupply.toFixed())
    })
  })
})
