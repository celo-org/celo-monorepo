import { upperFirst } from 'lodash'
import { AccountsInstance } from 'types'
import { getParsedSignatureOfAddress } from '../../lib/signing-utils'
import {
  assertLogMatches,
  assertLogMatches2,
  assertRevert,
  NULL_ADDRESS,
} from '../../lib/test-utils'
const Accounts: Truffle.Contract<AccountsInstance> = artifacts.require('Accounts')
let authorizationTests: any = {
  voting: {
    me: 'vote signing key',
    subject: 'voteSigner',
  },
  validating: {
    me: 'validation signing key',
    subject: 'validationSigner',
  },
  attesting: {
    me: 'attestation signing key',
    subject: 'attestationSigner',
  },
}

contract('Accounts', (accounts: string[]) => {
  let accountsInstance: AccountsInstance
  let account = accounts[0]
  const caller = accounts[0]

  const name = 'Account'
  const metadataURL = 'https://www.celo.org'
  const dataEncryptionKey = '0x02f2f48ee19680706196e2e339e5da3491186e0c4c5030670656b0e01611111111'
  const longDataEncryptionKey =
    '0x04f2f48ee19680706196e2e339e5da3491186e0c4c5030670656b0e01611111111' +
    '02f2f48ee19680706196e2e339e5da3491186e0c4c5030670656b0e01611111111'

  beforeEach(async () => {
    accountsInstance = await Accounts.new({ from: account })
    await accountsInstance.initialize()

    authorizationTests.voting = {
      fn: accountsInstance.authorizeVoteSigner,
      eventName: 'VoteSignerAuthorized',
      getAuthorizedFromAccount: accountsInstance.getVoteSignerFromAccount,
      getAccountFromAuthorized: accountsInstance.getAccountFromVoteSigner,
    }
    authorizationTests.validating = {
      fn: accountsInstance.authorizeValidationSigner,
      eventName: 'ValidationSignerAuthorized',
      getAuthorizedFromAccount: accountsInstance.getValidationSignerFromAccount,
      getAccountFromAuthorized: accountsInstance.getAccountFromValidationSigner,
    }
    authorizationTests.attesting = {
      fn: accountsInstance.authorizeAttestationSigner,
      eventName: 'AttestationSignerAuthorized',
      getAuthorizedFromAccount: accountsInstance.getAttestationSignerFromAccount,
      getAccountFromAuthorized: accountsInstance.getAccountFromAttestationSigner,
    }
  })

  describe('#initialize()', () => {
    it('should set the owner', async () => {
      const owner: string = await accountsInstance.owner()
      assert.equal(owner, account)
    })

    it('should revert if already initialized', async () => {
      await assertRevert(accountsInstance.initialize())
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

  describe('#setAccount', async () => {
    it('should set the name, dataEncryptionKey and walletAddress', async () => {
      // @ts-ignore
      await accountsInstance.setAccount(name, dataEncryptionKey, caller)
      const expectedWalletAddress = await accountsInstance.getWalletAddress(caller)
      assert.equal(expectedWalletAddress, caller)
      const expectedKey = await accountsInstance.getDataEncryptionKey(caller)
      // @ts-ignore
      assert.equal(expectedKey, dataEncryptionKey)
      const expectedName = await accountsInstance.getName(caller)
      assert.equal(expectedName, name)
    })
  })

  describe('#setWalletAddress', async () => {
    it('should set the walletAddress', async () => {
      await accountsInstance.setWalletAddress(caller)
      const result = await accountsInstance.getWalletAddress(caller)
      assert.equal(result, caller)
    })

    it('should set the NULL_ADDRESS', async () => {
      await accountsInstance.setWalletAddress(NULL_ADDRESS)
      const result = await accountsInstance.getWalletAddress(caller)
      assert.equal(result, NULL_ADDRESS)
    })

    it('should emit the AccountWalletAddressSet event', async () => {
      const response = await accountsInstance.setWalletAddress(caller)
      assert.lengthOf(response.logs, 1)
      const event = response.logs[0]
      assertLogMatches2(event, {
        event: 'AccountWalletAddressSet',
        args: { account: caller, walletAddress: caller },
      })
    })
  })

  describe('#setMetadataURL', async () => {
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

  describe('#setName', async () => {
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

  Object.keys(authorizationTests).forEach((key) => {
    describe('authorization tests:', () => {
      let authorizationTest: any
      beforeEach(async () => {
        authorizationTest = authorizationTests[key]
        await accountsInstance.createAccount()
      })

      describe(`#authorize${upperFirst(authorizationTests[key].subject)}()`, () => {
        const authorized = accounts[1]
        let sig

        beforeEach(async () => {
          sig = await getParsedSignatureOfAddress(web3, account, authorized)
        })

        it(`should set the authorized ${authorizationTests[key].me}`, async () => {
          await authorizationTest.fn(authorized, sig.v, sig.r, sig.s)
          assert.equal(await accountsInstance.authorizedBy(authorized), account)
          assert.equal(await authorizationTest.getAuthorizedFromAccount(account), authorized)
          assert.equal(await authorizationTest.getAccountFromAuthorized(authorized), account)
        })

        it(`should emit the right event`, async () => {
          const resp = await authorizationTest.fn(authorized, sig.v, sig.r, sig.s)
          assert.equal(resp.logs.length, 1)
          const log = resp.logs[0]
          const expected = { account, signer: authorized }
          assertLogMatches(log, authorizationTest.eventName, expected)
        })

        it(`should revert if the ${authorizationTests[key].me} is an account`, async () => {
          await accountsInstance.createAccount({ from: authorized })
          await assertRevert(authorizationTest.fn(authorized, sig.v, sig.r, sig.s))
        })

        it(`should revert if the ${authorizationTests[key].me} is already authorized`, async () => {
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

        describe('when a previous authorization has been made', async () => {
          const newAuthorized = accounts[2]
          let newSig
          beforeEach(async () => {
            await authorizationTest.fn(authorized, sig.v, sig.r, sig.s)
            newSig = await getParsedSignatureOfAddress(web3, account, newAuthorized)
            await authorizationTest.fn(newAuthorized, newSig.v, newSig.r, newSig.s)
          })

          it(`should set the new authorized ${authorizationTests[key].me}`, async () => {
            assert.equal(await accountsInstance.authorizedBy(newAuthorized), account)
            assert.equal(await authorizationTest.getAuthorizedFromAccount(account), newAuthorized)
            assert.equal(await authorizationTest.getAccountFromAuthorized(newAuthorized), account)
          })

          it('should reset the previous authorization', async () => {
            assert.equal(await accountsInstance.authorizedBy(authorized), NULL_ADDRESS)
          })
        })
      })

      describe(`#getAccountFrom${upperFirst(authorizationTests[key].subject)}()`, () => {
        describe(`when the account has not authorized a ${authorizationTests[key].me}`, () => {
          it('should return the account when passed the account', async () => {
            assert.equal(await authorizationTest.getAccountFromAuthorized(account), account)
          })

          it('should revert when passed an address that is not an account', async () => {
            await assertRevert(authorizationTest.getAccountFromAuthorized(accounts[1]))
          })
        })

        describe(`when the account has authorized a ${authorizationTests[key].me}`, () => {
          const authorized = accounts[1]
          beforeEach(async () => {
            const sig = await getParsedSignatureOfAddress(web3, account, authorized)
            await authorizationTest.fn(authorized, sig.v, sig.r, sig.s)
          })

          it('should return the account when passed the account', async () => {
            assert.equal(await authorizationTest.getAccountFromAuthorized(account), account)
          })

          it(`should return the account when passed the ${
            authorizationTests[key].me
          }`, async () => {
            assert.equal(await authorizationTest.getAccountFromAuthorized(authorized), account)
          })
        })
      })

      describe(`#get${upperFirst(authorizationTests[key].subject)}FromAccount()`, () => {
        describe(`when the account has not authorized a ${authorizationTests[key].me}`, () => {
          it('should return the account when passed the account', async () => {
            assert.equal(await authorizationTest.getAuthorizedFromAccount(account), account)
          })

          it('should revert when not passed an account', async () => {
            await assertRevert(authorizationTest.getAuthorizedFromAccount(accounts[1]), account)
          })
        })

        describe(`when the account has authorized a ${authorizationTests[key].me}`, () => {
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
    })
  })
})
