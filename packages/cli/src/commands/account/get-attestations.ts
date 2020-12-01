import { ContractKit, OdisUtils } from '@celo/contractkit'
import { AuthSigner } from '@celo/contractkit/lib/identity/odis/query'
import { flags } from '@oclif/command'
import Web3 from 'web3'
import { BaseCommand } from '../../base'

export default class GetAttestations extends BaseCommand {
  static description =
    "Looks up attestations associated with the provided phone number. If a pepper is not provided, it uses the --from account's balance to query the pepper."

  static flags = {
    ...BaseCommand.flags,
    phoneNumber: flags.string({
      required: true,
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
    network: flags.string({
      required: false,
      description: 'The ODIS service to hit: mainnet, alfajores, alfajoresstaging',
    }),
  }

  static examples = [
    'get-attestations --phoneNumber +15555555555 --from 0x47e172F6CfB6c7D01C1574fa3E2Be7CC73269D95',
    'get-attestations --phoneNumber +15555555555 --pepper XgnKVpplZc0p1',
  ]

  async run() {
    const res = this.parse(GetAttestations)
    const phoneNumber = res.flags.phoneNumber
    const account = res.flags.from
    let pepper = res.flags.pepper
    if (!account && !pepper) {
      console.error('Must specify either --from or --pepper')
      return
    }
    const network = res.flags.network

    const web3 = new Web3()

    // Get Phone number pepper
    // Needs a balance to perform query
    if (!pepper) {
      pepper = await this.getPhoneNumberPepper(this.kit, phoneNumber, account!, network)
      console.log('Pepper: ' + pepper)
    }

    const attestations = await this.kit.contracts.getAttestations()
    const identifier = web3.utils.soliditySha3({
      type: 'string',
      value: 'tel://' + phoneNumber + '__' + pepper,
    })
    console.log(await attestations.lookupIdentifiers([identifier]))
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
