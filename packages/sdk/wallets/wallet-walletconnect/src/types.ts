export enum SupportedMethods {
  accounts = 'eth_accounts',
  sendTransaction = 'eth_sendTransaction',
  signTransaction = 'eth_signTransaction',
  personalSign = 'personal_sign',
  signTypedData = 'eth_signTypedData',
  decrypt = 'personal_decrypt',
  computeSharedSecret = 'personal_computeSharedSecret',
}
