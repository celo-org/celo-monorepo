import { MetaTransactionWalletDeployer } from '../generated/MetaTransactionWalletDeployer'
import { BaseWrapper, identity, proxyCall, proxySend, stringIdentity } from './BaseWrapper'

export class MetaTransactionWalletDeployerWrapper extends BaseWrapper<
  MetaTransactionWalletDeployer
> {
  getWallet = proxyCall(this.contract.methods.wallets, undefined, stringIdentity)
  canDeploy = proxyCall(this.contract.methods.canDeploy, undefined, identity)
  owner = proxyCall(this.contract.methods.owner, undefined, stringIdentity)

  changeDeployerPermission = proxySend(this.kit, this.contract.methods.changeDeployerPermission)
  deploy = proxySend(this.kit, this.contract.methods.deploy)
}
