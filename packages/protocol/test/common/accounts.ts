import { CeloContractName } from '@celo/protocol/lib/registry-utils'
import { getParsedSignatureOfAddress } from '@celo/protocol/lib/signing-utils'
import {
  assertLogMatches,
  assertLogMatches2,
  assertRevert,
  NULL_ADDRESS,
} from '@celo/protocol/lib/test-utils'
import { parseSolidityStringArray } from '@celo/utils/lib/parsing'
import { upperFirst } from 'lodash'
import {
  AccountsContract,
  AccountsInstance,
  MockValidatorsContract,
  MockValidatorsInstance,
  RegistryContract,
} from 'types'
const Accounts: AccountsContract = artifacts.require('Accounts')
const Registry: RegistryContract = artifacts.require('Registry')
const MockValidators: MockValidatorsContract = artifacts.require('MockValidators')
const authorizationTests: any = {}
const authorizationTestDescriptions = {
  voting: {
    me: 'vote signing key',
    subject: 'voteSigner',
  },
  validating: {
    me: 'validator signing key',
    subject: 'validatorSigner',
  },
  attesting: {
    me: 'attestation signing key',
    subject: 'attestationSigner',
  },
}

contract('Accounts', (accounts: string[]) => {
  let accountsInstance: AccountsInstance
  let mockValidators: MockValidatorsInstance
  const account = accounts[0]
  const caller = accounts[0]

  const name = 'Account'
  const metadataURL = 'https://www.celo.org'
  const dataEncryptionKey = '0x02f2f48ee19680706196e2e339e5da3491186e0c4c5030670656b0e01611111111'
  const longDataEncryptionKey =
    '0x04f2f48ee19680706196e2e339e5da3491186e0c4c5030670656b0e01611111111' +
    '02f2f48ee19680706196e2e339e5da3491186e0c4c5030670656b0e01611111111'

  beforeEach(async () => {
    accountsInstance = await Accounts.new({ from: account })
    mockValidators = await MockValidators.new()
    const registry = await Registry.new()
    await registry.setAddressFor(CeloContractName.Validators, mockValidators.address)
    await accountsInstance.initialize(registry.address)

    authorizationTests.voting = {
      fn: accountsInstance.authorizeVoteSigner,
      eventName: 'VoteSignerAuthorized',
      getAuthorizedFromAccount: accountsInstance.getVoteSigner,
      authorizedSignerToAccount: accountsInstance.voteSignerToAccount,
      hasAuthorizedSigner: accountsInstance.hasAuthorizedVoteSigner,
      removeSigner: accountsInstance.removeVoteSigner,
    }
    authorizationTests.validating = {
      fn: accountsInstance.authorizeValidatorSigner,
      eventName: 'ValidatorSignerAuthorized',
      getAuthorizedFromAccount: accountsInstance.getValidatorSigner,
      authorizedSignerToAccount: accountsInstance.validatorSignerToAccount,
      hasAuthorizedSigner: accountsInstance.hasAuthorizedValidatorSigner,
      removeSigner: accountsInstance.removeValidatorSigner,
    }
    authorizationTests.attesting = {
      fn: accountsInstance.authorizeAttestationSigner,
      eventName: 'AttestationSignerAuthorized',
      getAuthorizedFromAccount: accountsInstance.getAttestationSigner,
      authorizedSignerToAccount: accountsInstance.attestationSignerToAccount,
      hasAuthorizedSigner: accountsInstance.hasAuthorizedAttestationSigner,
      removeSigner: accountsInstance.removeAttestationSigner,
    }
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
      // @ts-ignore
      await accountsInstance.setAccountDataEncryptionKey(dataEncryptionKey)
      // @ts-ignore
      const fetchedKey: string = await accountsInstance.getDataEncryptionKey(caller)
      assert.equal(fetchedKey, dataEncryptionKey)
    })

    it('should allow setting a key with leading zeros', async () => {
      const keyWithZeros = '0x00000000000000000000000000000000000000000000000f2f48ee19680706191111'
      // @ts-ignore
      await accountsInstance.setAccountDataEncryptionKey(keyWithZeros)
      // @ts-ignore
      const fetchedKey: string = await accountsInstance.getDataEncryptionKey(caller)
      assert.equal(fetchedKey, keyWithZeros)
    })

    it('should revert when the key is invalid', async () => {
      // @ts-ignore
      await assertRevert(accountsInstance.setAccountDataEncryptionKey('0x32132931293'))
    })

    it('should allow a key that is longer than 33 bytes', async () => {
      // @ts-ignore
      await accountsInstance.setAccountDataEncryptionKey(longDataEncryptionKey)
      // @ts-ignore
      const fetchedKey: string = await accountsInstance.getDataEncryptionKey(caller)
      assert.equal(fetchedKey, longDataEncryptionKey)
    })

    it('should emit the AccountDataEncryptionKeySet event', async () => {
      // @ts-ignore
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
        // @ts-ignore
        await accountsInstance.setAccount(name, dataEncryptionKey, caller, '0x0', '0x0', '0x0')
        const expectedWalletAddress = await accountsInstance.getWalletAddress(caller)
        assert.equal(expectedWalletAddress, caller)
        const expectedKey = await accountsInstance.getDataEncryptionKey(caller)
        // @ts-ignore
        assert.equal(expectedKey, dataEncryptionKey)
        const expectedName = await accountsInstance.getName(caller)
        assert.equal(expectedName, name)
      })

      it('emits the AccountNameSet event', async () => {
        const resp = await accountsInstance.setAccount(
          name,
          // @ts-ignore
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
          // @ts-ignore
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
          // @ts-ignore
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
        // @ts-ignore
        await accountsInstance.setAccount(name, dataEncryptionKey, caller, '0x0', '0x0', '0x0')
        const expectedWalletAddress = await accountsInstance.getWalletAddress(caller)
        assert.equal(expectedWalletAddress, caller)
        const expectedKey = await accountsInstance.getDataEncryptionKey(caller)
        // @ts-ignore
        assert.equal(expectedKey, dataEncryptionKey)
        const expectedName = await accountsInstance.getName(caller)
        assert.equal(expectedName, name)
        const isAccount = await accountsInstance.isAccount(caller)
        assert.isTrue(isAccount)
      })

      it('should set a different address with the appropriate signature', async () => {
        const sig = await getParsedSignatureOfAddress(web3, account, accounts[1])
        // @ts-ignore
        await accountsInstance.setAccount(name, dataEncryptionKey, accounts[1], sig.v, sig.r, sig.s)
        const result = await accountsInstance.getWalletAddress(caller)
        assert.equal(result, accounts[1])
      })

      it('emits the AccountCreated event', async () => {
        const resp = await accountsInstance.setAccount(
          name,
          // @ts-ignore
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
        // @ts-ignore
        const resp = await accountsInstance.setAccount(
          name,
          // @ts-ignore
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
        // @ts-ignore
        const resp = await accountsInstance.setAccount(
          name,
          // @ts-ignore
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
        // @ts-ignore
        const resp = await accountsInstance.setAccount(
          name,
          // @ts-ignore
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
          // @ts-ignore
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

  Object.keys(authorizationTestDescriptions).forEach((key) => {
    describe('authorization tests:', () => {
      let authorizationTest: any
      beforeEach(async () => {
        authorizationTest = authorizationTests[key]
        await accountsInstance.createAccount()
      })

      describe(`#authorize${upperFirst(authorizationTestDescriptions[key].subject)}()`, () => {
        const authorized = accounts[1]
        let sig

        beforeEach(async () => {
          sig = await getParsedSignatureOfAddress(web3, account, authorized)
        })

        it(`should set the authorized ${authorizationTestDescriptions[key].me}`, async () => {
          assert.isFalse(await authorizationTest.hasAuthorizedSigner(account))
          await authorizationTest.fn(authorized, sig.v, sig.r, sig.s)
          assert.equal(await accountsInstance.authorizedBy(authorized), account)
          assert.equal(await authorizationTest.getAuthorizedFromAccount(account), authorized)
          assert.equal(await authorizationTest.authorizedSignerToAccount(authorized), account)
          assert.isTrue(await authorizationTest.hasAuthorizedSigner(account))
        })

        it(`should emit the right event`, async () => {
          const resp = await authorizationTest.fn(authorized, sig.v, sig.r, sig.s)
          assert.equal(resp.logs.length, 1)
          const log = resp.logs[0]
          const expected = { account, signer: authorized }
          assertLogMatches(log, authorizationTest.eventName, expected)
        })

        it(`should revert if the ${authorizationTestDescriptions[key].me} is an account`, async () => {
          await accountsInstance.createAccount({ from: authorized })
          await assertRevert(authorizationTest.fn(authorized, sig.v, sig.r, sig.s))
        })

        it(`should revert if the ${authorizationTestDescriptions[key].me} is already authorized`, async () => {
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

          it(`should set the new authorized ${authorizationTestDescriptions[key].me}`, async () => {
            assert.equal(await accountsInstance.authorizedBy(newAuthorized), account)
            assert.equal(await authorizationTest.getAuthorizedFromAccount(account), newAuthorized)
            assert.equal(await authorizationTest.authorizedSignerToAccount(newAuthorized), account)
          })

          it('should preserve the previous authorization', async () => {
            assert.equal(await accountsInstance.authorizedBy(authorized), account)
          })
        })
      })

      describe(`#getAccountFrom${upperFirst(authorizationTestDescriptions[key].subject)}()`, () => {
        describe(`when the account has not authorized a ${authorizationTestDescriptions[key].me}`, () => {
          it('should return the account when passed the account', async () => {
            assert.equal(await authorizationTest.authorizedSignerToAccount(account), account)
          })

          it('should revert when passed an address that is not an account', async () => {
            await assertRevert(authorizationTest.authorizedSignerToAccount(accounts[1]))
          })
        })

        describe(`when the account has authorized a ${authorizationTestDescriptions[key].me}`, () => {
          const authorized = accounts[1]
          beforeEach(async () => {
            const sig = await getParsedSignatureOfAddress(web3, account, authorized)
            await authorizationTest.fn(authorized, sig.v, sig.r, sig.s)
          })

          it('should return the account when passed the account', async () => {
            assert.equal(await authorizationTest.authorizedSignerToAccount(account), account)
          })

          it(`should return the account when passed the ${authorizationTestDescriptions[key].me}`, async () => {
            assert.equal(await authorizationTest.authorizedSignerToAccount(authorized), account)
          })
        })
      })

      describe(`#get${upperFirst(authorizationTestDescriptions[key].subject)}FromAccount()`, () => {
        describe(`when the account has not authorized a ${authorizationTestDescriptions[key].me}`, () => {
          it('should return the account when passed the account', async () => {
            assert.equal(await authorizationTest.getAuthorizedFromAccount(account), account)
          })

          it('should revert when not passed an account', async () => {
            await assertRevert(authorizationTest.getAuthorizedFromAccount(accounts[1]), account)
          })
        })

        describe(`when the account has authorized a ${authorizationTestDescriptions[key].me}`, () => {
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

      describe(`#remove${upperFirst(authorizationTestDescriptions[key].subject)}()`, () => {
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
