import { CeloContractName } from '@celo/protocol/lib/registry-utils'
import {
  assertEqualBN,
  assertLogMatches2,
  assertRevert,
  assertSameAddress,
  mineBlocks,
  NULL_ADDRESS,
} from '@celo/protocol/lib/test-utils'
import { AttestationUtils } from '@celo/utils'
import { privateKeyToAddress } from '@celo/utils/lib/address'
import { parseSolidityStringArray } from '@celo/utils/lib/parsing'
import { getPhoneHash } from '@celo/utils/lib/phoneNumbers'
import BigNumber from 'bignumber.js'
import { range, uniq } from 'lodash'
import {
  AccountsContract,
  AccountsInstance,
  MockElectionContract,
  MockElectionInstance,
  MockLockedGoldContract,
  MockLockedGoldInstance,
  MockRandomContract,
  MockRandomInstance,
  MockStableTokenContract,
  MockStableTokenInstance,
  MockValidatorsContract,
  RegistryContract,
  RegistryInstance,
  TestAttestationsContract,
  TestAttestationsInstance,
} from 'types'
import Web3 from 'web3'
import { getParsedSignatureOfAddress } from '../../lib/signing-utils'
// tslint:disable-next-line: ordered-imports
import Web3X = require('web3')

const Web3Class = (Web3X as any) as typeof Web3

const Accounts: AccountsContract = artifacts.require('Accounts')
/* We use a contract that behaves like the actual Attestations contract, but
 * mocks the implementations of validator set getters. These rely on precompiled
 * contracts, which are not available in our current ganache fork, which we use
 * for Truffle unit tests.
 */
const Attestations: TestAttestationsContract = artifacts.require('TestAttestations')
const MockStableToken: MockStableTokenContract = artifacts.require('MockStableToken')
const MockElection: MockElectionContract = artifacts.require('MockElection')
const MockLockedGold: MockLockedGoldContract = artifacts.require('MockLockedGold')
const MockValidators: MockValidatorsContract = artifacts.require('MockValidators')
const Random: MockRandomContract = artifacts.require('MockRandom')
const Registry: RegistryContract = artifacts.require('Registry')

