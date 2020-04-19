import { ContractKit, IdentityMetadataWrapper, newKitFromWeb3 } from '@celo/contractkit'
import { ClaimTypes } from '@celo/contractkit/lib/identity'
import { testWithGanache } from '@celo/dev-utils/lib/ganache-test'
import { readFileSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import Web3 from 'web3'
import ClaimAccount from './claim-account'
import ClaimDomain from './claim-domain'
import ClaimName from './claim-name'
import CreateMetadata from './create-metadata'
import RegisterMetadata from './register-metadata'
process.env.NO_SYNCCHECK = 'true'

testWithGanache('account metadata cmds', (web3: Web3) => {
  let account: string
  let accounts: string[]
  let kit: ContractKit

  beforeEach(async () => {
    accounts = await web3.eth.getAccounts()
    kit = newKitFromWeb3(web3)
    account = accounts[0]
  })

  describe('Modifying the metadata file', () => {
    const emptyFilePath = `${tmpdir()}/metadata.json`
    const generateEmptyMetadataFile = () => {
      writeFileSync(emptyFilePath, IdentityMetadataWrapper.fromEmpty(account))
    }

    const readFile = () => {
      return IdentityMetadataWrapper.fromFile(kit, emptyFilePath)
    }

    test('account:create-metadata cmd', async () => {
      const newFilePath = `${tmpdir()}/newfile.json`
      await CreateMetadata.run(['--from', account, newFilePath])
      const res = JSON.parse(readFileSync(newFilePath).toString())
      expect(res.meta.address).toEqual(account)
    })

    test('account:claim-name cmd', async () => {
      generateEmptyMetadataFile()
      const name = 'myname'
      await ClaimName.run(['--from', account, '--name', name, emptyFilePath])
      const metadata = await readFile()
      const claim = metadata.findClaim(ClaimTypes.NAME)
      expect(claim).toBeDefined()
      expect(claim!.name).toEqual(name)
    })

    test('account:claim-domain cmd', async () => {
      generateEmptyMetadataFile()
      const domain = 'test.com'
      await ClaimDomain.run(['--from', account, '--domain', domain, emptyFilePath])
      const metadata = await readFile()
      const claim = metadata.findClaim(ClaimTypes.DOMAIN)
      expect(claim).toBeDefined()
      expect(claim!.domain).toEqual(domain)
    })

    test('account:claim-account cmd', async () => {
      generateEmptyMetadataFile()
      const otherAccount = accounts[1]
      await ClaimAccount.run(['--from', account, '--address', otherAccount, emptyFilePath])
      const metadata = await readFile()
      const claim = metadata.findClaim(ClaimTypes.ACCOUNT)
      expect(claim).toBeDefined()
      expect(claim!.address).toEqual(otherAccount)
    })
  })

  describe('account:register-metadata cmd', () => {
    describe('when the account is registered', () => {
      beforeEach(async () => {
        const accountsInstance = await kit.contracts.getAccounts()
        await accountsInstance.createAccount().sendAndWaitForReceipt({ from: account })
      })

      test('can register metadata', async () => {
        await RegisterMetadata.run(['--force', '--from', account, '--url', 'https://test.com'])
      })

      test('fails if url is missing', async () => {
        await expect(RegisterMetadata.run(['--force', '--from', account])).rejects.toThrow(
          'Missing required flag'
        )
      })
    })

    it('cannot register metadata', async () => {
      await expect(
        RegisterMetadata.run(['--force', '--from', account, '--url', 'https://test.com'])
      ).rejects.toThrow("Some checks didn't pass!")
    })
  })
})
