# Account

Manage your account, keys, and metadata

## `celocli account:authorize`

Keep your locked Gold more secure by authorizing alternative keys to be used for signing attestations, voting, or validating. By doing so, you can continue to participate in the protocol while keeping the key with access to your locked Gold in cold storage. You must include a "proof-of-possession" of the key being authorized, which can be generated with the "account:proof-of-possession" command.

```text
Keep your locked Gold more secure by authorizing alternative keys to be used for signing attestations, voting, or validating. By doing so, you can continue to participate in the protocol while keeping the key with access to your locked Gold in cold storage. You must include a "proof-of-possession" of the key being authorized, which can be generated with the "account:proof-of-possession" command.

USAGE
  $ celocli account:authorize

OPTIONS
  -r, --role=vote|validator|attestation                (required) Role to delegate

  --blsKey=0x                                          The BLS public key that the
                                                       validator is using for consensus,
                                                       should pass proof of possession.
                                                       96 bytes.

  --blsPop=0x                                          The BLS public key
                                                       proof-of-possession, which
                                                       consists of a signature on the
                                                       account address. 48 bytes.

  --from=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d    (required) Account Address

  --globalHelp                                         View all available global flags

  --signature=0x                                       (required) Signature (a.k.a
                                                       proof-of-possession) of the
                                                       signer key

  --signer=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) Account Address

EXAMPLES
  authorize --from 0x5409ED021D9299bf6814279A6A1411A7e866A631 --role vote --signer
  0x6ecbe1db9ef729cbe972c83fb886247691fb6beb --signature
  0x1b9fca4bbb5bfb1dbe69ef1cddbd9b4202dcb6b134c5170611e1e36ecfa468d7b46c85328d504934fce6
  c2a1571603a50ae224d2b32685e84d4d1a1eebad8452eb

  authorize --from 0x5409ED021D9299bf6814279A6A1411A7e866A631 --role validator --signer
  0x6ecbe1db9ef729cbe972c83fb886247691fb6beb --signature
  0x1b9fca4bbb5bfb1dbe69ef1cddbd9b4202dcb6b134c5170611e1e36ecfa468d7b46c85328d504934fce6
  c2a1571603a50ae224d2b32685e84d4d1a1eebad8452eb --blsKey
  0x4fa3f67fc913878b068d1fa1cdddc54913d3bf988dbe5a36a20fa888f20d4894c408a6773f3d7bde1115
  4f2a3076b700d345a42fd25a0e5e83f4db5586ac7979ac2053cd95d8f2efd3e959571ceccaa743e02cf4be
  3f5d7aaddb0b06fc9aff00 --blsPop
  0xcdb77255037eb68897cd487fdd85388cbda448f617f874449d4b11588b0b7ad8ddc20d9bb450b513bb35
  664ea3923900
```

_See code:_ [_src/commands/account/authorize.ts_](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/account/authorize.ts)

## `celocli account:balance ADDRESS`

View Celo Stables and CELO balances for an address

```text
View Celo Stables and CELO balances for an address

USAGE
  $ celocli account:balance ADDRESS

OPTIONS
  --erc20Address=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  Address of generic ERC-20
                                                             token to also check balance
                                                             for

  --globalHelp                                               View all available global
                                                             flags

EXAMPLES
  balance 0x5409ed021d9299bf6814279a6a1411a7e866a631

  balance 0x5409ed021d9299bf6814279a6a1411a7e866a631 --erc20Address
  0x765DE816845861e75A25fCA122bb6898B8B1282a
```

_See code:_ [_src/commands/account/balance.ts_](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/account/balance.ts)

## `celocli account:claim-account FILE`

Claim another account, and optionally its public key, and add the claim to a local metadata file

```text
Claim another account, and optionally its public key, and add the claim to a local metadata file

USAGE
  $ celocli account:claim-account FILE

ARGUMENTS
  FILE  Path of the metadata file

OPTIONS
  --address=address                                  (required) The address of the
                                                     account you want to claim

  --from=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) Address of the account
                                                     to set metadata for or an
                                                     authorized signer for the address
                                                     in the metadata

  --globalHelp                                       View all available global flags

  --publicKey=publicKey                              The public key of the account that
                                                     others may use to send you
                                                     encrypted messages

EXAMPLE
  claim-account ~/metadata.json --address 0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d
  --from 0x47e172F6CfB6c7D01C1574fa3E2Be7CC73269D95
```

