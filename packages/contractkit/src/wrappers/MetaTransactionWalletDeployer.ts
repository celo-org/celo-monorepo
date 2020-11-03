import { MetaTransactionWalletDeployer } from '../generated/MetaTransactionWalletDeployer'
import { BaseWrapper, proxyCall, proxySend, stringIdentity } from './BaseWrapper'

export class MetaTransactionWalletDeployerWrapper extends BaseWrapper<
  MetaTransactionWalletDeployer
> {
  owner = proxyCall(this.contract.methods.owner, undefined, stringIdentity)
  deploy = proxySend(this.kit, this.contract.methods.deploy)
}
