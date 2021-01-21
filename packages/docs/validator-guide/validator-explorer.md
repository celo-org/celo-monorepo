# Validator Explorer

You can interact with the Validator Explorer that allows you to have a complete view of how the different validators are performing. This is one resource voters may use to find validator groups to vote for. The Validator Explorer tool is available in the following address: [https://celo.org/validators/explore/](https://celo.org/validators/explore/)

All of the existing validators and groups in the Celo network are included in this view. The default view shows all registered validator groups - if you click on any of the group names it will expand to show the validators affiliated with that group. You can also sort results by each column's value by clicking on the header field.

If you are looking to see how your validator is performing, you should first find the group your validator is affiliated with. Then you can click on the group name to see your validator and the rest of the validators affiliated with this group.

If you are running a validator group, one way to demonstrate your credibility to voters is claiming your validator badges by following the instructions [here](https://github.com/celo-org/website/blob/master/validator-badges/README.md).

A critical element of this explorer is the Validator Group name, which can help voters recognize organizations or active community members. This name is fetched from the `account` information registered on-chain for your validator and validator group. In order to combat name impersonation, a group can register a domain claim within their metadata, which you can read more about [here](https://github.com/celo-org/celo-monorepo/blob/master/packages/docs/celo-codebase/protocol/identity/metadata.md). This verification is done by adding a [TXT record](https://en.wikipedia.org/wiki/TXT_record) to their domain which includes a signature of their domain claim signed by their associated account. This claim is then verified by the validator explorer. Individual users may also verify a claim using `celocli account:get-metdata`.

For example, if a group was run by the owners of `example.com`, they may want to register their Validator Group with the name `Example`. The name does not need to be the same as the name of your domain, but for simplicity we do so here. To give credence to this name, they may want to add a DNS claim. They can do this by adding a DNS claim to their metadata, claiming the URL `example.com`, while simultaneously adding a `TXT Record` to `example.com` that includes this claim signed by their group address. Let’s go through this example in detail, using a `ReleaseGold` contract as our validator group.

Assuming you have already deployed your Validator Group via a `ReleaseGold` contract, you will need these environment variables set to claim your domain.

## Environment variables

| Variable | Explanation |
| :--- | :--- |
| CELO\_VALIDATOR\_GROUP\_RG\_ADDRESS | The `ReleaseGold` contract address for the Validator Group |
| CELO\_VALIDATOR\_RG\_ADDRESS | The `ReleaseGold` contract address for the Validator |
| CELO\_VALIDATOR\_SIGNER\_ADDRESS | The address of the validator signer authorized by the validator account |
| CELO\_VALIDATOR\_GROUP\_SIGNER\_ADDRESS | The address of the validator \(group\) signer authorized by the validator account |

First let's create the metadata file:

```text
# On your local machine
celocli account:create-metadata ./group_metadata.json --from $CELO_VALIDATOR_GROUP_RG_ADDRESS
```

Now we can set the group's name:

```text
# On your local machine
celocli releasegold:set-account --contract $CELO_VALIDATOR_GROUP_RG_ADDRESS --property name --value Example.com
```

Now we can generate a claim for the domain associated with this name `example.com`:

```text
# On your local machine
celocli account:claim-domain ./group_metadata.json --domain example.com --from $CELO_VALIDATOR_GROUP_SIGNER_ADDRESS
```

This will output your claim signed under the provided signer address. This output should then be recorded via a `TXT Record` on your desired domain, so in this case we should add a `TXT Record` to `example.com` with this signed output.

You can now view and simultaneously verify the claims on your metadata:

```text
# On your local machine
celocli account:show-metadata ./group_metadata.json
```

Take a look at the output and verify these claims look right to you. This tool also automatically verifies the signatures on claims you've added.

Once that record is added, we can then register this metadata under on our `Validator Group` account for external validation.

Before we do this, you may also want to associate some validators with this domain. The benefit of doing this is to extend your DNS claim to your validators as well, meaning your validators can also verifiably be associated with your domain. You could also do this by adding individual DNS claims for each validator, but this would require separate `TXT Record`s for each, which is inconvenient. Instead, you can simply associate the group and validators together under a single claim.

In order to do so, you will need to claim each validator address on your group's metadata. You will also need to claim your group account on each of your validator's metadata to complete the association. We will run through an example of a single validator now:

First lets claim the `validator` address from the `group` account:

```text
# On your local machine
celocli account:claim-account ./group_metadata.json --address $CELO_VALIDATOR_RG_ADDRESS --from $CELO_VALIDATOR_GROUP_SIGNER_ADDRESS
```

Now let's submit the corresponding claim from the `validator` account on the `group` account \(note: if you followed the directions to set up the attestation service, you may have already registered metadata for your validator. If that is the case, skip the steps to create the `validator`'s metadata and just add the account claim.\)

```text
# On your local machine
celocli account:create-metadata ./validator_metadata.json --from $CELO_VALIDATOR_RG_ADDRESS
celocli account:claim-account ./validator_metadata.json --address $CELO_VALIDATOR_GROUP_RG_ADDRESS --from $CELO_VALIDATOR_SIGNER_ADDRESS
```

And then host both metadata files somewhere reachable via HTTP. You can use a service like gist.github.com. Create two gists, each with the contents of the respective files and then click on the Raw buttton to receive the permalinks to the machine-readable file. If you had already registered a metadata URL for your `validator` you just need to update that registerd gist, so you can skip the `validator` metadata registration below.

Now we can register these URLs on each account:

```text
# On your local machine
celocli releasegold:set-account --contract $CELO_VALIDATOR_GROUP_RG_ADDRESS --property metaURL --value <VALIDATOR_GROUP_METADATA_URL>
celocli releasegold:set-account --contract $CELO_VALIDATOR_RG_ADDRESS --property metaURL --value <VALIDATOR_METADATA_URL>
```

If everything goes well users should be able to see your claims by running:

```text
# On your local machine
celocli account:get-metadata $CELO_VALIDATOR_GROUP_RG_ADDRESS
```

If everything went well, you should now have your group and validator associated with each other and with your associated domain!

