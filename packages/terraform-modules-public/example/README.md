# Configure your setup

You can take this terraform code as base for your setup. You need to configure the next parameters.

## Project parameters

The file [variables.tf](./variables.tf) contains most of the parameters used by the module. The first parameters to configure are the Google Cloud parameters. Please configure your GCP project, region and zone. Additionally you can configure, directly on [main.tf](./main.tf) the configuration for remote tfstate.

Most of the parameters are safe to go with the default value. You can configure the replica count for each service, but a good starting point would be 1 validator, 1 proxy, and 1 attestation service. Each validator service has an attached proxy service.

## Required changes/parameters

In order to run this example module in your Google Cloud account, you need to follow the next steps:

- It is recommended to [create a new Project](https://cloud.google.com/resource-manager/docs/creating-managing-projects) for this, so every resource can be easily located.
- You need to [create a storage bucket](https://cloud.google.com/storage/docs/creating-buckets) for storing the Terraform remote state and lock. You can use also an existing one if you prefer. Then, update the storage bucket parameters in the [main.tf](./main.tf#L9-L12). Please take care that the account secrets will be stored in this terraform state/bucket, so proper bucket access policies may apply to safe those values.
- You need to create and configure the values for the etherbase needed accounts, as described in the [Ethereum accounts](#ethereum-accounts) section. Particularly, you will need the next accounts (for each instance/replica count):
  - An account for the Validator address. This account does not have to be submitted to the terraform module, and it is the account that must run for election as a validator.
  - An account for the validator instance. It is recommended to use a validator authorized signer address and submit to the module as `validator_signer_accounts` parameter. You can use the validator address here, but is recommended to use an authorized account instead.
  - An account for the proxy. This account is only used for having a fixed enode address, so we can configure correctly the validator<->proxy communication. Submit this address using the `proxy_accounts` parameter.
  - An account for the attestation service. Again, it is recommended to use a validator authorized signer address and submit to the module as `attestation_signer_accounts` parameter.
  - Additionally, you will need an account for the validation group each 5 validator instances. This account does not need to be submitted to terraform.
- The management of the accounts for election, authorizing, etc... has to be done using the `celocli` tool following the official [documentation](https://docs.celo.org/getting-started/baklava-testnet/running-a-validator). This steps can be done before of after deploying the terraform instances.
- Finally, update the rest of values as the `replicas`, `instance_types`, `validator_name` and `proxy_name` as you prefer.

## Ethereum accounts

The terraform module uses as input the different account parameters: public address, public key (that also corresponds to the enode address), and the private key. These accounts are submitted as an array variable, and you have to include inputs as much as instances of that service you are deploying. Although you can specify different number or validators and attestation service, makes more sense to deploy the same number of instances for both services. The number of proxy instances will be coupled always with the number of validator instances.

These accounts are imported as json keystore files in the nodes that need them using the `password` parameter configured in the variables.

It is important to check and get used to the [validator documentation](https://docs.celo.org/getting-started/baklava-testnet/running-a-validator). The addresses submitted here should corresponds `CELO_VALIDATOR_ADDRESS` and `ATTESTATION_SIGNER_ADDRESS` from that documentation, and have to be associated to your validator addresses with `celocli` following that documentation.

Using the [celocli](https://www.npmjs.com/package/@celo/celocli), run the next command to get credentials for the needed accounts:

```bash
$ celocli account:new
This is not being stored anywhere, so, save the mnemonic somewhere to use this account at a later point

mnemonic: history lemon flight ask umbrella emerge lawsuit bar tortoise demand oak brave together kiss dance filter yellow scheme check victory also daring reward uphold
privateKey: d497b2c97f5cd276c09e53b80ee5300ff37bbf6c6e9b814d908d2ab654e56137
publicKey: 041e9f487477b7d9f5c5818a1337601f05b790267ffc052aa98b49bea88a920bb2667aea5c99b47718da9198645669d6fa3643e547b9e2e1d386c4d9ee300db0cd
accountAddress: 0x2A809BeE654AAe41794838291390BC75BEd100BB
```

In the example, `0x2A809BeE654AAe41794838291390BC75BEd100BB` would be an account address, `d497b2c97f5cd276c09e53b80ee5300ff37bbf6c6e9b814d908d2ab654e56137` a private key, and the `publicKey` removing the two first characters (`1e9f487477b7d9f5c5818a1337601f05b790267ffc052aa98b49bea88a920bb2667aea5c99b47718da9198645669d6fa3643e547b9e2e1d386c4d9ee300db0cd` in the example) corresponds to the enode address.

You have to generate an account for each instance of each component you want to deploy. Please save this credentials securely so you can recover or access your account when you need.

The passwords referred in the variables will be used to import the accounts in the geth deployed (i.e.: the password are using to import the private keys as json keystore format required by geth). They will keep your account safe if somebody access to the keystore file or if you want to unlock the account.

## Running terraform

Once you have configured the variables with your accounts and parameters, proceed executing Terraform (gcloud cli must be correctly configured):

```bash
terraform init
teerraform plan
# Check the resources that will be created
terraform apply
```
