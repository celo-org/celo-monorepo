# Validator Signer Key Rotation

As detailed in [the Celo account roles description page](detailed.md), Celo Locked Gold accounts can authorize separate signer keys for various roles such as voting or validating. This way, if an authorized signer key is lost or compromised, the Locked Gold account can authorize a new signer to replace the old one, without risking the key that custodies funds. This prevents losing an authorized signer key from becoming a catastrophic event. In fact, it is recommended as an operational best practice to regularly rotate keys to limit the impact of keys being silently compromised.

## Validator Signer Rotation

Because the Validator signer key is constantly in use to sign consensus messages, special care must be taken when authorizing a new Validator signer key. The following steps detail the recommended procedure for rotating the validator signer key of an active and elected validator:

1. Create a new Validator instance as detailed in the [Deploy a Validator](../../getting-started/mainnet/running-a-validator-in-mainnet.md#deploy-a-validator-machine) section of the getting started documentation. When using a proxy, additionally create a new proxy and peer it with the new validator instance, as described in the same document. Wait for the new instances to sync before proceeding. Please note that when running the proxy, the `--proxy.proxiedvalidatoraddress` flag should reflect the new validator signer address. Otherwise, the proxy will not be able to peer with the validator.

   Before proceeding to step 2 ensure there is sufficient time until the end of the epoch to complete key rotation.

2. Authorize the new Validator signer key with the Locked Gold Account to overwrite the old Validator signer key.

   ```bash
   # With $SIGNER_TO_AUTHORIZE as the new validator signer:

   # On the new validator node which contains the new $SIGNER_TO_AUTHORIZE key
   docker run -v $PWD:/root/.celo --rm -it $CELO_IMAGE --nousb account proof-of-possession $SIGNER_TO_AUTHORIZE $VALIDATOR_ACCOUNT_ADDRESS
   docker run -v $PWD:/root/.celo --rm -it $CELO_IMAGE --nousb account proof-of-possession $SIGNER_TO_AUTHORIZE $VALIDATOR_ACCOUNT_ADDRESS --bls
   ```

   1. If `VALIDATOR_ACCOUNT_ADDRESS` corresponds to a key you possess:

      ```bash
      # From a node with access to the key for VALIDATOR_ACCOUNT_ADDRESS
      celocli account:authorize --from $VALIDATOR_ACCOUNT_ADDRESS --role validator --signer $SIGNER_TO_AUTHORIZE --signature 0x$SIGNER_PROOF_OF_POSSESSION --blsKey $BLS_PUBLIC_KEY --blsPop $BLS_PROOF_OF_POSSESSION
      ```

   2. If `VALIDATOR_ACCOUNT_ADDRESS` is a `ReleaseGold` contract:

      ```bash
      # From a node with access to the beneficiary key of VALIDATOR_ACCOUNT_ADDRESS
      celocli releasegold:authorize --contract $VALIDATOR_ACCOUNT_ADDRESS --role validator --signer $SIGNER_TO_AUTHORIZE --signature 0x$SIGNER_PROOF_OF_POSSESSION --blsKey $BLS_PUBLIC_KEY --blsPop $BLS_PROOF_OF_POSSESSION
      ```

   Please note that the BLS key will change along with the validator signer ECDSA key on the node. If the new BLS key is not authorized, then the validator will be unable to process aggregated signatures during consensus, **resulting in downtime**. For more details, please read [the BLS key section of the Celo account role descriptions](detailed.md#authorized-validator-bls-signers).

3. **Leave all validator and proxy nodes running** until the next epoch change. At the start the next epoch, the new Validator signer should take over participation in consensus.
4. Verify that key rotation was successful. Here are some ways to check: 

   * Open `baklava-blockscout.celo-testnet.org/address/<SIGNER_TO_AUTHORIZE>/validations` to confirm that blocks are being proposed.
   * Open `baklava-celostats.celo-testnet.org` to confirm that your node is signing blocks.
   * Run `celocli validator:signed-blocks --signer $SIGNER_TO_AUTHORIZE` with the new validator signer address to further confirm that your node is signing blocks.

   The newly authorized keys will only take effect in the next epoch, so the instance operating with the old key must remain running until the end of the current epoch to avoid downtime.

5. Shut down the validator instance with the now obsolete signer key.