_See code:_ [_src/commands/account/claim-account.ts_](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/account/claim-account.ts)

## `celocli account:claim-attestation-service-url FILE`

Claim the URL of the attestation service and add the claim to a local metadata file

```text
Claim the URL of the attestation service and add the claim to a local metadata file

USAGE
  $ celocli account:claim-attestation-service-url FILE

ARGUMENTS
  FILE  Path of the metadata file

OPTIONS
  --force                                            Ignore URL validity checks

  --from=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) Address of the account
                                                     to set metadata for or an
                                                     authorized signer for the address
                                                     in the metadata

  --globalHelp                                       View all available global flags

  --url=https://www.celo.org                         (required) The URL you want to
                                                     claim. Should begin http://

EXAMPLE
  claim-attestation-service-url ~/metadata.json --url https://test.com/myurl --from
  0x47e172F6CfB6c7D01C1574fa3E2Be7CC73269D95
```

_See code:_ [_src/commands/account/claim-attestation-service-url.ts_](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/account/claim-attestation-service-url.ts)

## `celocli account:claim-domain FILE`

Claim a domain and add the claim to a local metadata file

```text
Claim a domain and add the claim to a local metadata file

USAGE
  $ celocli account:claim-domain FILE

ARGUMENTS
  FILE  Path of the metadata file

OPTIONS
  --domain=domain                                    (required) The domain you want to
                                                     claim

  --from=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) Address of the account
                                                     to set metadata for or an
                                                     authorized signer for the address
                                                     in the metadata

  --globalHelp                                       View all available global flags

EXAMPLE
  claim-domain ~/metadata.json --domain test.com --from
  0x47e172F6CfB6c7D01C1574fa3E2Be7CC73269D95
```

_See code:_ [_src/commands/account/claim-domain.ts_](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/account/claim-domain.ts)

## `celocli account:claim-keybase FILE`

Claim a keybase username and add the claim to a local metadata file

```text
Claim a keybase username and add the claim to a local metadata file

USAGE
  $ celocli account:claim-keybase FILE

ARGUMENTS
  FILE  Path of the metadata file

OPTIONS
  --from=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) Address of the account
                                                     to set metadata for or an
                                                     authorized signer for the address
                                                     in the metadata

  --globalHelp                                       View all available global flags

  --username=username                                (required) The keybase username you
                                                     want to claim

EXAMPLE
  claim-keybase ~/metadata.json --from 0x47e172F6CfB6c7D01C1574fa3E2Be7CC73269D95
  --username myusername
```

_See code:_ [_src/commands/account/claim-keybase.ts_](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/account/claim-keybase.ts)

## `celocli account:claim-name FILE`

Claim a name and add the claim to a local metadata file

```text
Claim a name and add the claim to a local metadata file

USAGE
  $ celocli account:claim-name FILE

ARGUMENTS
  FILE  Path of the metadata file

OPTIONS
  --from=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) Address of the account
                                                     to set metadata for or an
                                                     authorized signer for the address
                                                     in the metadata

  --globalHelp                                       View all available global flags

  --name=name                                        (required) The name you want to
                                                     claim

EXAMPLE
  claim-name ~/metadata.json --from 0x47e172F6CfB6c7D01C1574fa3E2Be7CC73269D95 --name
  myname
```

_See code:_ [_src/commands/account/claim-name.ts_](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/account/claim-name.ts)

## `celocli account:claim-storage FILE`

Claim a storage root and add the claim to a local metadata file

```text
Claim a storage root and add the claim to a local metadata file

USAGE
  $ celocli account:claim-storage FILE

ARGUMENTS
  FILE  Path of the metadata file

OPTIONS
  --from=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) Address of the account
                                                     to set metadata for or an
                                                     authorized signer for the address
                                                     in the metadata

  --globalHelp                                       View all available global flags

  --url=https://www.celo.org                         (required) The URL of the storage
                                                     root you want to claim

EXAMPLE
  claim-storage ~/metadata.json --url http://test.com/myurl --from
  0x47e172F6CfB6c7D01C1574fa3E2Be7CC73269D95
```

_See code:_ [_src/commands/account/claim-storage.ts_](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/account/claim-storage.ts)

## `celocli account:create-metadata FILE`

Create an empty identity metadata file. Use this metadata file to store claims attesting to ownership of off-chain resources. Claims can be generated with the account:claim-\* commands.

