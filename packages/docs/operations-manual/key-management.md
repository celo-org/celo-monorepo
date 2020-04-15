# Key management

> Crypto is a tool for turning a whole swathe of problems into key management problems. Key management problems are way harder than (virtually all) cryptographers think.
>
> [@LeaKissner on Twitter](https://twitter.com/LeaKissner/status/1198595109756887040)

Celo has various mechanisms to reduce the impact of the loss or compromise of keys, mainly through the `Accounts` smart contract. On it, accounts can authorize other keys to perform certain actions on behalf of the account. Keys that need to be accessed frequently (e.g. for signing blocks) are at greater risk of being compromised, and thus have more limited permissions, while keys that need to be accessed infrequently (e.g. for locking Celo Gold) are less onerous to store securely, and thus have more expansive permissions. Below is a summary of the various keys that are used in the Celo network, and a description of their permissions.

| Name of the key        | Purpose                                                                                                                                                                                                                                                               |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Account key            | This key has the highest level of permissions, and is thus the most sensitive. It can be used to lock and unlock Celo Gold, and authorize vote, validator, and attestation keys. |
| Validator signer key   | This key has permission to participate in BFT consensus, and register and manage a Validator or Validator Group.                                                                                                                                          |
| Vote signer key        | This key can be used to vote in Validator elections and for on-chain governance proposals.                                                                                                                                                                                          |
| Attestation signer key | This key is used to sign attestations in Celo's lightweight identity protocol.                                                                                                                                                                                        |

{% hint style="warning" %}
An account may have at most one authorized signer key of each type at any time. Once a signer key is authorized, the only way to deauthorize that key is to authorize a new key that has never previously been used as a signer key, either for this account or another. It follows then that a newly deauthorized key cannot be reauthorized for any account.
{% endhint %}

## Key Security

The Account key is the most sensitive key because it can authorize the other keys and access locked gold. As it should be used quite infrequently, it is highly recommended for important Account keys (i.e. Validators or accounts with high balances) to remain as secure as possible. We recommend them to be offline, ideally in cold storage, or on a hardware wallet.

Signing keys are less sensitive, and more frequently used, than the Account key, but should still be safe-guarded. Validator signing keys, in particular, could be used to execute a double-signing attack if compromised, which may result in [slashing](../celo-codebase/protocol/proof-of-stake/penalties).

## Key Rotation

If a signing key is lost or compromised, the Account key can authorize a new signing key which replaces the old one. This prevents losing a signing key from becoming a catastrophic event and it is strongly recommended to regularly rotate keys to limit the impact of an undiscovered compromise.

### Validator Signer Key Rotation

Because the Validator signing key is constantly in use to sign consensus messages, Validator key rotation is a bit trickier. Here is a recommended procedure for rotating the signing key of an active and elected validator:

1. Create a new Validator instance as detailed in the [Deploy a Validator](../getting-started/running-a-validator.md#deploy-a-validator) section of the getting started documentation. When using a proxy, additionally create a new proxy and peer it with the new validator instance, as described in the same document. Wait for the new instances to sync before proceeding.

  {% hint style="warning" %}
  Before proceeding to steps 2 and 3, ensure there is sufficient time until the next epoch to complete both steps when rotating ECDSA and BLS keys together.
  {% endhint %}

2. Authorize the new Validator signer key with the Account key to overwrite the old Validator signer key.

  ```bash
  # With $CELO_VALIDATOR_SIGNER_ADDRESS as your new validator instance's signing address.
  celocli account:authorize --from $CELO_VALIDATOR_ADDRESS --role validator --signer $CELO_VALIDATOR_SIGNER_ADDRESS --signature $CELO_VALIDATOR_SIGNER_SIGNATURE
  ```

  {% hint style="info" %}
  Your ECDSA public key will be updated automatically from the proof-of-possession.
  {% endhint %}

3. Update your BLS key used for consensus. Rotating both the ECDSA and BLS keys is recommended.

  ```bash
  # With $CELO_VALIDATOR_SIGNER_BLS_PUBLIC_KEY as your new validator instance's BLS public key.
  celocli validator:update-bls-public-key --from $CELO_VALIDATOR_ADDRESS --blsKey $CELO_VALIDATOR_SIGNER_BLS_PUBLIC_KEY --blsPop $CELO_VALIDATOR_SIGNER_BLS_SIGNATURE
  ```

4. Wait until the next epoch change, **leaving both validator instances running**. At the start the next epoch, the new Validator signer will take over participation in consensus. 
5. Verify that the transition occurred correctly. Here are two ways to check:
  <!-- TODO: The following URL assumes that the user is running against the baklava network. This will need to be updated -->
  * Open `baklava-blockscout.celo-testnet.org/address/<NEW_VALIDATOR_SIGNER_ADDRESS>/validations` to confirm that validation are being signed.
  * Run `celocli validator:signed-blocks --signer $CELO_VALIDATOR_SIGNER_ADDRESS` with the new signer address. (Run `celocli validator:signed-block --help` if you are unfamiliar with this command)

  {% hint style="warning" %}
  The newly authorized keys will only take effect in the next epoch, so the instance operating with the old key must remain running until the end of the current epoch to avoid downtime.
  {% endhint %}

6. Shut down the validator instance with the now obsolete signer key.
