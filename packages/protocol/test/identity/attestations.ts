import { NULL_ADDRESS } from '@celo/base/lib/address'
import { Signature } from '@celo/base/lib/signatureUtils'
import { CeloContractName } from '@celo/protocol/lib/registry-utils'
import {
  assertEqualBN,
  assertLogMatches2,
  assertRevert,
  assertTransactionRevertWithReason,
  getDerivedKey,
  getOdisHash as getPhoneHash,
  KeyOffsets,
  unlockAndAuthorizeKey,
} from '@celo/protocol/lib/test-utils'
import { privateKeyToAddress } from '@celo/utils/lib/address'
import { SignatureUtils } from '@celo/utils/src/signatureUtils'
import BigNumber from 'bignumber.js'
import {
  AccountsContract,
  AccountsInstance,
  AttestationsTestContract,
  AttestationsTestInstance,
  MockElectionContract,
  MockElectionInstance,
  MockERC20TokenContract,
  MockERC20TokenInstance,
  MockLockedGoldContract,
  MockLockedGoldInstance,
  MockRandomContract,
  MockRandomInstance,
  MockValidatorsContract,
  RegistryContract,
  RegistryInstance,
} from 'types'
import Web3 from 'web3'
import { soliditySha3 } from 'web3-utils'

const Accounts: AccountsContract = artifacts.require('Accounts')
/* We use a contract that behaves like the actual Attestations contract, but
 * mocks the implementations of validator set getters. These rely on precompiled
 * contracts, which are not available in our current ganache fork, which we use
 * for Truffle unit tests.
 */
const Attestations: AttestationsTestContract = artifacts.require('AttestationsTest')
const MockERC20Token: MockERC20TokenContract = artifacts.require('MockERC20Token')
const MockElection: MockElectionContract = artifacts.require('MockElection')
const MockLockedGold: MockLockedGoldContract = artifacts.require('MockLockedGold')
const MockValidators: MockValidatorsContract = artifacts.require('MockValidators')
const Random: MockRandomContract = artifacts.require('MockRandom')
const Registry: RegistryContract = artifacts.require('Registry')