```text
Create an empty identity metadata file. Use this metadata file to store claims attesting to ownership of off-chain resources. Claims can be generated with the account:claim-* commands.

USAGE
  $ celocli account:create-metadata FILE

ARGUMENTS
  FILE  Path where the metadata should be saved

OPTIONS
  --from=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) Address of the account
                                                     to set metadata for or an
                                                     authorized signer for the address
                                                     in the metadata

  --globalHelp                                       View all available global flags

EXAMPLE
  create-metadata ~/metadata.json --from 0x47e172F6CfB6c7D01C1574fa3E2Be7CC73269D95
```

_See code:_ [_src/commands/account/create-metadata.ts_](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/account/create-metadata.ts)

## `celocli account:get-metadata ADDRESS`

Show information about an address. Retreives the metadata URL for an account from the on-chain, then fetches the metadata file off-chain and verifies proofs as able.

```text
Show information about an address. Retreives the metadata URL for an account from the on-chain, then fetches the metadata file off-chain and verifies proofs as able.

USAGE
  $ celocli account:get-metadata ADDRESS

ARGUMENTS
  ADDRESS  Address to get metadata for

OPTIONS
  -x, --extended          show extra columns
  --columns=columns       only show provided columns (comma-separated)
  --csv                   output is csv format [alias: --output=csv]
  --filter=filter         filter property by partial string matching, ex: name=foo
  --globalHelp            View all available global flags
  --no-header             hide table header from output
  --no-truncate           do not truncate output to fit screen
  --output=csv|json|yaml  output in a more machine friendly format
  --sort=sort             property to sort by (prepend '-' for descending)

EXAMPLE
  get-metadata 0x97f7333c51897469E8D98E7af8653aAb468050a3
```

_See code:_ [_src/commands/account/get-metadata.ts_](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/account/get-metadata.ts)

## `celocli account:list`

List the addresses from the node and the local instance

```text
List the addresses from the node and the local instance

USAGE
  $ celocli account:list

OPTIONS
  --globalHelp  View all available global flags

  --local       If set, only show local and hardware wallet accounts. Use no-local to
                only show keystore addresses.
```

_See code:_ [_src/commands/account/list.ts_](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/account/list.ts)

## `celocli account:lock ACCOUNT`

Lock an account which was previously unlocked

```text
Lock an account which was previously unlocked

USAGE
  $ celocli account:lock ACCOUNT

ARGUMENTS
  ACCOUNT  Account address

OPTIONS
  --globalHelp  View all available global flags

EXAMPLE
  lock 0x5409ed021d9299bf6814279a6a1411a7e866a631
```

_See code:_ [_src/commands/account/lock.ts_](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/account/lock.ts)

## `celocli account:new`

Creates a new account locally using the Celo Derivation Path \(m/44'/52752'/0/changeIndex/addressIndex\) and print out the key information. Save this information for local transaction signing or import into a Celo node. Ledger: this command has been tested swapping mnemonics with the Ledger successfully \(only supports english\)

```text
Creates a new account locally using the Celo Derivation Path (m/44'/52752'/0/changeIndex/addressIndex) and print out the key information. Save this information for local transaction signing or import into a Celo node. Ledger: this command has been tested swapping mnemonics with the Ledger successfully (only supports english)

USAGE
  $ celocli account:new

OPTIONS
  --addressIndex=addressIndex
      Choose the address index for the derivation path

  --changeIndex=changeIndex
      Choose the change index for the derivation path

  --derivationPath=derivationPath
      Choose a different derivation Path (Celo's default is "m/44'/52752'/0'"). Use "eth"
      as an alias of the Ethereum derivation path ("m/44'/60'/0'"). Recreating the same
      account requires knowledge of the mnemonic, passphrase (if any), and the derivation
      path

  --globalHelp
      View all available global flags

  --language=chinese_simplified|chinese_traditional|english|french|italian|japanese|kore
  an|spanish
      [default: english] Language for the mnemonic words. **WARNING**, some hardware
      wallets don't support other languages

  --mnemonicPath=mnemonicPath
      Instead of generating a new mnemonic (seed phrase), use the user-supplied mnemonic
      instead. Path to a file that contains all the mnemonic words separated by a space
      (example: "word1 word2 word3 ... word24"). If the words are a language other than
      English, the --language flag must be used. Only BIP39 mnemonics are supported

  --passphrasePath=passphrasePath
      Path to a file that contains the BIP39 passphrase to combine with the mnemonic
      specified using the mnemonicPath flag and the index specified using the addressIndex
      flag. Every passphrase generates a different private key and wallet address.

EXAMPLES
  new

  new --passphrasePath myFolder/my_passphrase_file

  new --language spanish

  new --passphrasePath some_folder/my_passphrase_file --language japanese --addressIndex
  5

  new --passphrasePath some_folder/my_passphrase_file --mnemonicPath
  some_folder/my_mnemonic_file --addressIndex 5
```

