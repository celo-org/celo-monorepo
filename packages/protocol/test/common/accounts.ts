import { NULL_ADDRESS } from '@celo/base/lib/address'
import { ContractKit, newKitFromWeb3 } from '@celo/contractkit'
import { CeloContractName } from '@celo/protocol/lib/registry-utils'
import {
  buildAuthorizeSignerTypedData,
  getParsedSignatureOfAddress,
} from '@celo/protocol/lib/signing-utils'
import { assertLogMatches, assertLogMatches2, assertRevert } from '@celo/protocol/lib/test-utils'
import { parseSolidityStringArray } from '@celo/utils/lib/parsing'
import { upperFirst } from 'lodash'
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

contract('Accounts', (accounts: string[]) => {
  let accountsInstance: AccountsInstance
  let mockValidators: MockValidatorsInstance
  const account = accounts[0]
  const caller = accounts[0]

  let kit: ContractKit
  let chainId: number

  const name = 'Account'
  const metadataURL = 'https://www.celo.org'
  const dataEncryptionKey = '0x02f2f48ee19680706196e2e339e5da3491186e0c4c5030670656b0e01611111111'
  const longDataEncryptionKey =
    '0x04f2f48ee19680706196e2e339e5da3491186e0c4c5030670656b0e01611111111' +
    '02f2f48ee19680706196e2e339e5da3491186e0c4c5030670656b0e01611111111'

  beforeEach(async () => {
    accountsInstance = await Accounts.new(true, { from: account })
    mockValidators = await MockValidators.new()
    const registry = await Registry.new()
    await registry.setAddressFor(CeloContractName.Validators, mockValidators.address)
    await registry.setAddressFor(CeloContractName.Accounts, accountsInstance.address)
    await accountsInstance.initialize(registry.address)

    kit = newKitFromWeb3(web3)
    chainId = await kit.connection.chainId()
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
        (data as unknown) as string
      )
      for (let i = 0; i < accounts.length; i++) {
        assert.equal(strings[i], randomStrings[i])
      }
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

  describe.only('generic authorization', () => {
    const account2 = accounts[1]
    const signer = accounts[2]
    const signer2 = accounts[3]
    const role = keccak256('Test Role')
    const role2 = keccak256('Test Role 2')
    let sig, sig2

    beforeEach(async () => {
      sig = await kit.connection.signTypedData(
        signer,
        buildAuthorizeSignerTypedData({
          account,
          signer,
          role,
          accountsContractAddress: accountsInstance.address,
          chainId,
        })
      )
      sig2 = await kit.connection.signTypedData(
        signer,
        buildAuthorizeSignerTypedData({
          account,
          signer,
          role: role2,
          accountsContractAddress: accountsInstance.address,
          chainId,
        })
      )
      await accountsInstance.createAccount()
      await accountsInstance.createAccount({ from: account2 })
    })

    it('should set the authorized signer in two steps', async () => {
      assert.isFalse(await accountsInstance.isSigner(account, signer, role))
      await accountsInstance.authorizeSigner(signer, role)
      assert.isFalse(await accountsInstance.isSigner(account, signer, role))

      await accountsInstance.completeSignerAuthorization(account, role, { from: signer })
      assert.isTrue(await accountsInstance.isSigner(account, signer, role))
      assert.equal(await accountsInstance.authorizedBy(signer), account)
      assert.isTrue(await accountsInstance.isAuthorizedSigner(signer))
    })

    it.only('should set the authorized signer in one step with signature', async () => {
      assert.isFalse(await accountsInstance.isSigner(account, signer, role))

      console.log('Account', account)
      console.log('Signer', signer)

      try {
        console.log(
          '>>> testing',
          await accountsInstance.getRoleAuthorizationSigner(
            account,
            signer,
            role,
            sig.v,
            sig.r,
            sig.s
          )
        )

        const a = await accountsInstance.authorizeSignerWithSignature(
          signer,
          role,
          sig.v,
          sig.r,
          sig.s
        )
        console.log(JSON.stringify(a, null, 2))
      } catch (e) {
        console.log(e)
      }

      assert.isTrue(await accountsInstance.isSigner(account, signer, role))
      assert.equal(await accountsInstance.authorizedBy(signer), account)
      assert.isTrue(await accountsInstance.isAuthorizedSigner(signer))
    })

    it('should remove the authorized signer', async () => {
      await accountsInstance.authorizeSignerWithSignature(signer, role, sig.v, sig.r, sig.s)
      await accountsInstance.removeSigner(signer, role)
      assert.isFalse(await accountsInstance.isSigner(account, signer, role))
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

    it('can authorize multiple signers for a role', async () => {
      assert.isFalse(await accountsInstance.isSigner(account, signer, role))
      assert.isFalse(await accountsInstance.isSigner(account, signer2, role))

      await accountsInstance.authorizeSignerWithSignature(signer, role, sig.v, sig.r, sig.s)
      await accountsInstance.authorizeSignerWithSignature(signer2, role, sig2.v, sig2.r, sig2.s)

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

      await accountsInstance.authorizeSignerWithSignature(signer, role, sig.v, sig.r, sig.s)
      await accountsInstance.authorizeSignerWithSignature(signer, role2, sig.v, sig.r, sig.s)

      assert.isTrue(await accountsInstance.isSigner(account, signer, role))
      assert.isTrue(await accountsInstance.isSigner(account, signer, role2))
      assert.equal(await accountsInstance.authorizedBy(signer), account)
      assert.isTrue(await accountsInstance.isAuthorizedSigner(signer))
    })

    it('signer cannot be authorized by two accounts', async () => {
      const sigOne = await getParsedSignatureOfAddress(web3, account, signer)
      const sigTwo = await getParsedSignatureOfAddress(web3, account2, signer)

      await accountsInstance.authorizeSignerWithSignature(
        signer,
        role,
        sigOne.v,
        sigOne.r,
        sigOne.s
      )
      await assertRevert(
        accountsInstance.authorizeSignerWithSignature(signer, role, sigTwo.v, sigTwo.r, sigTwo.s),
        'Cannot re-authorize address or locked gold account for another account'
      )
    })

    it('can set the default signer for a role', async () => {
      assert.isFalse(await accountsInstance.isSigner(account, signer, role))
      assert.isFalse(await accountsInstance.hasDefaultSigner(account, role))
      assert.equal(await accountsInstance.getDefaultSigner(account, role), account)

      await assertRevert(accountsInstance.setDefaultSigner(signer, role))
      await accountsInstance.authorizeSignerWithSignature(signer, role, sig.v, sig.r, sig.s)
      await accountsInstance.setDefaultSigner(signer, role)

      assert.isTrue(await accountsInstance.isSigner(account, signer, role))
      assert.isTrue(await accountsInstance.hasDefaultSigner(account, role))
      assert.equal(await accountsInstance.getDefaultSigner(account, role), signer)
    })

    it('can remove the default signer for a role', async () => {
      await accountsInstance.authorizeSignerWithSignature(signer, role, sig.v, sig.r, sig.s)
      await accountsInstance.setDefaultSigner(signer, role)
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
    const authorizeSignerFactory = (role: string) => async (signer, v, r, s, ...rest) => {
      const result1 = await accountsInstance.authorizeSignerWithSignature(
        signer,
        role,
        v,
        r,
        s,
        ...rest
      )
      const result2 = await accountsInstance.setDefaultSigner(signer, role, ...rest)
      return {
        logs: [...result1.logs, ...result2.logs],
      }
    }

    const VotingKey = keccak256('celo.org/core/vote')
    const ValidatorKey = keccak256('celo.org/core/validator')
    const AttestationKey = keccak256('celo.org/core/attestation')

    const scenarios = [
      {
        key: VotingKey,
        description: 'vote signing key',
      },
      {
        key: ValidatorKey,
        description: 'validator signing key',
      },
      {
        key: AttestationKey,
        description: 'attestation signing key',
      },
    ]
    scenarios.forEach(({ key, description }) => {
      describe(`${description} authorization tests (generic writes ${genericWrite} and generic reads ${genericRead})`, () => {
        let authorizationTest: any
        beforeEach(async () => {
          const authorizationTests = {
            [VotingKey]: {
              fn: genericWrite
                ? authorizeSignerFactory(VotingKey)
                : accountsInstance.authorizeVoteSigner,
              eventName: genericWrite ? 'SignerAuthorized' : 'VoteSignerAuthorized',
              getAuthorizedFromAccount: genericRead
                ? (...args) =>
                    accountsInstance.getDefaultSigner(args[0], VotingKey, ...args.slice(1))
                : accountsInstance.getVoteSigner,
              authorizedSignerToAccount: genericRead
                ? (signer) => accountsInstance.signerToAccount(signer)
                : accountsInstance.voteSignerToAccount,
              hasAuthorizedSigner: genericRead
                ? (signer) => accountsInstance.hasDefaultSigner(signer, VotingKey)
                : accountsInstance.hasAuthorizedVoteSigner,
              removeSigner: genericWrite
                ? async () => {
                    const defaultSigner = await accountsInstance.getVoteSigner(account)
                    await accountsInstance.removeSigner(defaultSigner, VotingKey)
                  }
                : accountsInstance.removeVoteSigner,
            },
            [ValidatorKey]: {
              fn: genericWrite
                ? authorizeSignerFactory(ValidatorKey)
                : accountsInstance.authorizeValidatorSigner,
              eventName: genericWrite ? 'SignerAuthorized' : 'ValidatorSignerAuthorized',
              getAuthorizedFromAccount: genericRead
                ? (...args) =>
                    accountsInstance.getDefaultSigner(args[0], ValidatorKey, ...args.slice(1))
                : accountsInstance.getValidatorSigner,
              authorizedSignerToAccount: genericRead
                ? (signer) => accountsInstance.signerToAccount(signer)
                : accountsInstance.validatorSignerToAccount,
              hasAuthorizedSigner: genericRead
                ? (signer) => accountsInstance.hasDefaultSigner(signer, ValidatorKey)
                : accountsInstance.hasAuthorizedValidatorSigner,
              removeSigner: genericWrite
                ? async () => {
                    const defaultSigner = await accountsInstance.getValidatorSigner(account)
                    await accountsInstance.removeSigner(defaultSigner, ValidatorKey)
                  }
                : accountsInstance.removeValidatorSigner,
            },
            [AttestationKey]: {
              fn: genericWrite
                ? authorizeSignerFactory(AttestationKey)
                : accountsInstance.authorizeAttestationSigner,
              eventName: genericWrite ? 'SignerAuthorized' : 'AttestationSignerAuthorized',
              getAuthorizedFromAccount: genericRead
                ? (...args) =>
                    accountsInstance.getDefaultSigner(args[0], AttestationKey, ...args.slice(1))
                : accountsInstance.getAttestationSigner,
              authorizedSignerToAccount: genericRead
                ? (signer) => accountsInstance.signerToAccount(signer)
                : accountsInstance.attestationSignerToAccount,
              hasAuthorizedSigner: genericRead
                ? (signer) => accountsInstance.hasDefaultSigner(signer, AttestationKey)
                : accountsInstance.hasAuthorizedAttestationSigner,
              removeSigner: genericWrite
                ? async () => {
                    const defaultSigner = await accountsInstance.getAttestationSigner(account)
                    await accountsInstance.removeSigner(defaultSigner, AttestationKey)
                  }
                : accountsInstance.removeAttestationSigner,
            },
          }
          authorizationTest = authorizationTests[key]
          await accountsInstance.createAccount()
        })

        describe(`#authorize ${upperFirst(description)}()`, () => {
          const authorized = accounts[1]
          let sig

          beforeEach(async () => {
            sig = await getParsedSignatureOfAddress(web3, account, authorized)
          })

          it(`should set the authorized key (${key})`, async () => {
            assert.isFalse(await authorizationTest.hasAuthorizedSigner(account))
            await authorizationTest.fn(authorized, sig.v, sig.r, sig.s)
            assert.equal(await accountsInstance.authorizedBy(authorized), account)
            assert.equal(await authorizationTest.getAuthorizedFromAccount(account), authorized)
            assert.equal(await authorizationTest.authorizedSignerToAccount(authorized), account)
            assert.isTrue(await authorizationTest.hasAuthorizedSigner(account))
          })

          it(`should emit the right event`, async () => {
            const resp = await authorizationTest.fn(authorized, sig.v, sig.r, sig.s)

            assert.equal(resp.logs.length, genericWrite ? 2 : 3)
            const log = resp.logs[genericWrite ? 0 : 2]
            assertLogMatches(
              log,
              authorizationTest.eventName,
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

          it(`should revert if the ${key} is an account`, async () => {
            await accountsInstance.createAccount({ from: authorized })
            await assertRevert(authorizationTest.fn(authorized, sig.v, sig.r, sig.s))
          })

          it(`should revert if the ${key} is already authorized`, async () => {
            const otherAccount = accounts[2]
            const otherSig = await getParsedSignatureOfAddress(web3, otherAccount, authorized)
            await accountsInstance.createAccount({ from: otherAccount })
            await authorizationTest.fn(authorized, otherSig.v, otherSig.r, otherSig.s, {
              from: otherAccount,
            })
            await assertRevert(authorizationTest.fn(authorized, sig.v, sig.r, sig.s))
          })

          it('should revert if the signature is incorrect', async () => {
            const nonVoter = accounts[3]
            const incorrectSig = await getParsedSignatureOfAddress(web3, account, nonVoter)
            await assertRevert(
              authorizationTest.fn(authorized, incorrectSig.v, incorrectSig.r, incorrectSig.s)
            )
          })

          describe('when a previous authorization has been made', () => {
            const newAuthorized = accounts[2]
            let newSig
            beforeEach(async () => {
              await authorizationTest.fn(authorized, sig.v, sig.r, sig.s)
              newSig = await getParsedSignatureOfAddress(web3, account, newAuthorized)
              await authorizationTest.fn(newAuthorized, newSig.v, newSig.r, newSig.s)
            })

            it(`should set the new authorized ${key}`, async () => {
              assert.equal(await accountsInstance.authorizedBy(newAuthorized), account)
              assert.equal(await authorizationTest.getAuthorizedFromAccount(account), newAuthorized)
              assert.equal(
                await authorizationTest.authorizedSignerToAccount(newAuthorized),
                account
              )
            })

            it('should preserve the previous authorization', async () => {
              assert.equal(await accountsInstance.authorizedBy(authorized), account)
            })
          })
        })

        describe(`#getAccountFrom${upperFirst(description)}()`, () => {
          describe(`when the account has not authorized a ${key}`, () => {
            it('should return the account when passed the account', async () => {
              assert.equal(await authorizationTest.authorizedSignerToAccount(account), account)
            })

            it('should revert when passed an address that is not an account', async () => {
              await assertRevert(authorizationTest.authorizedSignerToAccount(accounts[1]))
            })
          })

          describe(`when the account has authorized a ${key}`, () => {
            const authorized = accounts[1]
            beforeEach(async () => {
              const sig = await getParsedSignatureOfAddress(web3, account, authorized)
              await authorizationTest.fn(authorized, sig.v, sig.r, sig.s)
            })

            it('should return the account when passed the account', async () => {
              assert.equal(await authorizationTest.authorizedSignerToAccount(account), account)
            })

            it(`should return the account when passed the ${key}`, async () => {
              assert.equal(await authorizationTest.authorizedSignerToAccount(authorized), account)
            })
          })
        })

        describe(`#get${upperFirst(description)}FromAccount()`, () => {
          describe(`when the account has not authorized a ${key}`, () => {
            it('should return the account when passed the account', async () => {
              assert.equal(await authorizationTest.getAuthorizedFromAccount(account), account)
            })
          })

          describe(`when the account has authorized a ${key}`, () => {
            const authorized = accounts[1]

            beforeEach(async () => {
              const sig = await getParsedSignatureOfAddress(web3, account, authorized)
              await authorizationTest.fn(authorized, sig.v, sig.r, sig.s)
            })

            it(`should return the ${key} when passed the account`, async () => {
              assert.equal(await authorizationTest.getAuthorizedFromAccount(account), authorized)
            })
          })
        })

        describe(`#remove${upperFirst(description)}()`, () => {
          it(`should be able to remove the ${key} signer after authorizing`, async () => {
            const authorized = accounts[1]
            const sig = await getParsedSignatureOfAddress(web3, account, authorized)

            await authorizationTest.fn(authorized, sig.v, sig.r, sig.s)
            assert.isTrue(await authorizationTest.hasAuthorizedSigner(account))
            assert.equal(await authorizationTest.getAuthorizedFromAccount(account), authorized)

            await authorizationTest.removeSigner()
            assert.isFalse(await authorizationTest.hasAuthorizedSigner(account))
            assert.equal(await authorizationTest.getAuthorizedFromAccount(account), account)
          })
        })
      })
    })
  })
})
