import { capitalize } from 'lodash'
import { AccountsInstance } from 'types'
import { getParsedSignatureOfAddress } from '../../lib/signing-utils'
import { assertLogMatches, assertRevert, NULL_ADDRESS } from '../../lib/test-utils'
const Accounts: Truffle.Contract<AccountsInstance> = artifacts.require('Accounts')
let authorizationTests = { voter: {}, validator: {} }

contract('Accounts', (accounts: string[]) => {
  let accountsInstance: AccountsInstance
  let account = accounts[0]

  beforeEach(async () => {
    accountsInstance = await Accounts.new({ from: account })
    await accountsInstance.initialize()

    authorizationTests.voter = {
      fn: accountsInstance.authorizeVoter,
      getAuthorizedFromAccount: accountsInstance.getVoterFromAccount,
      getAccountFromAuthorized: accountsInstance.getAccountFromVoter,
    }
    authorizationTests.validator = {
      fn: accountsInstance.authorizeValidator,
      getAuthorizedFromAccount: accountsInstance.getValidatorFromAccount,
      getAccountFromAuthorized: accountsInstance.getAccountFromValidator,
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

  Object.keys(authorizationTests).forEach((key) => {
    describe('authorization tests:', () => {
      let authorizationTest: any
      beforeEach(async () => {
        authorizationTest = authorizationTests[key]
        await accountsInstance.createAccount()
      })

      describe(`#authorize${capitalize(key)}()`, () => {
        const authorized = accounts[1]
        let sig

        beforeEach(async () => {
          sig = await getParsedSignatureOfAddress(web3, account, authorized)
        })

        it(`should set the authorized ${key}`, async () => {
          await authorizationTest.fn(authorized, sig.v, sig.r, sig.s)
          assert.equal(await accountsInstance.authorizedBy(authorized), account)
          assert.equal(await authorizationTest.getAuthorizedFromAccount(account), authorized)
          assert.equal(await authorizationTest.getAccountFromAuthorized(authorized), account)
        })

        it(`should emit a ${capitalize(key)}Authorized event`, async () => {
          const resp = await authorizationTest.fn(authorized, sig.v, sig.r, sig.s)
          assert.equal(resp.logs.length, 1)
          const log = resp.logs[0]
          const expected = { account }
          expected[key] = authorized
          assertLogMatches(log, `${capitalize(key)}Authorized`, expected)
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

        describe('when a previous authorization has been made', async () => {
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
            assert.equal(await authorizationTest.getAccountFromAuthorized(newAuthorized), account)
          })

          it('should reset the previous authorization', async () => {
            assert.equal(await accountsInstance.authorizedBy(authorized), NULL_ADDRESS)
          })
        })
      })

      describe(`#getAccountFrom${capitalize(key)}()`, () => {
        describe(`when the account has not authorized a ${key}`, () => {
          it('should return the account when passed the account', async () => {
            assert.equal(await authorizationTest.getAccountFromAuthorized(account), account)
          })

          it('should revert when passed an address that is not an account', async () => {
            await assertRevert(authorizationTest.getAccountFromAuthorized(accounts[1]))
          })
        })

        describe(`when the account has authorized a ${key}`, () => {
          const authorized = accounts[1]
          beforeEach(async () => {
            const sig = await getParsedSignatureOfAddress(web3, account, authorized)
            await authorizationTest.fn(authorized, sig.v, sig.r, sig.s)
          })

          it('should return the account when passed the account', async () => {
            assert.equal(await authorizationTest.getAccountFromAuthorized(account), account)
          })

          it(`should return the account when passed the ${key}`, async () => {
            assert.equal(await authorizationTest.getAccountFromAuthorized(authorized), account)
          })
        })
      })

      describe(`#get${capitalize(key)}FromAccount()`, () => {
        describe(`when the account has not authorized a ${key}`, () => {
          it('should return the account when passed the account', async () => {
            assert.equal(await authorizationTest.getAuthorizedFromAccount(account), account)
          })

          it('should revert when not passed an account', async () => {
            await assertRevert(authorizationTest.getAuthorizedFromAccount(accounts[1]), account)
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
    })
  })
})