_See code:_ [_src/commands/account/new.ts_](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/account/new.ts)

## `celocli account:offchain-read ADDRESS`

DEV: Reads the name from offchain storage

```text
DEV: Reads the name from offchain storage

USAGE
  $ celocli account:offchain-read ADDRESS

OPTIONS
  --bucket=bucket                                    If using a GCP or AWS storage
                                                     bucket this parameter is required

  --directory=directory                              [default: .] To which directory
                                                     data should be written

  --from=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  Account Address

  --globalHelp                                       View all available global flags

  --privateDEK=privateDEK

  --provider=(git|aws|gcp)                           If the CLI should attempt to push
                                                     to the cloud

EXAMPLES
  offchain-read 0x...

  offchain-read 0x... --from 0x... --privateKey 0x...
```

_See code:_ [_src/commands/account/offchain-read.ts_](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/account/offchain-read.ts)

## `celocli account:offchain-write`

DEV: Writes a name to offchain storage

```text
DEV: Writes a name to offchain storage

USAGE
  $ celocli account:offchain-write

OPTIONS
  --bucket=bucket           If using a GCP or AWS storage bucket this parameter is
                            required

  --directory=directory     [default: .] To which directory data should be written

  --encryptTo=encryptTo

  --globalHelp              View all available global flags

  --name=name               (required)

  --privateDEK=privateDEK

  --privateKey=privateKey   (required)

  --provider=(git|aws|gcp)  If the CLI should attempt to push to the cloud

EXAMPLES
  offchain-write --name test-account --privateKey 0x...

  offchain-write --name test-account --privateKey 0x...  privateDEK 0x... --encryptTo
  0x...
```

_See code:_ [_src/commands/account/offchain-write.ts_](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/account/offchain-write.ts)

## `celocli account:proof-of-possession`

Generate proof-of-possession to be used to authorize a signer. See the "account:authorize" command for more details.

```text
Generate proof-of-possession to be used to authorize a signer. See the "account:authorize" command for more details.

USAGE
  $ celocli account:proof-of-possession

OPTIONS
  --account=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) Address of the
                                                        account that needs to prove
                                                        possession of the signer key.

  --globalHelp                                          View all available global flags

  --signer=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d   (required) Address of the signer
                                                        key to prove possession of.

EXAMPLE
  proof-of-possession --account 0x5409ed021d9299bf6814279a6a1411a7e866a631 --signer
  0x6ecbe1db9ef729cbe972c83fb886247691fb6beb
```

_See code:_ [_src/commands/account/proof-of-possession.ts_](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/account/proof-of-possession.ts)

## `celocli account:recover-old`

Recovers the Valora old account and print out the key information. The old Valora app \(in a beta state\) generated the user address using a seed of 32 bytes, instead of 64 bytes. As the app fixed that, some old accounts were left with some funds. This command allows the user to recover those funds.

