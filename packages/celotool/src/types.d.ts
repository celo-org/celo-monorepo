declare module 'web3-utils'
declare module 'country-data'
declare module 'bip39' {
  function mnemonicToSeedSync(mnemonic: string): Buffer
}
declare module 'read-last-lines' {
  namespace readLastLines {
    function read(inputFilePath: string, maxLineCount: number, encoding?: string): Promise<string[]>
  }
  export = readLastLines
}
