# Validator Explorer
You can interact with the Validator Explorer that allows you to have a complete view of how the different validators are performing. This is one resource voters may use to find validator groups to vote for. The Validator Explorer tool is available in the following address:
https://dev.celo.org/validators/explore/

All the existing validators and groups in the Celo network are included in this view. The main view of the tool is organized showing the groups, if you click on any of the group names the affiliates of that group will be displayed. You have the option to sort the contents of the table clicking in the header of each column. 


If you are looking for how your validator is performing, you should be able to find the group to which your validator is affiliated, clicking on the group name will show your validator and the rest of affiliates of the same group.  

A critical element of this explorer is the Validator Group name, which can help voters recognize organisations or active community members. This name is fetched from the Validator Group’s associated `metadata`, which you can read more about [here](https://github.com/celo-org/celo-monorepo/blob/master/packages/docs/celo-codebase/protocol/identity/metadata.md). In order to prevent name impersonation, a group can register a domain claim within their metadata. This is done by adding a TXT record to their domain which includes a signature from their group account. This claim can then be verified by individual users by checking for this `TXT Record` on a group’s purported identity domain. The validator explorer will also perform this verification if a user adds this DNS claim.

For example, if a group was run by the owners of `example.com`, they may want to register their Validator Group with the name `Example.com`. Additionally, they may want to add a DNS claim so no one can impersonate their valuable brand name. They can do this by adding a DNS claim to their metadata, claiming the URL `example.com`, while simultaneously adding a `TXT Record` to `example.com` that includes this claim signed by their account address. Let’s go through this example in detail, using a `ReleaseGold` contract as our validator group.

Assuming you have already deployed your Validator Group via a `ReleaseGold` contract, you will need these environment variables set to claim your domain.

### Environment variables

| Variable                             | Explanation                                                                                                                          |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| CELO_VALIDATOR_GROUP_RG_ADDRESS         | The `ReleaseGold` contract address for the Validator Group                                                                                          |
| CELO_VALIDATOR_RG_ADDRESS         | The `ReleaseGold` contract address for the Validator                                                                                                 |
| CELO_VALIDATOR_SIGNER_ADDRESS        | The address of the validator signer authorized by the validator account                                                              |
| CELO_VALIDATOR_GROUP_SIGNER_ADDRESS  | The address of the validator (group) signer authorized by the validator account

First let's create the metadata file:

```
# On your local machine
celocli account:create-metadata ./group_metadata.json --from $CELO_VALIDATOR_GROUP_RG_ADDRESS
```

Now we can set the group's name:

```
# On your local machine
celocli releasegold:set-account --contract $CELO_VALIDATOR_GROUP_RG_ADDRESS --property name --value Example.com
```

Now we can generate a claim for the domain associated with this name `example.com`:

```
# On your local machine
celocli account:claim-domain ./group_metadata.json --domain example.com --from $CELO_VALIDATOR_GROUP_SIGNER_ADDRESS
```

This will output your claim signed under the provided signer address. This output should then be recorded via a `TXT Record` on your desired domain, so in this case we should add a `TXT Record` to `example.com` with this signed output.

Once that record is added, we can then register this metadata under on our `Validator Group` account for external validation.

Before we do this, you may also want to associate some validators with this domain. In order to do so, you will need to claim each validator address on your group's metadata. You will also need to claim your group account on each of your validator's metadata to complete the association. We will run through an example of a single validator now:

First lets claim the `validator` address from the `group` account:

```
# On your local machine
celocli account:claim-account ./group_metadata.json --address $CELO_VALIDATOR_RG_ADDRESS --from $CELO_VALIDATOR_GROUP_SIGNER_ADDRESS
```

Now let's submit the corresponding claim from the `validator` account on the `group` account (note: if you followed the directions to set up the attestation service, you may have already registered metadata for your validator. If that is the case, skip the steps to create the `validator`'s metadata and just add the account claim.)

```
# On your local machine
celocli account:create-metadata ./validator_metadata.json --from $CELO_VALIDATOR_RG_ADDRESS
celocli account:claim-account ./validator_metadata.json --address $CELO_VALIDATOR_GROUP_RG_ADDRESS --from $CELO_VALIDATOR_SIGNER_ADDRESS
```

And then host both metadata files somewhere reachable via HTTP. You can use a service like gist.github.com. Create two gists, each with the contents of the respective files and then click on the Raw buttton to receive the permalinks to the machine-readable file. If you had already registered a metadata URL for your `validator` you just need to update that registerd gist, so you can skip the `validator` metadata registration below. 

Now we can register these URLs on each account:

```
# On your local machine
celocli releasegold:set-account --contract $CELO_VALIDATOR_GROUP_RG_ADDRESS --property metaURL --value <VALIDATOR_GROUP_METADATA_URL>
celocli releasegold:set-account --contract $CELO_VALIDATOR_RG_ADDRESS --property metaURL --value <VALIDATOR_METADATA_URL>
```

If everything goes well users should be able to see your claims by running:

```
# On your local machine
celocli account:get-metadata $CELO_VALIDATOR_GROUP_RG_ADDRESS
```

If everything went well, you should now have your group and validator associated with each other and with your associated domain!
