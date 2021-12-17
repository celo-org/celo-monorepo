import { ContractKit } from '@celo/contractkit'
import { OdisUtils } from '@celo/identity'
import { AuthSigner } from '@celo/identity/lib/odis/query'
import { flags } from '@oclif/command'
import { BaseCommand } from '../../base'

export default class GetAttestations extends BaseCommand {
  static description =
    "Looks up attestations associated with the provided phone number. If a pepper is not provided, it uses the --from account's balance to query the pepper."

  static flags = {
    ...BaseCommand.flags,
    phoneNumber: flags.string({
      required: false,
      description: 'Phone number to check attestations for',
    }),
    from: flags.string({
      required: false,
      description: 'Account whose balance to use for querying ODIS for the pepper lookup',
    }),
    pepper: flags.string({
      required: false,
      description: 'ODIS phone number pepper',
    }),
    identifier: flags.string({
      required: false,
      description: 'On-chain identifier',
    }),
    network: flags.string({
      required: false,
      description: 'The ODIS service to hit: mainnet, alfajores, alfajoresstaging',
    }),
  }

  static examples = [
    'get-attestations --phoneNumber +15555555555 --from 0x47e172F6CfB6c7D01C1574fa3E2Be7CC73269D95',
    'get-attestations --phoneNumber +15555555555 --pepper XgnKVpplZc0p1',
    'get-attestations --identifier 0x4952c9db9c283a62721b13f56c4b5e84a438e2569af3de21cb3440efa8840872',
  ]

  async run() {
    const res = this.parse(GetAttestations)
    const phoneNumber = res.flags.phoneNumber
    const account = res.flags.from
    let identifier = res.flags.identifier
    let pepper = res.flags.pepper
    if (!account && !pepper && !identifier) {
      throw Error('Must specify either --from or --pepper or --identifier')
    }
    const network = res.flags.network
    const attestationsContract = await this.kit.contracts.getAttestations()
    const accountsContract = await this.kit.contracts.getAccounts()

    if (!identifier) {
      if (!phoneNumber) {
        throw Error('Must specify phoneNumber if identifier not provided')
      }
      // Get Phone number pepper
      // Needs a balance to perform query
      if (!pepper) {
        pepper = await this.getPhoneNumberPepper(this.kit, phoneNumber!, account!, network)
        console.log('Pepper: ' + pepper)
      }

      const computedIdentifier = this.kit.connection.web3.utils.soliditySha3({
        type: 'string',
        value: 'tel://' + phoneNumber + '__' + pepper,
      })
      identifier = computedIdentifier!
      console.log('Identifier: ' + identifier)
    }
    const accounts = await attestationsContract.lookupAccountsForIdentifier(identifier)
    accounts.forEach(async (accountAddress) => {
      console.log('Account address: ' + accountAddress)
      console.log('\tWallet address: ' + (await accountsContract.getWalletAddress(accountAddress)))
      console.log(
        '\tData-Encryption Key: ' + (await accountsContract.getDataEncryptionKey(accountAddress))
      )
    })
  }

  async getPhoneNumberPepper(
    kit: ContractKit,
    phoneNumber: string,
    account: string,
    network: string = 'mainnet'
  ): Promise<string> {
    console.log('Using network: ' + network)
    const authSigner: AuthSigner = {
      authenticationMethod: OdisUtils.Query.AuthenticationMethod.WALLET_KEY,
      contractKit: kit,
    }

    const ret = await OdisUtils.PhoneNumberIdentifier.getPhoneNumberIdentifier(
      phoneNumber,
      account,
      authSigner,
      OdisUtils.Query.getServiceContext(network)
    )

    return ret.pepper
  }
}
