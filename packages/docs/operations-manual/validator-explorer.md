# Validator Explorer
You can interact with the Validator Explorer that allows you to have a complete view of how the different validators are performing. This is one resource voters may use to find validator groups to vote for. The Validator Explorer tool is available in the following address:
https://dev.celo.org/validators/explore/

All the existing validators and groups in the Celo network are included in this view. The main view of the tool is organized showing the groups, if you click on any of the group names the affiliates of that group will be displayed. You have the option to sort the contents of the table clicking in the header of each column. 


If you are looking for how your validator is performing, you should be able to find the group to which your validator is affiliated, clicking on the group name will show your validator and the rest of affiliates of the same group.  

A critical element of this explorer is the Validator Group name, which can help voters recognize organisations or active community members. This name is fetched from the Validator Group’s associated `metadata`, which you can read more about [here](TODO:link). In order to prevent name impersonation, a group can register a domain claim within their metadata. This is done by adding a TXT record to their domain which includes a signature from their group account. This claim can then be verified by individual users by checking for this `TXT Record` on a group’s purported identity domain. The validator explorer will also perform this verification if a user adds this DNS claim.

For example, if a group was run by the owners of `example.com`, they may want to register their Validator Group with the name `Example.com`. Additionally, they may want to add a DNS claim so no one can impersonate their valuable brand name. They can do this by adding a DNS claim to their metadata, claiming the URL `example.com`, while simultaneously adding a `TXT Record` to `example.com` that includes this claim signed by their account address. Let’s go through this example in detail, using a `ReleaseGold` contract as our validator group.

Assuming you have already deployed your Validator Group via a `ReleaseGold` contract, you should have these environment variables set to claim your domain.