```text
Recovers the Valora old account and print out the key information. The old Valora app (in a beta state) generated the user address using a seed of 32 bytes, instead of 64 bytes. As the app fixed that, some old accounts were left with some funds. This command allows the user to recover those funds.

USAGE
  $ celocli account:recover-old

OPTIONS
  --addressIndex=addressIndex
      Choose the address index for the derivation path

  --changeIndex=changeIndex
      Choose the change index for the derivation path

  --derivationPath=derivationPath
      Choose a different derivation Path (Celo's default is "m/44'/52752'/0'"). Use "eth"
      as an alias of the Ethereum derivation path ("m/44'/60'/0'"). Recreating the same
      account requires knowledge of the mnemonic, passphrase (if any), and the derivation
      path

  --globalHelp
      View all available global flags

  --language=chinese_simplified|chinese_traditional|english|french|italian|japanese|kore
  an|spanish
      [default: english] Language for the mnemonic words. **WARNING**, some hardware
      wallets don't support other languages

  --mnemonicPath=mnemonicPath
      (required) Path to a file that contains all the mnemonic words separated by a space
      (example: "word1 word2 word3 ... word24"). If the words are a language other than
      English, the --language flag must be used. Only BIP39 mnemonics are supported

  --passphrasePath=passphrasePath
      Path to a file that contains the BIP39 passphrase to combine with the mnemonic
      specified using the mnemonicPath flag and the index specified using the addressIndex
      flag. Every passphrase generates a different private key and wallet address.

EXAMPLES
  recover-old --mnemonicPath some_folder/my_mnemonic_file

  recover-old --mnemonicPath some_folder/my_mnemonic_file --passphrasePath
  myFolder/my_passphrase_file

  recover-old --mnemonicPath some_folder/my_mnemonic_file --language spanish

  recover-old --mnemonicPath some_folder/my_mnemonic_file --passphrasePath
  some_folder/my_passphrase_file --language japanese --addressIndex 5

  recover-old --mnemonicPath some_folder/my_mnemonic_file --passphrasePath
  some_folder/my_passphrase_file --addressIndex 5
```

_See code:_ [_src/commands/account/recover-old.ts_](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/account/recover-old.ts)

## `celocli account:register`

Register an account on-chain. This allows you to lock Gold, which is a pre-requisite for registering a Validator or Group, participating in Validator elections and on-chain Governance, and earning epoch rewards.

```text
Register an account on-chain. This allows you to lock Gold, which is a pre-requisite for registering a Validator or Group, participating in Validator elections and on-chain Governance, and earning epoch rewards.

USAGE
  $ celocli account:register

OPTIONS
  --from=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) Account Address
  --globalHelp                                       View all available global flags
  --name=name

EXAMPLES
  register --from 0x5409ed021d9299bf6814279a6a1411a7e866a631

  register --from 0x5409ed021d9299bf6814279a6a1411a7e866a631 --name test-account
```

_See code:_ [_src/commands/account/register.ts_](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/account/register.ts)

## `celocli account:register-data-encryption-key`

Register a data encryption key for an account on chain. This key can be used to encrypt data to you such as offchain metadata or transaction comments

```text
Register a data encryption key for an account on chain. This key can be used to encrypt data to you such as offchain metadata or transaction comments

USAGE
  $ celocli account:register-data-encryption-key

OPTIONS
  --from=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) Addess of the account to
                                                     set the data encryption key for

  --globalHelp                                       View all available global flags

  --publicKey=publicKey                              (required) The public key you want
                                                     to register

EXAMPLE
  register-data-encryption-key --publicKey 0x...  --from
  0x47e172F6CfB6c7D01C1574fa3E2Be7CC73269D95
```

_See code:_ [_src/commands/account/register-data-encryption-key.ts_](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/account/register-data-encryption-key.ts)

## `celocli account:register-metadata`

Register metadata URL for an account where users will be able to retieve the metadata file and verify your claims

```text
Register metadata URL for an account where users will be able to retieve the metadata file and verify your claims

USAGE
  $ celocli account:register-metadata

OPTIONS
  -x, --extended                                     show extra columns

  --columns=columns                                  only show provided columns
                                                     (comma-separated)

  --csv                                              output is csv format [alias:
                                                     --output=csv]

  --filter=filter                                    filter property by partial string
                                                     matching, ex: name=foo

  --force                                            Ignore metadata validity checks

  --from=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) Addess of the account to
                                                     set metadata for

  --globalHelp                                       View all available global flags

  --no-header                                        hide table header from output

  --no-truncate                                      do not truncate output to fit
                                                     screen

  --output=csv|json|yaml                             output in a more machine friendly
                                                     format

  --sort=sort                                        property to sort by (prepend '-'
                                                     for descending)

  --url=https://www.celo.org                         (required) The url to the metadata
                                                     you want to register

EXAMPLE
  register-metadata --url https://www.mywebsite.com/celo-metadata --from
  0x47e172F6CfB6c7D01C1574fa3E2Be7CC73269D95
```

_See code:_ [_src/commands/account/register-metadata.ts_](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/account/register-metadata.ts)

## `celocli account:set-name`

Sets the name of a registered account on-chain. An account's name is an optional human readable identifier

