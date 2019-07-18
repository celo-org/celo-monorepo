import ContractUtils from './src/contract-utils-v2'
import GenesisBlockUtils from './src/genesis-block-utils'
import GoogleStorageUtils from './src/google-storage-utils'
import { Logger, LogLevel } from './src/logger'
import StaticNodeUtils from './src/static-node-utils'

export {
  Attestations,
  BondedDeposits,
  Escrow,
  Exchange,
  GasCurrencyWhitelist,
  GasPriceMinimum,
  GoldToken,
  Governance,
  Random,
  Registry,
  Reserve,
  SortedOracles,
  StableToken,
  Validators,
} from './contracts/index'
export {
  CeloFunctionCall,
  CeloLog,
  FunctionABICache,
  constructFunctionABICache,
  getFunctionSignatureFromInput,
  parseFunctionCall,
  parseLog,
} from './src/abi'
export { unlockAccount } from './src/account-utils'
export {
  ActionableAttestation,
  AttestationState,
  attestationMessageToSign,
  decodeAttestationCode,
  extractAttestationCodeFromMessage,
  findMatchingIssuer,
  getActionableAttestations,
  getAttestationFee,
  getAttestationState,
  getDataEncryptionKey,
  getWalletAddress,
  lookupPhoneNumbers,
  makeApproveAttestationFeeTx,
  makeCompleteTx,
  makeRequestTx,
  makeRevealTx,
  makeSetAccountTx,
  makeSetWalletAddressTx,
  messageContainsAttestationCode,
  sanitizeBase64,
  validateAttestationCode,
} from './src/attestations'
export {
  CeloContract,
  Contracts,
  SendTransaction,
  SendTransactionLogEvent,
  SendTransactionLogEventType,
  TxLogger,
  TxPromises,
  awaitConfirmation,
  emptyTxLogger,
  getContracts,
  selectContractByAddress,
  sendTransaction,
  sendTransactionAsync,
} from './src/contract-utils'
export {
  getABEContract,
  getAttestationsContract,
  getEscrowContract,
  getExchangeContract,
  getGasPriceMinimumContract,
  getGoldTokenContract,
  getStableTokenContract,
} from './src/contracts'
export {
  CeloTokenType,
  allowance,
  approveToken,
  balanceOf,
  convertToContractDecimals,
  getErc20Balance,
  getGoldTokenAddress,
  parseFromContractDecimals,
  selectTokenContractByIdentifier,
  transferToken,
  transferTokenWithComment,
} from './src/erc20-utils'
export { ContractUtils }
export { GenesisBlockUtils }
export { GoogleStorageUtils }
export { Logger as ContractKitLogger, LogLevel as ContractKitLogLevel }
export { StaticNodeUtils }

// Note: If we export Web3Utils here than the mobile app fails with the following error: https://pastebin.com/raw/1QzcaFsW
// Therefore, I am disabling that for now
// TODO(ashishb): Renable this
// import { Web3Utils } from './src/web3-utils'
// export { Web3Utils }
