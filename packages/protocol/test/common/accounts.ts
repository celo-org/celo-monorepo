import { Address, ensureLeading0x, NULL_ADDRESS } from '@celo/base/lib/address'
import { CeloContractName } from '@celo/protocol/lib/registry-utils'
import { getParsedSignatureOfAddress } from '@celo/protocol/lib/signing-utils'
import {
  assertEqualBN,
  assertLogMatches,
  assertLogMatches2,
  assertRevert,
  assertRevertWithReason,
} from '@celo/protocol/lib/test-utils'
import { toFixed } from '@celo/utils/lib/fixidity'
import { parseSolidityStringArray } from '@celo/utils/lib/parsing'
import { authorizeSigner as buildAuthorizeSignerTypedData } from '@celo/utils/lib/typed-data-constructors'
import { generateTypedDataHash } from '@celo/utils/src/sign-typed-data-utils'
import { parseSignatureWithoutPrefix } from '@celo/utils/src/signatureUtils'
import BigNumber from 'bignumber.js'
import {
  AccountsContract,
  AccountsInstance,
  MockValidatorsContract,
  MockValidatorsInstance,
  RegistryContract,
} from 'types'
import { keccak256 } from 'web3-utils'

const Accounts: AccountsContract = artifacts.require('Accounts')
const Registry: RegistryContract = artifacts.require('Registry')
const MockValidators: MockValidatorsContract = artifacts.require('MockValidators')

const assertStorageRoots = (rootsHex: string, lengths: BigNumber[], expectedRoots: string[]) => {
  assert.equal(lengths.length, expectedRoots.length)
  const roots = web3.utils.hexToUtf8(rootsHex)
  let currentIndex = 0
  expectedRoots.forEach((expectedRoot: string, i: number) => {
    const root = roots.slice(currentIndex, currentIndex + lengths[i].toNumber())
    currentIndex += lengths[i].toNumber()
    assert.equal(root, expectedRoot)
  })
  assert.equal(roots.length, currentIndex)
}

