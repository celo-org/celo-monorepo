import { CeloContract } from '@celo/contractkit'
import { newProxy } from '@celo/contractkit/lib/generated/Proxy'
import { newICeloVersionedContract } from '@celo/contractkit/lib/generated/ICeloVersionedContract'
import { BaseCommand } from '../../base'
import { printValueMapRecursive } from '../../utils/cli'

export default class Contracts extends BaseCommand {
  static description = 'Lists Celo core contracts and their addesses.'

  static flags = {
    ...BaseCommand.flags,
  }

  async run() {
    const addressMapping = await this.kit.registry.addressMapping()
    const info: {
      [name in CeloContract]?: {
        version: string
        proxy: string
        implementation: string
        balance: any
      }
    } = {}
    for (const [contract, proxy] of addressMapping.entries()) {
      try {
        const proxyContract = newProxy(this.kit.web3, proxy)
        const implementation = await proxyContract.methods._getImplementation().call()

        const versionedContract = newICeloVersionedContract(this.kit.web3, implementation)
        const version = await versionedContract.methods.getVersionNumber().call()
        const readableVersion = `${version[0]}.${version[1]}.${version[2]}.${version[3]}`

        const balance = await this.kit.celoTokens.balancesOf(proxy)
        info[contract] = {
          version: readableVersion,
          proxy,
          implementation,
          balance,
        }
      } catch (e) {
        console.debug(`Contract ${contract} at address ${proxy} failed with ${e}`)
      }
    }
    printValueMapRecursive(info)
  }
}