contract('Attestations', (accounts: string[]) => {
  let accountsInstance: AccountsInstance
  let attestations: TestAttestationsInstance
  let mockStableToken: MockStableTokenInstance
  let otherMockStableToken: MockStableTokenInstance
  let random: MockRandomInstance
  let mockElection: MockElectionInstance
  let mockLockedGold: MockLockedGoldInstance
  let registry: RegistryInstance
  const provider = new Web3Class.providers.HttpProvider('http://localhost:8545')
  const web3: Web3 = new Web3Class(provider)
  const phoneNumber: string = '+18005551212'
  const caller: string = accounts[0]
  // Private keys of each of the 10 miners, in the same order as their addresses in 'accounts'.
  const accountPrivateKeys: string[] = [
    '0xf2f48ee19680706196e2e339e5da3491186e0c4c5030670656b0e0164837257d',
    '0x5d862464fe9303452126c8bc94274b8c5f9874cbd219789b3eb2128075a76f72',
    '0xdf02719c4df8b9b8ac7f551fcb5d9ef48fa27eef7a66453879f4d8fdc6e78fb1',
    '0xff12e391b79415e941a94de3bf3a9aee577aed0731e297d5cfa0b8a1e02fa1d0',
    '0x752dd9cf65e68cfaba7d60225cbdbc1f4729dd5e5507def72815ed0d8abc6249',
    '0xefb595a0178eb79a8df953f87c5148402a224cdf725e88c0146727c6aceadccd',
    '0x83c6d2cc5ddcf9711a6d59b417dc20eb48afd58d45290099e5987e3d768f328f',
    '0xbb2d3f7c9583780a7d3904a2f55d792707c345f21de1bacb2d389934d82796b2',
    '0xb2fd4d29c1390b71b8795ae81196bfd60293adf99f9d32a0aff06288fcdac55f',
    '0x23cb7121166b9a2f93ae0b7c05bde02eae50d64449b2cbb42bc84e9d38d6cc89',
  ]

  const phoneHash: string = getPhoneHash(phoneNumber)

  const attestationsRequested = 3
  const attestationExpiryBlocks = (60 * 60) / 5
  const selectIssuersWaitBlocks = 4
  const maxAttestations = 20
  const attestationFee = new BigNumber(web3.utils.toWei('.05', 'ether').toString())

  async function getVerificationCodeSignature(
    account: string,
    issuer: string
  ): Promise<[number, string, string]> {
    const privateKey = getDerivedKey(KeyOffsets.ATTESTING_KEY_OFFSET, issuer)
    const { v, r, s } = AttestationUtils.attestToIdentifier(phoneHash, account, privateKey)
    return [v, r, s]
  }

  async function setAccountWalletAddress() {
    return accountsInstance.setWalletAddress(caller, '0x0', '0x0', '0x0')
  }

  const getNonIssuer = async () => {
    const issuers = await attestations.getAttestationIssuers(phoneHash, caller)
    let nonIssuerIndex = 0
    while (issuers.indexOf(accounts[nonIssuerIndex]) !== -1) {
      nonIssuerIndex++
    }
    return accounts[nonIssuerIndex]
  }

  enum KeyOffsets {
    VALIDATING_KEY_OFFSET,
    ATTESTING_KEY_OFFSET,
    NEW_VALIDATING_KEY_OFFSET,
  }

  const getDerivedKey = (offset: number, address: string) => {
    const pKey = accountPrivateKeys[accounts.indexOf(address)]
    const aKey = Buffer.from(pKey.slice(2), 'hex')
    aKey.write((aKey[0] + offset).toString(16))
    return '0x' + aKey.toString('hex')
  }

  const unlockAndAuthorizeKey = async (offset: number, authorizeFn: any, account: string) => {
    const key = getDerivedKey(offset, account)
    const addr = privateKeyToAddress(key)
    // @ts-ignore
    await web3.eth.personal.importRawKey(key, 'passphrase')
    await web3.eth.personal.unlockAccount(addr, 'passphrase', 1000000)

    const signature = await getParsedSignatureOfAddress(web3, account, addr)
    return authorizeFn(addr, signature.v, signature.r, signature.s, {
      from: account,
    })
  }

  beforeEach(async () => {
    accountsInstance = await Accounts.new()
    mockStableToken = await MockStableToken.new()
    otherMockStableToken = await MockStableToken.new()
    const mockValidators = await MockValidators.new()
    attestations = await Attestations.new()
    random = await Random.new()
    await random.initialize(256)
    await random.addTestRandomness(0, '0x00')
    mockLockedGold = await MockLockedGold.new()
    registry = await Registry.new()
    await accountsInstance.initialize(registry.address)
    await registry.setAddressFor(CeloContractName.Validators, mockValidators.address)

    await Promise.all(
      accounts.map(async (account) => {
        await accountsInstance.createAccount({ from: account })
        await unlockAndAuthorizeKey(
          KeyOffsets.VALIDATING_KEY_OFFSET,
          accountsInstance.authorizeValidatorSigner,
          account
        )
        await unlockAndAuthorizeKey(
          KeyOffsets.ATTESTING_KEY_OFFSET,
          accountsInstance.authorizeAttestationSigner,
          account
        )
      })
    )

    mockElection = await MockElection.new()
    await mockElection.setElectedValidators(
      accounts.map((account) =>
        privateKeyToAddress(getDerivedKey(KeyOffsets.VALIDATING_KEY_OFFSET, account))
      )
    )
    await registry.setAddressFor(CeloContractName.Accounts, accountsInstance.address)
    await registry.setAddressFor(CeloContractName.Random, random.address)
    await registry.setAddressFor(CeloContractName.Election, mockElection.address)
    await registry.setAddressFor(CeloContractName.LockedGold, mockLockedGold.address)
    await attestations.initialize(
      registry.address,
      attestationExpiryBlocks,
      selectIssuersWaitBlocks,
      maxAttestations,
      [mockStableToken.address, otherMockStableToken.address],
      [attestationFee, attestationFee]
    )

    await attestations.__setValidators(
      accounts.map((account) =>
        privateKeyToAddress(getDerivedKey(KeyOffsets.VALIDATING_KEY_OFFSET, account))
      )
    )
  })

  describe('#initialize()', () => {
    it('should have set attestationExpiryBlocks', async () => {
      const actualAttestationExpiryBlocks: number = await attestations.attestationExpiryBlocks.call(
        this
      )
      assert.equal(actualAttestationExpiryBlocks, attestationExpiryBlocks)
    })

    it('should have set the fee', async () => {
      const fee = await attestations.getAttestationRequestFee.call(mockStableToken.address)
      assert.equal(fee.toString(), attestationFee.toString())
    })

    it('should not be callable again', async () => {
      await assertRevert(
        attestations.initialize(
          registry.address,
          attestationExpiryBlocks,
          selectIssuersWaitBlocks,
          maxAttestations,
          [mockStableToken.address],
          [attestationFee]
        )
      )
    })
  })

  describe('#setAttestationExpirySeconds()', () => {
    const newMaxNumBlocksPerAttestation = attestationExpiryBlocks + 1

    it('should set attestationExpiryBlocks', async () => {
      await attestations.setAttestationExpiryBlocks(newMaxNumBlocksPerAttestation)
      const actualAttestationExpiryBlocks = await attestations.attestationExpiryBlocks.call(this)
      assert.equal(actualAttestationExpiryBlocks, newMaxNumBlocksPerAttestation)
    })

    it('should emit the AttestationExpiryBlocksSet event', async () => {
      const response = await attestations.setAttestationExpiryBlocks(newMaxNumBlocksPerAttestation)
      assert.lengthOf(response.logs, 1)
      const event = response.logs[0]
      assertLogMatches2(event, {
        event: 'AttestationExpiryBlocksSet',
        args: { value: new BigNumber(newMaxNumBlocksPerAttestation) },
      })
    })

    it('should revert when set by a non-owner', async () => {
      await assertRevert(
        attestations.setAttestationExpiryBlocks(newMaxNumBlocksPerAttestation, {
          from: accounts[1],
        })
      )
    })
  })

  describe('#setAttestationRequestFee()', () => {
    const newAttestationFee: BigNumber = attestationFee.plus(1)

    it('should set the fee', async () => {
      await attestations.setAttestationRequestFee(mockStableToken.address, newAttestationFee)
      const fee = await attestations.getAttestationRequestFee.call(mockStableToken.address)
      assert.equal(fee.toString(), newAttestationFee.toString())
    })

    it('should revert when the fee is being set to 0', async () => {
      await assertRevert(attestations.setAttestationRequestFee(mockStableToken.address, 0))
    })

    it('should not be settable by a non-owner', async () => {
      await assertRevert(
        attestations.setAttestationRequestFee(mockStableToken.address, newAttestationFee, {
          from: accounts[1],
        })
      )
    })

    it('should emit the AttestationRequestFeeSet event', async () => {
      const response = await attestations.setAttestationRequestFee(
        mockStableToken.address,
        newAttestationFee
      )
      assert.lengthOf(response.logs, 1)
      const event = response.logs[0]
      assertLogMatches2(event, {
        event: 'AttestationRequestFeeSet',
        args: {
          token: mockStableToken.address,
          value: newAttestationFee,
        },
      })
    })
  })

  describe('#setSelectIssuersWaitBlocks()', () => {
    const newSelectIssuersWaitBlocks = selectIssuersWaitBlocks + 1

    it('should set selectIssuersWaitBlocks', async () => {
      await attestations.setSelectIssuersWaitBlocks(newSelectIssuersWaitBlocks)
      const actualAttestationExpiryBlocks = await attestations.selectIssuersWaitBlocks.call(this)
      assert.equal(actualAttestationExpiryBlocks, newSelectIssuersWaitBlocks)
    })

    it('should emit the SelectIssuersWaitBlocksSet event', async () => {
      const response = await attestations.setSelectIssuersWaitBlocks(newSelectIssuersWaitBlocks)
      assert.lengthOf(response.logs, 1)
      const event = response.logs[0]
      assertLogMatches2(event, {
        event: 'SelectIssuersWaitBlocksSet',
        args: { value: new BigNumber(newSelectIssuersWaitBlocks) },
      })
    })

    it('should revert when set by a non-owner', async () => {
      await assertRevert(
        attestations.setSelectIssuersWaitBlocks(newSelectIssuersWaitBlocks, {
          from: accounts[1],
        })
      )
    })
  })

  describe('#setMaxAttestations()', () => {
    const newMaxAttestations = maxAttestations + 1

    it('should set maxAttestations', async () => {
      await attestations.setMaxAttestations(newMaxAttestations)
      assert.equal(await attestations.maxAttestations.call(this), newMaxAttestations)
    })

    it('should emit the MaxAttestationsSet event', async () => {
      const response = await attestations.setMaxAttestations(newMaxAttestations)
      assert.lengthOf(response.logs, 1)
      const event = response.logs[0]
      assertLogMatches2(event, {
        event: 'MaxAttestationsSet',
        args: { value: new BigNumber(newMaxAttestations) },
      })
    })

    it('should revert when set by a non-owner', async () => {
      await assertRevert(
        attestations.setMaxAttestations(newMaxAttestations, {
          from: accounts[1],
        })
      )
    })
  })

  describe('#request()', () => {
    it('should indicate an unselected attestation request', async () => {
      await attestations.request(phoneHash, attestationsRequested, mockStableToken.address)
      const requestBlock = await web3.eth.getBlock('latest')

      const [
        blockNumber,
        actualAttestationsRequested,
        actualAttestationRequestFeeToken,
      ] = await attestations.getUnselectedRequest(phoneHash, caller)

      assertEqualBN(blockNumber, requestBlock.number)
      assertEqualBN(attestationsRequested, actualAttestationsRequested)
      assertSameAddress(actualAttestationRequestFeeToken, mockStableToken.address)
    })

    it('should increment the number of attestations requested', async () => {
      await attestations.request(phoneHash, attestationsRequested, mockStableToken.address)

      const [completed, total] = await attestations.getAttestationStats(phoneHash, caller)
      assertEqualBN(completed, 0)
      assertEqualBN(total, attestationsRequested)
    })

    it('should revert if 0 attestations are requested', async () => {
      await assertRevert(attestations.request(phoneHash, 0, mockStableToken.address))
    })

    it('should emit the AttestationsRequested event', async () => {
      const response = await attestations.request(
        phoneHash,
        attestationsRequested,
        mockStableToken.address
      )

      assert.lengthOf(response.logs, 1)
      const event = response.logs[0]
      assertLogMatches2(event, {
        event: 'AttestationsRequested',
        args: {
          identifier: phoneHash,
          account: caller,
          attestationsRequested: new BigNumber(attestationsRequested),
          attestationRequestFeeToken: mockStableToken.address,
        },
      })
    })

    describe('when attestations have already been requested', () => {
      beforeEach(async () => {
        await attestations.request(phoneHash, attestationsRequested, mockStableToken.address)
      })

      describe('when the issuers have not yet been selected', () => {
        it('should revert requesting more attestations', async () => {
          await assertRevert(attestations.request(phoneHash, 1, mockStableToken.address))
        })

        describe('when the original request has expired', () => {
          it('should allow to request more attestations', async () => {
            await mineBlocks(attestationExpiryBlocks, web3)
            await attestations.request(phoneHash, 1, mockStableToken.address)
          })
        })

        describe('when the original request cannot be selected for due to randomness not being available', () => {
          it('should allow to request more attestations', async () => {
            const randomnessBlockRetentionWindow = await random.randomnessBlockRetentionWindow()
            await mineBlocks(randomnessBlockRetentionWindow.toNumber(), web3)
            await attestations.request(phoneHash, 1, mockStableToken.address)
          })
        })
      })

      describe('when the issuers have been selected', () => {
        beforeEach(async () => {
          const requestBlockNumber = await web3.eth.getBlockNumber()
          await random.addTestRandomness(requestBlockNumber + selectIssuersWaitBlocks, '0x1')
          await attestations.selectIssuers(phoneHash)
        })

        it('should allow to request more attestations', async () => {
          await attestations.request(phoneHash, 1, mockStableToken.address)
          const [completed, total] = await attestations.getAttestationStats(phoneHash, caller)
          assert.equal(completed.toNumber(), 0)
          assert.equal(total.toNumber(), attestationsRequested + 1)
        })
      })
    })
  })

  describe('#selectIssuers()', () => {
    let expectedRequestBlockNumber: number

    describe('when half the validator set does not authorize an attestation key', () => {
      const accountsThatOptedIn = accounts.slice(0, 5)

      beforeEach(async () => {
        await Promise.all(
          accounts
            .slice(5, 10)
            .map(async (account) => accountsInstance.removeAttestationSigner({ from: account }))
        )
      })

      it('does not select among those when requesting 5', async () => {
        await attestations.request(phoneHash, 5, mockStableToken.address)
        const requestBlockNumber = await web3.eth.getBlockNumber()
        await random.addTestRandomness(requestBlockNumber + selectIssuersWaitBlocks, '0x1')
        await attestations.selectIssuers(phoneHash)

        const attestationIssuers = await attestations.getAttestationIssuers(phoneHash, caller)
        assert.includeMembers(accountsThatOptedIn, attestationIssuers)
      })
    })

    describe('when attestations were requested', () => {
      beforeEach(async () => {
        await attestations.request(phoneHash, attestationsRequested, mockStableToken.address)
        expectedRequestBlockNumber = await web3.eth.getBlockNumber()
      })

      // These tests/functionality implicitly relies on randomness to only be available
      // historically. The attestation contract itself will not test that the current block
      //  number is sufficiently in the future after the request block
      describe('when the randomness of the right block has been set', () => {
        beforeEach(async () => {
          const requestBlockNumber = await web3.eth.getBlockNumber()
          await random.addTestRandomness(requestBlockNumber + selectIssuersWaitBlocks, '0x1')
        })

        it('should add the correct number attestation issuers', async () => {
          assert.isEmpty(await attestations.getAttestationIssuers(phoneHash, caller))
          await attestations.selectIssuers(phoneHash)

          const attestationIssuers = await attestations.getAttestationIssuers(phoneHash, caller)
          assert.lengthOf(attestationIssuers, attestationsRequested)
          assert.lengthOf(uniq(attestationIssuers), attestationsRequested)
        })

        it('should set the block of request in the attestation', async () => {
          await attestations.selectIssuers(phoneHash)
          const attestationIssuers = await attestations.getAttestationIssuers(phoneHash, caller)

          await Promise.all(
            attestationIssuers.map(async (issuer) => {
              const [status, requestBlock] = await attestations.getAttestationState(
                phoneHash,
                caller,
                issuer
              )

              assert.equal(status.toNumber(), 1)
              assert.equal(requestBlock.toNumber(), expectedRequestBlockNumber)
            })
          )
        })

        it('should return the attestations in getCompletableAttestations', async () => {
          await Promise.all(
            accounts.map((account) =>
              accountsInstance.setMetadataURL(`https://test.com/${account}`, { from: account })
            )
          )
          await attestations.selectIssuers(phoneHash)
          const [
            attestationBlockNumbers,
            attestationIssuers,
            stringLengths,
            stringData,
          ] = await attestations.getCompletableAttestations(phoneHash, caller)

          const urls = parseSolidityStringArray(
            stringLengths.map((x) => x.toNumber()),
            (stringData as unknown) as string
          )

          assert.lengthOf(attestationBlockNumbers, attestationsRequested)
          await Promise.all(
            range(0, attestationsRequested).map(async (i) => {
              const [status, requestBlock] = await attestations.getAttestationState(
                phoneHash,
                caller,
                attestationIssuers[i]!
              )
              assert.equal(status.toNumber(), 1)
              assertEqualBN(requestBlock, attestationBlockNumbers[i])
              assert.equal(`https://test.com/${attestationIssuers[i]}`, urls[i])
            })
          )
        })

        it('should delete the unselected request', async () => {
          await attestations.selectIssuers(phoneHash)
          const [
            blockNumber,
            actualAttestationsRequested,
          ] = await attestations.getUnselectedRequest(phoneHash, caller)
          assertEqualBN(blockNumber, 0)
          assertEqualBN(actualAttestationsRequested, 0)
        })

        it('should emit the AttestationIssuerSelected event', async () => {
          const response = await attestations.selectIssuers(phoneHash)
          const issuers = await attestations.getAttestationIssuers(phoneHash, caller)
          assert.lengthOf(response.logs, 3)

          issuers.forEach((issuer, index) => {
            assertLogMatches2(response.logs[index], {
              event: 'AttestationIssuerSelected',
              args: {
                identifier: phoneHash,
                account: caller,
                issuer,
                attestationRequestFeeToken: mockStableToken.address,
              },
            })
          })
        })

        describe('when more attestations were requested', () => {
          beforeEach(async () => {
            await attestations.selectIssuers(phoneHash)
            await attestations.request(phoneHash, 8, mockStableToken.address)
            expectedRequestBlockNumber = await web3.eth.getBlockNumber()
            const requestBlockNumber = await web3.eth.getBlockNumber()
            await random.addTestRandomness(requestBlockNumber + selectIssuersWaitBlocks, '0x1')
          })

          it('should revert if too many issuers attempted', async () => {
            await assertRevert(attestations.selectIssuers(phoneHash))
          })
        })

        describe('after attestationExpiryBlocks', () => {
          beforeEach(async () => {
            await attestations.selectIssuers(phoneHash)
            await mineBlocks(attestationExpiryBlocks, web3)
          })

          it('should no longer list the attestations in getCompletableAttestations', async () => {
            const [attestationBlockNumbers] = await attestations.getCompletableAttestations(
              phoneHash,
              caller
            )

            assert.lengthOf(attestationBlockNumbers, 0)
          })
        })

        describe('when the validation key has been rotated for all validators', () => {
          // Rotate all validation keys
          beforeEach(async () => {
            await Promise.all(
              accounts.map((account) =>
                unlockAndAuthorizeKey(
                  KeyOffsets.NEW_VALIDATING_KEY_OFFSET,
                  accountsInstance.authorizeValidatorSigner,
                  account
                )
              )
            )
          })

          it('can still select issuers', async () => {
            assert.isEmpty(await attestations.getAttestationIssuers(phoneHash, caller))
            await attestations.selectIssuers(phoneHash)

            const attestationIssuers = await attestations.getAttestationIssuers(phoneHash, caller)
            assert.lengthOf(attestationIssuers, attestationsRequested)
          })
        })
      })

      it('should revert when selecting too soon', async () => {
        const requestBlockNumber = await web3.eth.getBlockNumber()
        await random.addTestRandomness(requestBlockNumber + selectIssuersWaitBlocks - 1, '0x1')
        await assertRevert(attestations.selectIssuers(phoneHash))
      })
    })

    describe('without requesting attestations before', () => {
      it('should revert when selecting issuers', async () => {
        await assertRevert(attestations.selectIssuers(phoneHash))
      })
    })
  })

  describe('#complete()', () => {
    let issuer: string
    let v: number
    let r: string, s: string

    beforeEach(async () => {
      await requestAttestations()
      issuer = (await attestations.getAttestationIssuers(phoneHash, caller))[0]
      ;[v, r, s] = await getVerificationCodeSignature(caller, issuer)
    })

    it('should add the account to the list upon completion', async () => {
      let attestedAccounts = await attestations.lookupAccountsForIdentifier(phoneHash)
      assert.isEmpty(attestedAccounts)

      await attestations.complete(phoneHash, v, r, s)
      attestedAccounts = await attestations.lookupAccountsForIdentifier(phoneHash)
      assert.lengthOf(attestedAccounts, 1)
      assert.equal(attestedAccounts[0], caller)
    })

    it('should not add the account twice to the list', async () => {
      await attestations.complete(phoneHash, v, r, s)
      const secondIssuer = (await attestations.getAttestationIssuers(phoneHash, caller))[1]
      ;[v, r, s] = await getVerificationCodeSignature(caller, secondIssuer)

      await attestations.complete(phoneHash, v, r, s)
      const attestedAccounts = await attestations.lookupAccountsForIdentifier(phoneHash)
      assert.lengthOf(attestedAccounts, 1)
      assert.equal(attestedAccounts[0], caller)
    })

    it('should increment the number of completed verification requests', async () => {
      const [numCompleted] = await attestations.getAttestationStats(phoneHash, caller)
      assert.equal(numCompleted.toNumber(), 0)

      await attestations.complete(phoneHash, v, r, s)
      const [numCompleted2, numTotal] = await attestations.getAttestationStats(phoneHash, caller)
      assert.equal(numCompleted2.toNumber(), 1)
      assert.equal(numTotal.toNumber(), attestationsRequested)
    })

    it('should set the time of the successful completion', async () => {
      await mineBlocks(1, web3)
      await attestations.complete(phoneHash, v, r, s)

      const expectedBlock = await web3.eth.getBlock('latest')

      const [
        status,
        completionBlock,
        actualAttestationRequestFeeToken,
      ] = await attestations.getAttestationState(phoneHash, caller, issuer)

      assert.equal(status.toNumber(), 2)
      assert.equal(completionBlock.toNumber(), expectedBlock.number)
      assertSameAddress(actualAttestationRequestFeeToken, NULL_ADDRESS)
    })

    it('should increment pendingWithdrawals for the rewards recipient', async () => {
      await attestations.complete(phoneHash, v, r, s)
      const pendingWithdrawals = await attestations.pendingWithdrawals.call(
        mockStableToken.address,
        issuer
      )
      assert.equal(pendingWithdrawals.toString(), attestationFee.toString())
    })

    it('should no longer list the attestation in getCompletableAttestationStats', async () => {
      await attestations.complete(phoneHash, v, r, s)
      const [attestationIssuers] = await attestations.getCompletableAttestations(phoneHash, caller)
      assert.equal(attestationIssuers.indexOf(new BigNumber(issuer)), -1)
    })

    it('should emit the AttestationCompleted event', async () => {
      const response = await attestations.complete(phoneHash, v, r, s)
      assert.lengthOf(response.logs, 1)
      const event = response.logs[0]
      assertLogMatches2(event, {
        event: 'AttestationCompleted',
        args: {
          identifier: phoneHash,
          account: caller,
          issuer,
        },
      })
    })

    it('should revert when an invalid attestation code is provided', async () => {
      ;[v, r, s] = await getVerificationCodeSignature(accounts[1], issuer)
      await assertRevert(attestations.complete(phoneHash, v, r, s))
    })

    it('should revert with a non-requested issuer', async () => {
      ;[v, r, s] = await getVerificationCodeSignature(caller, await getNonIssuer())
      await assertRevert(attestations.complete(phoneHash, v, r, s))
    })

    it('should revert an already completed request', async () => {
      await attestations.complete(phoneHash, v, r, s)
      await assertRevert(attestations.complete(phoneHash, v, r, s))
    })

    it('does not let you verify beyond the window', async () => {
      await mineBlocks(attestationExpiryBlocks, web3)
      await assertRevert(attestations.complete(phoneHash, v, r, s))
    })
  })

  describe('#withdraw()', () => {
    let issuer: string
    beforeEach(async () => {
      await requestAttestations()
      issuer = (await attestations.getAttestationIssuers(phoneHash, caller))[0]
      const [v, r, s] = await getVerificationCodeSignature(caller, issuer)
      await attestations.complete(phoneHash, v, r, s)
      await mockStableToken.mint(attestations.address, attestationFee)
    })

    it('should remove the balance of available rewards for the issuer', async () => {
      await attestations.withdraw(mockStableToken.address, {
        from: issuer,
      })
      const pendingWithdrawals: number = await attestations.pendingWithdrawals.call(
        mockStableToken.address,
        issuer
      )
      assert.equal(pendingWithdrawals, 0)
    })

    it('should emit the Withdrawal event', async () => {
      const response = await attestations.withdraw(mockStableToken.address, {
        from: issuer,
      })
      assert.lengthOf(response.logs, 1)
      const event = response.logs[0]
      assertLogMatches2(event, {
        event: 'Withdrawal',
        args: {
          account: issuer,
          token: mockStableToken.address,
          amount: attestationFee,
        },
      })
    })

    it('should not allow someone with no pending withdrawals to withdraw', async () => {
      await assertRevert(
        attestations.withdraw(mockStableToken.address, { from: await getNonIssuer() })
      )
    })
  })

  const requestAttestations = async () => {
    await attestations.request(phoneHash, attestationsRequested, mockStableToken.address)
    const requestBlockNumber = await web3.eth.getBlockNumber()
    await random.addTestRandomness(requestBlockNumber + selectIssuersWaitBlocks, '0x1')
    await attestations.selectIssuers(phoneHash)
  }
  const requestAndCompleteAttestations = async () => {
    await requestAttestations()
    const issuer = (await attestations.getAttestationIssuers(phoneHash, caller))[0]
    const [v, r, s] = await getVerificationCodeSignature(caller, issuer)
    await attestations.complete(phoneHash, v, r, s)
  }

  describe('#lookupAccountsForIdentifier()', () => {
    describe('when an account has a claim', () => {
      beforeEach(async () => {
        await requestAttestations()
      })

      it("does not return the user's account", async () => {
        const attestedAccounts = await attestations.lookupAccountsForIdentifier.call(phoneHash)
        assert.isEmpty(attestedAccounts)
      })
    })

    describe('when an account has an attestation', () => {
      beforeEach(async () => {
        await requestAndCompleteAttestations()
      })

      describe('when the account has no walletAddress mapped', () => {
        it('should allow a user to lookup the attested account of a phone number', async () => {
          const attestedAccounts = await attestations.lookupAccountsForIdentifier.call(phoneHash)
          assert.deepEqual(attestedAccounts, [caller])
        })
      })

      describe('when the account has a walletAddress mapped', () => {
        beforeEach(setAccountWalletAddress)

        it('should allow a user to lookup the attested account of a phone number', async () => {
          const attestedAccounts = await attestations.lookupAccountsForIdentifier.call(phoneHash)
          assert.deepEqual(attestedAccounts, [caller])
        })
      })
    })

    describe('when an account is not attested', () => {
      it('should return an empty array for the phone number', async () => {
        const attestedAccounts = await attestations.lookupAccountsForIdentifier.call(phoneHash)
        assert.isEmpty(attestedAccounts)
      })
    })
  })

  describe('#batchGetAttestationStats()', () => {
    describe('when an account has a claim and is mapped with a walletAddress', () => {
      beforeEach(async () => {
        await requestAttestations()
        await setAccountWalletAddress()
      })

      it("does not return the user's account", async () => {
        const [matches, addresses, completed, total]: [
          BigNumber[],
          string[],
          BigNumber[],
          BigNumber[]
        ] = await attestations.batchGetAttestationStats.call([phoneHash])
        assert.lengthOf(matches, 1)
        assert.lengthOf(addresses, 0)
        assert.lengthOf(completed, 0)
        assert.lengthOf(total, 0)
        assert.equal(matches[0].toNumber(), 0)
      })
    })

    describe('when an account has an attestation', () => {
      beforeEach(async () => {
        await requestAndCompleteAttestations()
      })

      describe('when the account has a walletAddress mapped', () => {
        beforeEach(setAccountWalletAddress)

        it('should allow a user to lookup the attested account of a phone number', async () => {
          const [matches, addresses, completed, total]: [
            BigNumber[],
            string[],
            BigNumber[],
            BigNumber[]
          ] = await attestations.batchGetAttestationStats.call([phoneHash])
          assert.lengthOf(matches, 1)
          assert.lengthOf(addresses, 1)
          assert.lengthOf(completed, 1)
          assert.lengthOf(total, 1)

          assert.equal(matches[0].toNumber(), 1)
          assert.equal(addresses[0], caller)
          assert.equal(completed[0].toNumber(), 1)
          assert.equal(total[0].toNumber(), 3)
        })

        describe('and another account also has an attestation to the same phone number', () => {
          let other
          beforeEach(async () => {
            other = accounts[1]
            await attestations.request(phoneHash, attestationsRequested, mockStableToken.address, {
              from: other,
            })
            const requestBlockNumber = await web3.eth.getBlockNumber()
            await random.addTestRandomness(requestBlockNumber + selectIssuersWaitBlocks, '0x1')
            await attestations.selectIssuers(phoneHash, { from: other })

            const issuer = (await attestations.getAttestationIssuers(phoneHash, other))[0]
            const [v, r, s] = await getVerificationCodeSignature(other, issuer)
            await attestations.complete(phoneHash, v, r, s, { from: other })
            await accountsInstance.setWalletAddress(other, '0x0', '0x0', '0x0', { from: other })
          })

          it('should return multiple attested accounts', async () => {
            await attestations.batchGetAttestationStats([phoneHash])

            const [matches, addresses, completed, total]: [
              BigNumber[],
              string[],
              BigNumber[],
              BigNumber[]
            ] = await attestations.batchGetAttestationStats.call([phoneHash])
            assert.lengthOf(matches, 1)
            assert.lengthOf(addresses, 2)
            assert.lengthOf(completed, 2)
            assert.lengthOf(total, 2)

            assert.equal(matches[0].toNumber(), 2)
            assert.equal(addresses[0], caller)
            assert.equal(addresses[1], other)
            assert.equal(completed[0].toNumber(), 1)
            assert.equal(total[0].toNumber(), 3)
            assert.equal(completed[1].toNumber(), 1)
            assert.equal(total[1].toNumber(), 3)
          })
        })
      })

      describe('when the account has no walletAddress mapped', () => {
        it("returns the user's account with a zeroAddress", async () => {
          const [matches, addresses, completed, total]: [
            BigNumber[],
            string[],
            BigNumber[],
            BigNumber[]
          ] = await attestations.batchGetAttestationStats.call([phoneHash])
          assert.lengthOf(matches, 1)
          assert.lengthOf(addresses, 1)
          assert.lengthOf(completed, 1)
          assert.lengthOf(total, 1)

          assert.equal(matches[0].toNumber(), 1)
          assert.equal(addresses[0], NULL_ADDRESS)
          assert.equal(completed[0].toNumber(), 1)
          assert.equal(total[0].toNumber(), 3)
        })
      })
    })

    describe('when an account is not claimed', () => {
      it('returns no results', async () => {
        const [matches, addresses, completed, total]: [
          BigNumber[],
          string[],
          BigNumber[],
          BigNumber[]
        ] = await attestations.batchGetAttestationStats.call([phoneHash])
        assert.lengthOf(matches, 1)
        assert.lengthOf(addresses, 0)
        assert.lengthOf(completed, 0)
        assert.lengthOf(total, 0)
        assert.equal(matches[0].toNumber(), 0)
      })
    })
  })

  describe('#revoke()', () => {
    beforeEach(async () => {
      await requestAndCompleteAttestations()
    })

    it('should allow a user to revoke their account for a phone number', async () => {
      await attestations.revoke(phoneHash, 0)
      const attestedAccounts = await attestations.lookupAccountsForIdentifier.call(phoneHash)
      assert.isEmpty(attestedAccounts)
      const [matches, addresses, completed, total]: [
        BigNumber[],
        string[],
        BigNumber[],
        BigNumber[]
      ] = await attestations.batchGetAttestationStats.call([phoneHash])
      assert.lengthOf(matches, 1)
      assert.lengthOf(addresses, 0)
      assert.lengthOf(completed, 0)
      assert.lengthOf(total, 0)
    })
  })
})