contract('Accounts', (accounts: string[]) => {
  let accountsInstance: AccountsInstance
  let mockValidators: MockValidatorsInstance
  const account = accounts[0]
  const caller = accounts[0]

  const name = 'Account'
  const metadataURL = 'https://www.celo.org'
  const otherMetadataURL = 'https://clabs.co'
  const storageRoot = web3.utils.utf8ToHex(metadataURL)
  const otherStorageRoot = web3.utils.utf8ToHex(otherMetadataURL)
  const dataEncryptionKey = '0x02f2f48ee19680706196e2e339e5da3491186e0c4c5030670656b0e01611111111'
  const longDataEncryptionKey =
    '0x04f2f48ee19680706196e2e339e5da3491186e0c4c5030670656b0e01611111111' +
    '02f2f48ee19680706196e2e339e5da3491186e0c4c5030670656b0e01611111111'

  beforeEach(async () => {
    accountsInstance = await Accounts.new(true, { from: account })
    mockValidators = await MockValidators.new()
    const registry = await Registry.new(true)
    await registry.setAddressFor(CeloContractName.Validators, mockValidators.address)
    await registry.setAddressFor(CeloContractName.Accounts, accountsInstance.address)
    await accountsInstance.initialize(registry.address)
    await accountsInstance.setEip712DomainSeparator()
  })

  describe('#createAccount', () => {
    it('creates the account', async () => {
      let isAccount = await accountsInstance.isAccount(account)
      assert.isFalse(isAccount)
      await accountsInstance.createAccount()
      isAccount = await accountsInstance.isAccount(account)
      assert.isTrue(isAccount)
    })

    it('emits an AccountCreated event', async () => {
      const resp = await accountsInstance.createAccount()
      assertLogMatches2(resp.logs[0], {
        event: 'AccountCreated',
        args: { account },
      })
    })
  })

  describe('#setAccountDataEncryptionKey()', () => {
    it('should set dataEncryptionKey', async () => {
      await accountsInstance.setAccountDataEncryptionKey(dataEncryptionKey)
      const fetchedKey: string = await accountsInstance.getDataEncryptionKey(caller)
      assert.equal(fetchedKey, dataEncryptionKey)
    })

    it('should allow setting a key with leading zeros', async () => {
      const keyWithZeros = '0x00000000000000000000000000000000000000000000000f2f48ee19680706191111'
      await accountsInstance.setAccountDataEncryptionKey(keyWithZeros)
      const fetchedKey: string = await accountsInstance.getDataEncryptionKey(caller)
      assert.equal(fetchedKey, keyWithZeros)
    })

    it('should revert when the key is invalid', async () => {
      await assertRevert(accountsInstance.setAccountDataEncryptionKey('0x32132931293'))
    })

    it('should allow a key that is longer than 33 bytes', async () => {
      await accountsInstance.setAccountDataEncryptionKey(longDataEncryptionKey)
      const fetchedKey: string = await accountsInstance.getDataEncryptionKey(caller)
      assert.equal(fetchedKey, longDataEncryptionKey)
    })

    it('should emit the AccountDataEncryptionKeySet event', async () => {
      const response = await accountsInstance.setAccountDataEncryptionKey(dataEncryptionKey)
      assert.lengthOf(response.logs, 1)
      const event = response.logs[0]
      assertLogMatches2(event, {
        event: 'AccountDataEncryptionKeySet',
        args: { account: caller, dataEncryptionKey },
      })
    })
  })

  describe('#setAccount', () => {
    describe('when the account has been created', () => {
      beforeEach(async () => {
        await accountsInstance.createAccount()
      })

      it('should set the name, dataEncryptionKey and walletAddress', async () => {
        await accountsInstance.setAccount(name, dataEncryptionKey, caller, '0x0', '0x0', '0x0')
        const expectedWalletAddress = await accountsInstance.getWalletAddress(caller)
        assert.equal(expectedWalletAddress, caller)
        const expectedKey = await accountsInstance.getDataEncryptionKey(caller)
        assert.equal(expectedKey, dataEncryptionKey)
        const expectedName = await accountsInstance.getName(caller)
        assert.equal(expectedName, name)
      })

      it('emits the AccountNameSet event', async () => {
        const resp = await accountsInstance.setAccount(
          name,
          dataEncryptionKey,
          caller,
          '0x0',
          '0x0',
          '0x0'
        )
        assertLogMatches2(resp.logs[0], {
          event: 'AccountNameSet',
          args: { account: caller, name },
        })
      })

      it('emits the AccountDataEncryptionKeySet event', async () => {
        const resp = await accountsInstance.setAccount(
          name,
          dataEncryptionKey,
          caller,
          '0x0',
          '0x0',
          '0x0'
        )
        assertLogMatches2(resp.logs[1], {
          event: 'AccountDataEncryptionKeySet',
          args: { account: caller, dataEncryptionKey },
        })
      })

      it('emits the AccountWalletAddressSet event', async () => {
        const resp = await accountsInstance.setAccount(
          name,
          dataEncryptionKey,
          caller,
          '0x0',
          '0x0',
          '0x0'
        )
        assertLogMatches2(resp.logs[2], {
          event: 'AccountWalletAddressSet',
          args: { account: caller, walletAddress: caller },
        })
      })
    })

    describe('when the account has not yet been created', () => {
      it('should set the name, dataEncryptionKey and walletAddress', async () => {
        await accountsInstance.setAccount(name, dataEncryptionKey, caller, '0x0', '0x0', '0x0')
        const expectedWalletAddress = await accountsInstance.getWalletAddress(caller)
        assert.equal(expectedWalletAddress, caller)
        const expectedKey = await accountsInstance.getDataEncryptionKey(caller)
        assert.equal(expectedKey, dataEncryptionKey)
        const expectedName = await accountsInstance.getName(caller)
        assert.equal(expectedName, name)
        const isAccount = await accountsInstance.isAccount(caller)
        assert.isTrue(isAccount)
      })

      it('should set a different address with the appropriate signature', async () => {
        const sig = await getParsedSignatureOfAddress(web3, account, accounts[1])
        await accountsInstance.setAccount(name, dataEncryptionKey, accounts[1], sig.v, sig.r, sig.s)
        const result = await accountsInstance.getWalletAddress(caller)
        assert.equal(result, accounts[1])
      })

      it('emits the AccountCreated event', async () => {
        const resp = await accountsInstance.setAccount(
          name,
          dataEncryptionKey,
          caller,
          '0x0',
          '0x0',
          '0x0'
        )
        assertLogMatches2(resp.logs[0], {
          event: 'AccountCreated',
          args: { account: caller },
        })
      })

      it('emits the AccountNameSet event', async () => {
        const resp = await accountsInstance.setAccount(
          name,
          dataEncryptionKey,
          caller,
          '0x0',
          '0x0',
          '0x0'
        )
        assertLogMatches2(resp.logs[1], {
          event: 'AccountNameSet',
          args: { account: caller, name },
        })
      })

      it('emits the AccountDataEncryptionKeySet event', async () => {
        const resp = await accountsInstance.setAccount(
          name,
          dataEncryptionKey,
          caller,
          '0x0',
          '0x0',
          '0x0'
        )
        assertLogMatches2(resp.logs[2], {
          event: 'AccountDataEncryptionKeySet',
          args: { account: caller, dataEncryptionKey },
        })
      })

      it('emits the AccountWalletAddressSet event', async () => {
        const resp = await accountsInstance.setAccount(
          name,
          dataEncryptionKey,
          caller,
          '0x0',
          '0x0',
          '0x0'
        )
        assertLogMatches2(resp.logs[3], {
          event: 'AccountWalletAddressSet',
          args: { account: caller, walletAddress: caller },
        })
      })

      it('should set a revert with the wrong signature for a different address', async () => {
        const sig = await getParsedSignatureOfAddress(web3, account, accounts[1])
        await assertRevert(
          accountsInstance.setAccount(name, dataEncryptionKey, accounts[2], sig.v, sig.r, sig.s)
        )
      })
    })
  })

  describe('#setWalletAddress', () => {
    describe('when the account has not been created', () => {
      it('should revert', async () => {
        await assertRevert(accountsInstance.setWalletAddress(caller, '0x0', '0x0', '0x0'))
      })
    })

    describe('when the account has been created', () => {
      beforeEach(async () => {
        await accountsInstance.createAccount()
      })

      it('should set the walletAddress', async () => {
        await accountsInstance.setWalletAddress(caller, '0x0', '0x0', '0x0')
        const result = await accountsInstance.getWalletAddress(caller)
        assert.equal(result, caller)
      })

      it('should set a different address with the appropriate signature', async () => {
        const sig = await getParsedSignatureOfAddress(web3, account, accounts[1])
        await accountsInstance.setWalletAddress(accounts[1], sig.v, sig.r, sig.s)
        const result = await accountsInstance.getWalletAddress(caller)
        assert.equal(result, accounts[1])
      })

      it('should set the NULL_ADDRESS', async () => {
        await accountsInstance.setWalletAddress(NULL_ADDRESS, '0x0', '0x0', '0x0')
        const result = await accountsInstance.getWalletAddress(caller)
        assert.equal(result, NULL_ADDRESS)
      })

      it('should emit the AccountWalletAddressSet event', async () => {
        const response = await accountsInstance.setWalletAddress(caller, '0x0', '0x0', '0x0')
        assert.lengthOf(response.logs, 1)
        const event = response.logs[0]
        assertLogMatches2(event, {
          event: 'AccountWalletAddressSet',
          args: { account: caller, walletAddress: caller },
        })
      })

      it('should set a revert with the wrong signature for a different address', async () => {
        const sig = await getParsedSignatureOfAddress(web3, account, accounts[1])
        await assertRevert(accountsInstance.setWalletAddress(accounts[2], sig.v, sig.r, sig.s))
      })
    })
  })

  describe('#setMetadataURL', () => {
    describe('when the account has not been created', () => {
      it('should revert', async () => {
        await assertRevert(accountsInstance.setMetadataURL(caller))
      })
    })

    describe('when the account has been created', () => {
      beforeEach(async () => {
        await accountsInstance.createAccount()
      })

      it('should set the metadataURL', async () => {
        await accountsInstance.setMetadataURL(metadataURL)
        const result = await accountsInstance.getMetadataURL(caller)
        assert.equal(result, metadataURL)
      })

      it('should emit the AccountMetadataURLSet event', async () => {
        const response = await accountsInstance.setMetadataURL(metadataURL)
        assert.lengthOf(response.logs, 1)
        const event = response.logs[0]
        assertLogMatches2(event, {
          event: 'AccountMetadataURLSet',
          args: { account: caller, metadataURL },
        })
      })
    })
  })

  describe('#batchGetMetadataURL', () => {
    it('returns multiple metadata URLs', async () => {
      const randomStrings = accounts.map((_) => web3.utils.randomHex(20).slice(2))
      await Promise.all(
        accounts.map(async (mappedAccount, i) => {
          await accountsInstance.createAccount({ from: mappedAccount })
          await accountsInstance.setMetadataURL(randomStrings[i], { from: mappedAccount })
        })
      )
      const [stringLengths, data] = await accountsInstance.batchGetMetadataURL(accounts)
      const strings = parseSolidityStringArray(
        stringLengths.map((x) => x.toNumber()),
        data as unknown as string
      )
      for (let i = 0; i < accounts.length; i++) {
        assert.equal(strings[i], randomStrings[i])
      }
    })
  })

  describe('#addStorageRoot', () => {
    describe('when the account has not been created', () => {
      it('should revert', async () => {
        await assertRevert(accountsInstance.addStorageRoot(storageRoot))
      })
    })

    describe('when the account has been created', () => {
      beforeEach(async () => {
        await accountsInstance.createAccount()
      })

      it('adds a new storage root', async () => {
        await accountsInstance.addStorageRoot(storageRoot)
        const [rootsHex, lengths] = await accountsInstance.getOffchainStorageRoots(accounts[0])
        assertStorageRoots(rootsHex, lengths, [metadataURL])
      })

      it('should emit the OffchainStorageRootAdded event', async () => {
        const response = await accountsInstance.addStorageRoot(storageRoot)
        assert.lengthOf(response.logs, 1)
        const event = response.logs[0]
        assertLogMatches2(event, {
          event: 'OffchainStorageRootAdded',
          args: { account: caller, url: storageRoot },
        })
      })

      it('can add multiple storage roots', async () => {
        await accountsInstance.addStorageRoot(storageRoot)
        await accountsInstance.addStorageRoot(otherStorageRoot)
        const [rootsHex, lengths] = await accountsInstance.getOffchainStorageRoots(accounts[0])
        assertStorageRoots(rootsHex, lengths, [metadataURL, otherMetadataURL])
      })
    })
  })

  describe('#removeStorageRoot', () => {
    describe('when the account has not been created', () => {
      it('should revert', async () => {
        await assertRevert(accountsInstance.removeStorageRoot(0))
      })
    })

    describe('when the account has been created', () => {
      beforeEach(async () => {
        await accountsInstance.createAccount()
      })

      describe('when there are no storage roots', async () => {
        it('should revert with message', async () => {
          await assertRevert(accountsInstance.removeStorageRoot(0), 'Invalid storage root index')
        })
      })

      describe('when there are storage roots', async () => {
        beforeEach(async () => {
          await accountsInstance.addStorageRoot(storageRoot)
          await accountsInstance.addStorageRoot(otherStorageRoot)
        })

        it('should remove one of the storage roots', async () => {
          await accountsInstance.removeStorageRoot(0)
          const [rootsHex, lengths] = await accountsInstance.getOffchainStorageRoots(accounts[0])
          assertStorageRoots(rootsHex, lengths, [otherMetadataURL])
        })

        it('should remove a different storage root', async () => {
          await accountsInstance.removeStorageRoot(1)
          const [rootsHex, lengths] = await accountsInstance.getOffchainStorageRoots(accounts[0])
          assertStorageRoots(rootsHex, lengths, [metadataURL])
        })

        it('should emit the OffchainStorageRootRemoved event', async () => {
          const response = await accountsInstance.removeStorageRoot(0)
          assert.lengthOf(response.logs, 1)
          const event = response.logs[0]
          assertLogMatches2(event, {
            event: 'OffchainStorageRootRemoved',
            args: { account: caller, url: storageRoot, index: 0 },
          })
        })
      })
    })
  })

  describe('#setPaymentDelegation', () => {
    const beneficiary = accounts[1]
    const fraction = toFixed(0.2)
    const badFraction = toFixed(1.2)

    it('should not be callable by a non-account', async () => {
      await assertRevertWithReason(
        accountsInstance.setPaymentDelegation(beneficiary, fraction),
        'Not an account'
      )
    })

    describe('when an account has been created', () => {
      beforeEach(async () => {
        await accountsInstance.createAccount()
      })

      it('should set an address and a fraction', async () => {
        await accountsInstance.setPaymentDelegation(beneficiary, fraction)
        const [realBeneficiary, realFraction] = await accountsInstance.getPaymentDelegation.call(
          accounts[0]
        )
        assert.equal(realBeneficiary, beneficiary)
        assertEqualBN(realFraction, fraction)
      })

      it('should not allow a fraction greater than 1', async () => {
        await assertRevertWithReason(
          accountsInstance.setPaymentDelegation(beneficiary, badFraction),
          'Fraction must not be greater than 1'
        )
      })

      it('should not allow a beneficiary with address 0x0', async () => {
        await assertRevertWithReason(
          accountsInstance.setPaymentDelegation(NULL_ADDRESS, fraction),
          'Beneficiary cannot be address 0x0'
        )
      })

      it('emits a PaymentDelegationSet event', async () => {
        const resp = await accountsInstance.setPaymentDelegation(beneficiary, fraction)
        assertLogMatches2(resp.logs[0], {
          event: 'PaymentDelegationSet',
          args: { beneficiary, fraction },
        })
      })
    })
  })

  describe('#deletePaymentDelegation', () => {
    const beneficiary = accounts[1]
    const fraction = toFixed(0.2)

    beforeEach(async () => {
      await accountsInstance.createAccount()
      await accountsInstance.setPaymentDelegation(beneficiary, fraction)
    })

    it('should not be callable by a non-account', async () => {
      await assertRevertWithReason(
        accountsInstance.setPaymentDelegation(beneficiary, fraction, { from: accounts[2] }),
        'Not an account'
      )
    })

    it('should set the address and beneficiary to 0', async () => {
      await accountsInstance.deletePaymentDelegation()
      const [realBeneficiary, realFraction] = await accountsInstance.getPaymentDelegation.call(
        accounts[0]
      )
      assert.equal(realBeneficiary, NULL_ADDRESS)
      assertEqualBN(realFraction, new BigNumber(0))
    })

    it('emits a PaymentDelegationSet event', async () => {
      const resp = await accountsInstance.deletePaymentDelegation()
      assertLogMatches2(resp.logs[0], {
        event: 'PaymentDelegationSet',
        args: { beneficiary: NULL_ADDRESS, fraction: new BigNumber(0) },
      })
    })
  })

  describe('#setName', () => {
    describe('when the account has not been created', () => {
      it('should revert', async () => {
        await assertRevert(accountsInstance.setWalletAddress(caller, '0x0', '0x0', '0x0'))
      })
    })

    describe('when the account has been created', () => {
      beforeEach(async () => {
        await accountsInstance.createAccount()
      })

      it('should set the name', async () => {
        await accountsInstance.setName(name)
        const result = await accountsInstance.getName(caller)
        assert.equal(result, name)
      })

      it('should emit the AccountNameSet event', async () => {
        const response = await accountsInstance.setName(name)
        assert.lengthOf(response.logs, 1)
        const event = response.logs[0]
        assertLogMatches2(event, {
          event: 'AccountNameSet',
          args: { account: caller, name },
        })
      })
    })
  })

  const getSignatureForAuthorization = async (
    _account: Address,
    signer: Address,
    role: string,
    accountsContractAddress: string
  ) => {
    const typedData = buildAuthorizeSignerTypedData({
      account: _account,
      signer,
      accountsContractAddress,
      role,
      chainId: 1,
    })

    const signature = await new Promise<string>((resolve, reject) => {
      web3.currentProvider.send(
        {
          method: 'eth_signTypedData',
          params: [signer, typedData],
        },
        (error, resp) => {
          if (error) {
            reject(error)
          } else {
            resolve(resp.result)
          }
        }
      )
    })

    const messageHash = ensureLeading0x(generateTypedDataHash(typedData).toString('hex'))
    const parsedSignature = parseSignatureWithoutPrefix(messageHash, signature, signer)
    return parsedSignature
  }

  describe('generic authorization', () => {
    const account2 = accounts[1]
    const signer = accounts[2]
    const signer2 = accounts[3]
    const role = keccak256('Test Role')
    const role2 = keccak256('Test Role 2')
    let sig

    beforeEach(async () => {
      sig = await getSignatureForAuthorization(account, signer, role, accountsInstance.address)
      await accountsInstance.createAccount()
      await accountsInstance.createAccount({ from: account2 })
    })

    it('should recover the correct signer from EIP712 signature', async () => {
      const recoveredSigner = await accountsInstance.getRoleAuthorizationSigner(
        account,
        signer,
        role,
        sig.v,
        sig.r,
        sig.s
      )
      expect(signer).to.be.equal(recoveredSigner)
    })

    describe('smart contract signers', async () => {
      it("can't complete an authorization that hasn't been started", async () => {
        await assertRevert(
          accountsInstance.completeSignerAuthorization(account, role, { from: signer }),
          'Signer authorization not started'
        )
      })

      it('starting the authorization does not complete it', async () => {
        await accountsInstance.authorizeSigner(signer, role)
        assert.isFalse(await accountsInstance.isSigner(account, signer, role))
      })

      it('should set the authorized signer in two steps', async () => {
        await accountsInstance.authorizeSigner(signer, role)
        await accountsInstance.completeSignerAuthorization(account, role, { from: signer })

        assert.isTrue(await accountsInstance.isSigner(account, signer, role))
        assert.equal(await accountsInstance.authorizedBy(signer), account)
        assert.isTrue(await accountsInstance.isAuthorizedSigner(signer))
      })

      it(`should emit the right event`, async () => {
        const { logs: startLogs } = await accountsInstance.authorizeSigner(signer, role)
        const { logs: completeLogs } = await accountsInstance.completeSignerAuthorization(
          account,
          role,
          {
            from: signer,
          }
        )

        assert.equal(startLogs.length, 1)
        assertLogMatches(startLogs[0], 'SignerAuthorizationStarted', { account, signer, role })

        assert.equal(completeLogs.length, 1)
        assertLogMatches(completeLogs[0], 'SignerAuthorizationCompleted', { account, signer, role })
      })
    })

    describe('EOA signers', async () => {
      it('should set the authorized signer in one step with signature', async () => {
        assert.isFalse(await accountsInstance.isSigner(account, signer, role))
        await accountsInstance.authorizeSignerWithSignature(signer, role, sig.v, sig.r, sig.s)

        assert.isTrue(await accountsInstance.isSigner(account, signer, role))
        assert.equal(await accountsInstance.authorizedBy(signer), account)
        assert.isTrue(await accountsInstance.isAuthorizedSigner(signer))
      })

      it(`should emit the right event`, async () => {
        const resp = await accountsInstance.authorizeSignerWithSignature(
          signer,
          role,
          sig.v,
          sig.r,
          sig.s
        )
        assert.equal(resp.logs.length, 1)
        const log = resp.logs[0]
        const expected = { account, signer, role }
        assertLogMatches(log, 'SignerAuthorized', expected)
      })
    })

    it('should remove the authorized signer', async () => {
      await accountsInstance.authorizeSignerWithSignature(signer, role, sig.v, sig.r, sig.s)
      await accountsInstance.removeSigner(signer, role)
      assert.isFalse(await accountsInstance.isSigner(account, signer, role))
    })

    it('can authorize multiple signers for a role', async () => {
      assert.isFalse(await accountsInstance.isSigner(account, signer, role))
      assert.isFalse(await accountsInstance.isSigner(account, signer2, role))

      const sigTwo = await getSignatureForAuthorization(
        account,
        signer2,
        role,
        accountsInstance.address
      )

      await accountsInstance.authorizeSignerWithSignature(signer, role, sig.v, sig.r, sig.s)
      await accountsInstance.authorizeSignerWithSignature(
        signer2,
        role,
        sigTwo.v,
        sigTwo.r,
        sigTwo.s
      )

      assert.isTrue(await accountsInstance.isSigner(account, signer, role))
      assert.isTrue(await accountsInstance.isSigner(account, signer2, role))
      assert.equal(await accountsInstance.authorizedBy(signer), account)
      assert.equal(await accountsInstance.authorizedBy(signer2), account)
      assert.isTrue(await accountsInstance.isAuthorizedSigner(signer))
      assert.isTrue(await accountsInstance.isAuthorizedSigner(signer2))
    })

    it('can authorize a signer for multiple roles', async () => {
      assert.isFalse(await accountsInstance.isSigner(account, signer, role))
      assert.isFalse(await accountsInstance.isSigner(account, signer, role2))

      const sigTwo = await getSignatureForAuthorization(
        account,
        signer,
        role2,
        accountsInstance.address
      )
      await accountsInstance.authorizeSignerWithSignature(signer, role, sig.v, sig.r, sig.s)
      await accountsInstance.authorizeSignerWithSignature(
        signer,
        role2,
        sigTwo.v,
        sigTwo.r,
        sigTwo.s
      )

      assert.isTrue(await accountsInstance.isSigner(account, signer, role))
      assert.isTrue(await accountsInstance.isSigner(account, signer, role2))
      assert.equal(await accountsInstance.authorizedBy(signer), account)
      assert.isTrue(await accountsInstance.isAuthorizedSigner(signer))
    })

    it('signer cannot be authorized by two accounts', async () => {
      const sigTwo = await getSignatureForAuthorization(
        account2,
        signer,
        role,
        accountsInstance.address
      )
      await accountsInstance.authorizeSignerWithSignature(signer, role, sig.v, sig.r, sig.s)
      await assertRevert(
        accountsInstance.authorizeSignerWithSignature(signer, role, sigTwo.v, sigTwo.r, sigTwo.s),
        'Cannot re-authorize address or locked gold account for another account'
      )
    })

    it('can set the default signer for a role', async () => {
      assert.isFalse(await accountsInstance.isSigner(account, signer, role))
      assert.isFalse(await accountsInstance.hasDefaultSigner(account, role))
      assert.equal(await accountsInstance.getDefaultSigner(account, role), account)

      await assertRevert(accountsInstance.setIndexedSigner(signer, role))
      await accountsInstance.authorizeSignerWithSignature(signer, role, sig.v, sig.r, sig.s)
      await accountsInstance.setIndexedSigner(signer, role)

      assert.isTrue(await accountsInstance.isSigner(account, signer, role))
      assert.isTrue(await accountsInstance.hasDefaultSigner(account, role))
      assert.equal(await accountsInstance.getDefaultSigner(account, role), signer)
    })

    it('can remove the default signer for a role', async () => {
      await accountsInstance.authorizeSignerWithSignature(signer, role, sig.v, sig.r, sig.s)
      await accountsInstance.setIndexedSigner(signer, role)
      await accountsInstance.removeDefaultSigner(role)

      assert.isTrue(await accountsInstance.isSigner(account, signer, role))
      assert.isFalse(await accountsInstance.hasDefaultSigner(account, role))
      assert.equal(await accountsInstance.getDefaultSigner(account, role), account)
    })
  })

  // backwards compatibility matrix for authorizeSigner instead
  // of authorizeXXXSigner
  const backwardsCompatibilityMatrix = [
    [false, false],
    [false, true],
    [true, false],
    [true, true],
  ]
  backwardsCompatibilityMatrix.forEach(([genericRead, genericWrite]) => {
    const scenarios = [
      {
        keyName: 'Vote',
        key: keccak256('celo.org/core/vote'),
        description: 'vote signing key',
      },
      {
        keyName: 'Validator',
        key: keccak256('celo.org/core/validator'),
        description: 'validator signing key',
      },
      {
        keyName: 'Attestation',
        key: keccak256('celo.org/core/attestation'),
        description: 'attestation signing key',
      },
    ]

    scenarios.forEach(({ keyName, key, description }) => {
      describe(`${description} authorization tests (generic writes ${genericWrite} and generic reads ${genericRead})`, () => {
        let testInstance: any
        let getSignature

        beforeEach(async () => {
          const authorizeSignerFactory =
            (role: string) =>
            async (signer, v, r, s, ...rest) => {
              const result1 = await accountsInstance.authorizeSignerWithSignature(
                signer,
                role,
                v,
                r,
                s,
                ...rest
              )
              const result2 = await accountsInstance.setIndexedSigner(signer, role, ...rest)
              return {
                logs: [...result1.logs, ...result2.logs],
              }
            }

          getSignature = (_account, signer) => {
            if (genericWrite) {
              return getSignatureForAuthorization(_account, signer, key, accountsInstance.address)
            }
            return getParsedSignatureOfAddress(web3, _account, signer)
          }

          testInstance = {
            fn: genericWrite
              ? authorizeSignerFactory(key)
              : accountsInstance[`authorize${keyName}Signer`],
            eventName: genericWrite ? 'SignerAuthorized' : `${keyName}SignerAuthorized`,
            getAuthorizedFromAccount: genericRead
              ? (...args) => accountsInstance.getIndexedSigner(args[0], key, ...args.slice(1))
              : accountsInstance[`get${keyName}Signer`],
            authorizedSignerToAccount: genericRead
              ? (signer) => accountsInstance.signerToAccount(signer)
              : accountsInstance[`${keyName.toLowerCase()}SignerToAccount`],
            hasAuthorizedSigner: genericRead
              ? (signer) => accountsInstance.hasIndexedSigner(signer, key)
              : accountsInstance[`hasAuthorized${keyName}Signer`],
            removeSigner: genericWrite
              ? async () => {
                  const defaultSigner = await accountsInstance[`get${keyName}Signer`](account)
                  await accountsInstance.removeSigner(defaultSigner, key)
                }
              : accountsInstance[`remove${keyName}Signer`],
          }
          await accountsInstance.createAccount()
        })

        describe(`#authorize${keyName}Signer()`, () => {
          const authorized = accounts[1]
          let sig

          beforeEach(async () => {
            sig = await getSignature(account, authorized)
          })

          it(`should set the authorized key (${description})`, async () => {
            assert.isFalse(await testInstance.hasAuthorizedSigner(account))
            await testInstance.fn(authorized, sig.v, sig.r, sig.s)
            assert.equal(await accountsInstance.authorizedBy(authorized), account)
            assert.equal(await testInstance.getAuthorizedFromAccount(account), authorized)
            assert.equal(await testInstance.authorizedSignerToAccount(authorized), account)
            assert.isTrue(await testInstance.hasAuthorizedSigner(account))
          })

          it(`should emit the right event`, async () => {
            const resp = await testInstance.fn(authorized, sig.v, sig.r, sig.s)

            assert.equal(resp.logs.length, genericWrite ? 3 : 4)
            const log = resp.logs[genericWrite ? 0 : 3]
            assertLogMatches(
              log,
              testInstance.eventName,
              genericWrite
                ? {
                    account,
                    role: key,
                    signer: authorized,
                  }
                : {
                    account,
                    signer: authorized,
                  }
            )
          })

          it(`should revert if the ${description} is an account`, async () => {
            await accountsInstance.createAccount({ from: authorized })
            await assertRevert(testInstance.fn(authorized, sig.v, sig.r, sig.s))
          })

          it(`should revert if the ${description} is already authorized`, async () => {
            const otherAccount = accounts[2]
            const otherSig = await getSignature(otherAccount, authorized)
            await accountsInstance.createAccount({ from: otherAccount })
            await testInstance.fn(authorized, otherSig.v, otherSig.r, otherSig.s, {
              from: otherAccount,
            })
            await assertRevert(testInstance.fn(authorized, sig.v, sig.r, sig.s))
          })

          it('should revert if the signature is incorrect', async () => {
            const nonVoter = accounts[3]
            const incorrectSig = await getSignature(account, nonVoter)
            await assertRevert(
              testInstance.fn(authorized, incorrectSig.v, incorrectSig.r, incorrectSig.s)
            )
          })

          describe('when a previous authorization has been made', () => {
            const newAuthorized = accounts[2]
            let newSig
            beforeEach(async () => {
              await testInstance.fn(authorized, sig.v, sig.r, sig.s)
              newSig = await getSignature(account, newAuthorized)
              await testInstance.fn(newAuthorized, newSig.v, newSig.r, newSig.s)
            })

            it(`should set the new authorized ${description}`, async () => {
              assert.equal(await accountsInstance.authorizedBy(newAuthorized), account)
              assert.equal(await testInstance.getAuthorizedFromAccount(account), newAuthorized)
              assert.equal(await testInstance.authorizedSignerToAccount(newAuthorized), account)
            })

            it('should preserve the previous authorization', async () => {
              assert.equal(await accountsInstance.authorizedBy(authorized), account)
            })
          })
        })

        describe(`#getAccountFrom${keyName}Signer()`, () => {
          describe(`when the account has not authorized a ${description}`, () => {
            it('should return the account when passed the account', async () => {
              assert.equal(await testInstance.authorizedSignerToAccount(account), account)
            })

            it('should revert when passed an address that is not an account', async () => {
              await assertRevert(testInstance.authorizedSignerToAccount(accounts[1]))
            })
          })

          describe(`when the account has authorized a ${description}`, () => {
            const authorized = accounts[1]
            beforeEach(async () => {
              const sig = await getSignature(account, authorized)
              await testInstance.fn(authorized, sig.v, sig.r, sig.s)
            })

            it('should return the account when passed the account', async () => {
              assert.equal(await testInstance.authorizedSignerToAccount(account), account)
            })

            it(`should return the account when passed the ${description}`, async () => {
              assert.equal(await testInstance.authorizedSignerToAccount(authorized), account)
            })
          })
        })

        describe(`#get${keyName}SignerFromAccount()`, () => {
          describe(`when the account has not authorized a ${description}`, () => {
            it('should return the account when passed the account', async () => {
              assert.equal(await testInstance.getAuthorizedFromAccount(account), account)
            })
          })

          describe(`when the account has authorized a ${description}`, () => {
            const authorized = accounts[1]

            beforeEach(async () => {
              const sig = await getSignature(account, authorized)
              await testInstance.fn(authorized, sig.v, sig.r, sig.s)
            })

            it(`should return the ${description} when passed the account`, async () => {
              assert.equal(await testInstance.getAuthorizedFromAccount(account), authorized)
            })
          })
        })

        describe(`#remove${keyName}Signer()`, () => {
          it(`should be able to remove the ${description} signer after authorizing`, async () => {
            const authorized = accounts[1]
            const sig = await getSignature(account, authorized)

            await testInstance.fn(authorized, sig.v, sig.r, sig.s)
            assert.isTrue(await testInstance.hasAuthorizedSigner(account))
            assert.equal(await testInstance.getAuthorizedFromAccount(account), authorized)

            await testInstance.removeSigner()
            assert.isFalse(await testInstance.hasAuthorizedSigner(account))
            assert.equal(await testInstance.getAuthorizedFromAccount(account), account)
          })
        })
      })
    })
  })
})