contract('Attestations', (accounts: string[]) => {
  let accountsInstance: AccountsInstance
  let attestations: AttestationsTestInstance
  let mockERC20Token: MockERC20TokenInstance
  let otherMockERC20Token: MockERC20TokenInstance
  let random: MockRandomInstance
  let mockElection: MockElectionInstance
  let mockLockedGold: MockLockedGoldInstance
  let registry: RegistryInstance
  const web3: Web3 = new Web3('http://localhost:8545')
  const phoneNumber: string = '+18005551212'
  const caller: string = accounts[0]

  const phoneHash: string = getPhoneHash(phoneNumber)

  const attestationsRequested = 3
  const attestationExpiryBlocks = (60 * 60) / 5
  const selectIssuersWaitBlocks = 4
  const maxAttestations = 20
  const attestationFee = new BigNumber(web3.utils.toWei('.05', 'ether').toString())

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

  beforeEach('Attestations setup', async () => {
    accountsInstance = await Accounts.new(true)
    mockERC20Token = await MockERC20Token.new()
    otherMockERC20Token = await MockERC20Token.new()
    const mockValidators = await MockValidators.new()
    attestations = await Attestations.new()
    random = await Random.new()
    await random.initialize(256)
    await random.addTestRandomness(0, '0x00')
    mockLockedGold = await MockLockedGold.new()
    registry = await Registry.new(true)
    await accountsInstance.initialize(registry.address)
    await registry.setAddressFor(CeloContractName.Validators, mockValidators.address)
    const tokenBalance = web3.utils.toWei('10', 'ether').toString()
    for (const account of accounts) {
      await mockERC20Token.mint(account, tokenBalance)
      await otherMockERC20Token.mint(account, tokenBalance)
      await accountsInstance.createAccount({ from: account })
      await unlockAndAuthorizeKey(
        KeyOffsets.VALIDATING_KEY_OFFSET,
        accountsInstance.authorizeValidatorSigner,
        account,
        accounts
      )
      await unlockAndAuthorizeKey(
        KeyOffsets.ATTESTING_KEY_OFFSET,
        accountsInstance.authorizeAttestationSigner,
        account,
        accounts
      )
    }

    mockElection = await MockElection.new()
    await mockElection.setElectedValidators(
      accounts.map((account) =>
        privateKeyToAddress(getDerivedKey(KeyOffsets.VALIDATING_KEY_OFFSET, account, accounts))
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
      [mockERC20Token.address, otherMockERC20Token.address],
      [attestationFee, attestationFee]
    )

    await attestations.__setValidators(
      accounts.map((account) =>
        privateKeyToAddress(getDerivedKey(KeyOffsets.VALIDATING_KEY_OFFSET, account, accounts))
      )
    )
  })

  describe('#initialize()', () => {
    it('should have set attestationExpiryBlocks', async () => {
      const actualAttestationExpiryBlocks = await attestations.attestationExpiryBlocks()
      assertEqualBN(actualAttestationExpiryBlocks, attestationExpiryBlocks)
    })

    it('should have set the fee', async () => {
      const fee = await attestations.getAttestationRequestFee(mockERC20Token.address)
      assert.equal(fee.toString(), attestationFee.toString())
    })

    it('should not be callable again', async () => {
      await assertTransactionRevertWithReason(
        attestations.initialize(
          registry.address,
          attestationExpiryBlocks,
          selectIssuersWaitBlocks,
          maxAttestations,
          [mockERC20Token.address],
          [attestationFee]
        ),
        'contract already initialized'
      )
    })
  })

  describe('#setAttestationExpirySeconds()', () => {
    const newMaxNumBlocksPerAttestation = attestationExpiryBlocks + 1

    it('should set attestationExpiryBlocks', async () => {
      await attestations.setAttestationExpiryBlocks(newMaxNumBlocksPerAttestation)
      const actualAttestationExpiryBlocks = await attestations.attestationExpiryBlocks()
      assertEqualBN(actualAttestationExpiryBlocks, newMaxNumBlocksPerAttestation)
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
      await assertTransactionRevertWithReason(
        attestations.setAttestationExpiryBlocks(newMaxNumBlocksPerAttestation, {
          from: accounts[1],
        }),
        'Ownable: caller is not the owner'
      )
    })
  })

  describe('#setAttestationRequestFee()', () => {
    const newAttestationFee: BigNumber = attestationFee.plus(1)

    it('should set the fee', async () => {
      await attestations.setAttestationRequestFee(mockERC20Token.address, newAttestationFee)
      const fee = await attestations.getAttestationRequestFee(mockERC20Token.address)
      assert.equal(fee.toString(), newAttestationFee.toString())
    })

    it('should revert when the fee is being set to 0', async () => {
      await assertTransactionRevertWithReason(
        attestations.setAttestationRequestFee(mockERC20Token.address, 0),
        'You have to specify a fee greater than 0'
      )
    })

    it('should not be settable by a non-owner', async () => {
      await assertTransactionRevertWithReason(
        attestations.setAttestationRequestFee(mockERC20Token.address, newAttestationFee, {
          from: accounts[1],
        }),
        'Ownable: caller is not the owner'
      )
    })

    it('should emit the AttestationRequestFeeSet event', async () => {
      const response = await attestations.setAttestationRequestFee(
        mockERC20Token.address,
        newAttestationFee
      )
      assert.lengthOf(response.logs, 1)
      const event = response.logs[0]
      assertLogMatches2(event, {
        event: 'AttestationRequestFeeSet',
        args: {
          token: mockERC20Token.address,
          value: newAttestationFee,
        },
      })
    })
  })

  describe('#setSelectIssuersWaitBlocks()', () => {
    const newSelectIssuersWaitBlocks = selectIssuersWaitBlocks + 1

    it('should set selectIssuersWaitBlocks', async () => {
      await attestations.setSelectIssuersWaitBlocks(newSelectIssuersWaitBlocks)
      const actualAttestationExpiryBlocks = await attestations.selectIssuersWaitBlocks()
      assertEqualBN(actualAttestationExpiryBlocks, newSelectIssuersWaitBlocks)
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
      await assertTransactionRevertWithReason(
        attestations.setSelectIssuersWaitBlocks(newSelectIssuersWaitBlocks, {
          from: accounts[1],
        }),
        'Ownable: caller is not the owner'
      )
    })
  })

  describe('#setMaxAttestations()', () => {
    const newMaxAttestations = maxAttestations + 1

    it('should set maxAttestations', async () => {
      await attestations.setMaxAttestations(newMaxAttestations)
      assertEqualBN(await attestations.maxAttestations(), newMaxAttestations)
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
      await assertTransactionRevertWithReason(
        attestations.setMaxAttestations(newMaxAttestations, {
          from: accounts[1],
        }),
        'Ownable: caller is not the owner'
      )
    })
  })

  function getVerificationCodeSignature(
    _account: string,
    _issuer: string,
    _identifier: string,
    _accounts: string[]
  ): Signature {
    const privateKey = getDerivedKey(KeyOffsets.ATTESTING_KEY_OFFSET, _issuer, _accounts)
    const derivedIssuerAddress = privateKeyToAddress(privateKey)
    const attestationMessageFromIdentifier = soliditySha3(
      { type: 'bytes32', value: _identifier },
      { type: 'address', value: _account }
    )!
    const { v, r, s } = SignatureUtils.signMessage(
      attestationMessageFromIdentifier,
      privateKey,
      derivedIssuerAddress
    )
    return { v, r, s }
  }

  describe('#withdraw()', () => {
    let issuer: string
    beforeEach(async () => {
      await requestAttestations()
      issuer = (await attestations.getAttestationIssuers(phoneHash, caller))[0]
      const { v, r, s } = getVerificationCodeSignature(caller, issuer, phoneHash, accounts)
      await attestations.complete(phoneHash, v, r, s)
      await mockERC20Token.mint(attestations.address, attestationFee)
    })

    it('should remove the balance of available rewards for the issuer from issuer', async () => {
      await attestations.withdraw(mockERC20Token.address, {
        from: issuer,
      })
      const pendingWithdrawals = await attestations.pendingWithdrawals(
        mockERC20Token.address,
        issuer
      )
      assertEqualBN(pendingWithdrawals, 0)
    })

    it('should remove the balance of available rewards for the issuer from attestation signer', async () => {
      const signer = await accountsInstance.getAttestationSigner(issuer)
      // send gas to issuer
      await web3.eth.sendTransaction({
        from: accounts[0],
        to: signer,
        value: web3.utils.toWei('1', 'ether'),
      })
      await attestations.withdraw(mockERC20Token.address, {
        from: signer,
      })
      const pendingWithdrawals = await attestations.pendingWithdrawals(
        mockERC20Token.address,
        issuer
      )
      assertEqualBN(pendingWithdrawals, 0)
    })

    it('should revert from non-attestation signer or issuer account', async () => {
      await unlockAndAuthorizeKey(
        KeyOffsets.VOTING_KEY_OFFSET,
        accountsInstance.authorizeVoteSigner,
        issuer,
        accounts
      )
      const signer = await accountsInstance.getVoteSigner(issuer)
      await assertTransactionRevertWithReason(
        attestations.withdraw(mockERC20Token.address, { from: signer }),
        'not active authorized signer for role'
      )
    })

    it('should emit the Withdrawal event', async () => {
      const response = await attestations.withdraw(mockERC20Token.address, {
        from: issuer,
      })
      assert.lengthOf(response.logs, 1)
      const event = response.logs[0]
      assertLogMatches2(event, {
        event: 'Withdrawal',
        args: {
          account: issuer,
          token: mockERC20Token.address,
          amount: attestationFee,
        },
      })
    })

    it('should not allow someone with no pending withdrawals to withdraw', async () => {
      await assertTransactionRevertWithReason(
        attestations.withdraw(mockERC20Token.address, { from: await getNonIssuer() }),
        'value was negative/zero'
      )
    })
  })

  const requestAttestations = async () => {
    await attestations.request(phoneHash, attestationsRequested, mockERC20Token.address)
    const requestBlockNumber = await web3.eth.getBlockNumber()
    await random.addTestRandomness(requestBlockNumber + selectIssuersWaitBlocks, '0x1')
    await attestations.selectIssuers(phoneHash)
  }
  const requestAndCompleteAttestations = async () => {
    await requestAttestations()
    const issuer = (await attestations.getAttestationIssuers(phoneHash, caller))[0]
    const { v, r, s } = getVerificationCodeSignature(caller, issuer, phoneHash, accounts)
    await attestations.complete(phoneHash, v, r, s)
  }

  describe('#lookupAccountsForIdentifier()', () => {
    describe('when an account has a claim', () => {
      beforeEach(async () => {
        await requestAttestations()
      })

      it("does not return the user's account", async () => {
        const attestedAccounts = await attestations.lookupAccountsForIdentifier(phoneHash)
        assert.isEmpty(attestedAccounts)
      })
    })

    describe('when an account has an attestation', () => {
      beforeEach(async () => {
        await requestAndCompleteAttestations()
      })

      describe('when the account has no walletAddress mapped', () => {
        it('should allow a user to lookup the attested account of a phone number', async () => {
          const attestedAccounts = await attestations.lookupAccountsForIdentifier(phoneHash)
          assert.deepEqual(attestedAccounts, [caller])
        })
      })

      describe('when the account has a walletAddress mapped', () => {
        beforeEach(setAccountWalletAddress)

        it('should allow a user to lookup the attested account of a phone number', async () => {
          const attestedAccounts = await attestations.lookupAccountsForIdentifier(phoneHash)
          assert.deepEqual(attestedAccounts, [caller])
        })
      })
    })

    describe('when an account is not attested', () => {
      it('should return an empty array for the phone number', async () => {
        const attestedAccounts = await attestations.lookupAccountsForIdentifier(phoneHash)
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
        ] = await attestations.batchGetAttestationStats([phoneHash])
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
          ] = await attestations.batchGetAttestationStats([phoneHash])
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
            await attestations.request(phoneHash, attestationsRequested, mockERC20Token.address, {
              from: other,
            })
            const requestBlockNumber = await web3.eth.getBlockNumber()
            await random.addTestRandomness(requestBlockNumber + selectIssuersWaitBlocks, '0x1')
            await attestations.selectIssuers(phoneHash, { from: other })

            const issuer = (await attestations.getAttestationIssuers(phoneHash, other))[0]
            const { v, r, s } = getVerificationCodeSignature(other, issuer, phoneHash, accounts)
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
            ] = await attestations.batchGetAttestationStats([phoneHash])
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
          ] = await attestations.batchGetAttestationStats([phoneHash])
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
        ] = await attestations.batchGetAttestationStats([phoneHash])
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
      const attestedAccounts = await attestations.lookupAccountsForIdentifier(phoneHash)
      assert.isEmpty(attestedAccounts)
      const [matches, addresses, completed, total]: [
        BigNumber[],
        string[],
        BigNumber[],
        BigNumber[]
      ] = await attestations.batchGetAttestationStats([phoneHash])
      assert.lengthOf(matches, 1)
      assert.lengthOf(addresses, 0)
      assert.lengthOf(completed, 0)
      assert.lengthOf(total, 0)
    })
  })

  describe('#requireNAttestationRequests()', () => {
    const requestNError = 'requested attestations does not match expected'

    describe('with none requested', () => {
      it('does not revert when called with 0', async () => {
        await attestations.requireNAttestationsRequested(phoneHash, caller, 0)
      })

      it('does revert when called with something else', async () => {
        await assertRevert(
          attestations.requireNAttestationsRequested(phoneHash, caller, 2),
          requestNError
        )
      })
    })

    describe('with some requested', () => {
      beforeEach(async () => {
        await requestAttestations()
      })

      it('does revert when called with 0', async () => {
        await assertRevert(
          attestations.requireNAttestationsRequested(phoneHash, caller, 0),
          requestNError
        )
      })

      it('does not revert when called with the correct number', async () => {
        await attestations.requireNAttestationsRequested(phoneHash, caller, attestationsRequested)
      })
    })
  })
})
