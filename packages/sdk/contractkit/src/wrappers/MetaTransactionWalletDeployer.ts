import { MetaTransactionWalletDeployer } from '../generated/MetaTransactionWalletDeployer'
import { BaseWrapper, proxySend } from './BaseWrapper'

export class MetaTransactionWalletDeployerWrapper extends BaseWrapper<MetaTransactionWalletDeployer> {
  deploy = proxySend(this.connection, this.contract.methods.deploy)
}

export type MetaTransactionWalletDeployerWrapperType = MetaTransactionWalletDeployerWrapper