```text
Sets the name of a registered account on-chain. An account's name is an optional human readable identifier

USAGE
  $ celocli account:set-name

OPTIONS
  --account=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) Account Address
  --globalHelp                                          View all available global flags
  --name=name                                           (required)

EXAMPLE
  set-name --account 0x5409ed021d9299bf6814279a6a1411a7e866a631 --name test-account
```

_See code:_ [_src/commands/account/set-name.ts_](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/account/set-name.ts)

## `celocli account:show ADDRESS`

Show information for an account, including name, authorized vote, validator, and attestation signers, the URL at which account metadata is hosted, the address the account is using with the mobile wallet, and a public key that can be used to encrypt information for the account.

```text
Show information for an account, including name, authorized vote, validator, and attestation signers, the URL at which account metadata is hosted, the address the account is using with the mobile wallet, and a public key that can be used to encrypt information for the account.

USAGE
  $ celocli account:show ADDRESS

OPTIONS
  --globalHelp  View all available global flags

EXAMPLE
  show 0x5409ed021d9299bf6814279a6a1411a7e866a631
```

_See code:_ [_src/commands/account/show.ts_](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/account/show.ts)

## `celocli account:show-claimed-accounts ADDRESS`

Show information about claimed accounts

```text
Show information about claimed accounts

USAGE
  $ celocli account:show-claimed-accounts ADDRESS

OPTIONS
  --globalHelp  View all available global flags

EXAMPLE
  show-claimed-accounts 0x5409ed021d9299bf6814279a6a1411a7e866a631
```

_See code:_ [_src/commands/account/show-claimed-accounts.ts_](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/account/show-claimed-accounts.ts)

## `celocli account:show-metadata FILE`

Show the data in a local metadata file

```text
Show the data in a local metadata file

USAGE
  $ celocli account:show-metadata FILE

ARGUMENTS
  FILE  Path of the metadata file

OPTIONS
  -x, --extended          show extra columns
  --columns=columns       only show provided columns (comma-separated)
  --csv                   output is csv format [alias: --output=csv]
  --filter=filter         filter property by partial string matching, ex: name=foo
  --globalHelp            View all available global flags
  --no-header             hide table header from output
  --no-truncate           do not truncate output to fit screen
  --output=csv|json|yaml  output in a more machine friendly format
  --sort=sort             property to sort by (prepend '-' for descending)

EXAMPLE
  show-metadata ~/metadata.json
```

_See code:_ [_src/commands/account/show-metadata.ts_](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/account/show-metadata.ts)

## `celocli account:unlock ACCOUNT`

Unlock an account address to send transactions or validate blocks

```text
Unlock an account address to send transactions or validate blocks

USAGE
  $ celocli account:unlock ACCOUNT

ARGUMENTS
  ACCOUNT  Account address

OPTIONS
  --duration=duration  Duration in seconds to leave the account unlocked. Unlocks until
                       the node exits by default.

  --globalHelp         View all available global flags

  --password=password  Password used to unlock the account. If not specified, you will
                       be prompted for a password.

EXAMPLES
  unlock 0x5409ed021d9299bf6814279a6a1411a7e866a631

  unlock 0x5409ed021d9299bf6814279a6a1411a7e866a631 --duration 600
```

_See code:_ [_src/commands/account/unlock.ts_](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/account/unlock.ts)

## `celocli account:verify-proof-of-possession`

Verify a proof-of-possession. See the "account:proof-of-possession" command for more details.

```text
Verify a proof-of-possession. See the "account:proof-of-possession" command for more details.

USAGE
  $ celocli account:verify-proof-of-possession

OPTIONS
  --account=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) Address of the
                                                        account that needs to prove
                                                        possession of the signer key.

  --globalHelp                                          View all available global flags

  --signature=0x                                        (required) Signature (a.k.a.
                                                        proof-of-possession) of the
                                                        signer key

  --signer=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d   (required) Address of the signer
                                                        key to verify proof of
                                                        possession.

EXAMPLE
  verify-proof-of-possession --account 0x199eDF79ABCa29A2Fa4014882d3C13dC191A5B58
  --signer 0x0EdeDF7B1287f07db348997663EeEb283D70aBE7 --signature
  0x1c5efaa1f7ca6484d49ccce76217e2fba0552c0b23462cff7ba646473bc2717ffc4ce45be89bd5be9b5d
  23305e87fc2896808467c4081d9524a84c01b89ec91ca3
```

_See code:_ [_src/commands/account/verify-proof-of-possession.ts_](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/account/verify-proof-of-possession.ts)

