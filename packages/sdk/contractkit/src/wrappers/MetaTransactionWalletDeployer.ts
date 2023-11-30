import { MetaTransactionWalletDeployer } from '@celo/abis/types/web3/MetaTransactionWalletDeployer'
import { BaseWrapper, proxySend } from './BaseWrapper'

/*
 * @deprecated https://github.com/celo-org/celo-monorepo/issues/10766
 */
export class MetaTransactionWalletDeployerWrapper extends BaseWrapper<MetaTransactionWalletDeployer> {
  /*
   * @deprecated https://github.com/celo-org/celo-monorepo/issues/10766
   */
  deploy = proxySend(this.connection, this.contract.methods.deploy)
}

export type MetaTransactionWalletDeployerWrapperType = MetaTransactionWalletDeployerWrapper
