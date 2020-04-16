## Key Rotation

If a signing key is lost or compromised, the Locked Gold Account key can authorize a new signing key to replace the old one. This prevents losing a signing key from becoming a catastrophic event and it is strongly recommended to regularly rotate keys to limit the impact of an undiscovered compromise.

### Validator Signer Key Rotation

Because the Validator signing key is constantly in use to sign consensus messages, special care must be taken when authorizing a new Validator signer. The following steps detail the recommended procedure for rotating the validator signing key of an active and elected validator:

1. Create a new Validator instance as detailed in the [Deploy a Validator](../getting-started/running-a-validator-in-baklava.md#deploy-a-validator) section of the getting started documentation. When using a proxy, additionally create a new proxy and peer it with the new validator instance, as described in the same document. Wait for the new instances to sync before proceeding.

  {% hint style="warning" %}
  Before proceeding to step 2 ensure there is sufficient time until the end of the epoch to complete key rotation.
  {% endhint %}

2. Authorize the new Validator signer key with the Account key to overwrite the old Validator signer key.

  ```bash
  # With $KEY_TO_AUTHORIZE as the new validator signer key:

  # On the new validator node which contains the Locked Gold Account key
  docker run -v $PWD:/root/.celo --rm -it $CELO_IMAGE --nousb account proof-of-possession $KEY_TO_AUTHORIZE $LOCKED_GOLD_ACCOUNT
  docker run -v $PWD:/root/.celo --rm -it $CELO_IMAGE --nousb account proof-of-possession $KEY_TO_AUTHORIZE $LOCKED_GOLD_ACCOUNT --bls

  # On a node containing your Locked Gold Account key.
  celocli account:authorize --from $LOCKED_GOLD_ACCOUNT --role validator --signer $KEY_TO_AUTHORIZE --signature $KEY_TO_AUTHORIZE_PROOF_OF_POSSESSION --blsKey $BLS_PUBLIC_KEY --blsPop $BLS_PROOF_OF_POSSESSION
  ```

3. **Leave all validator and proxy nodes running** until the next epoch change. At the start the next epoch, the new Validator signer should take over participation in consensus.

4. Verify that key rotation was successful. Here are some ways to check:
  <!-- TODO: The following URL assumes that the user is running against the baklava network. This will need to be updated -->
  * Open `baklava-blockscout.celo-testnet.org/address/<KEY_TO_AUTHORIZE>/validations` to confirm that blocks are being proposed.
  * Open `baklava-celostats.celo-testnet.org` to confirm that your node is signing blocks.
  * Run `celocli validator:signed-blocks --signer $KEY_TO_AUTHORIZE` with the new validator signer address to further confirm that your node is signing blocks.

  {% hint style="warning" %}
  The newly authorized keys will only take effect in the next epoch, so the instance operating with the old key must remain running until the end of the current epoch to avoid downtime.
  {% endhint %}

5. Shut down the validator instance with the now obsolete signer key.
