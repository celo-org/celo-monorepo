# Configure your setup

You can take this terraform code as base for your setup. You need to configure the next parameters.

## Project parameters

The file [variables.tf](./variables.tf) contains most of the parameters used by the module. The first parameters to configure are the Google Cloud parameters. Please configure your GCP project, region and zone. Additionally you can configure, directly on [main.tf](./main.tf) the configuration for remote tfstate.

Most of the parameters are safe to go with the default value. You can configure the replica count for each service, but a good starting point would be 1 validator, 1 proxy, and 1 attestation service. Each validator service has an attached proxy service.

## Validator accounts

Using the [celocli](https://www.npmjs.com/package/@celo/celocli), run the next command to get credentials for the needed account:

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

The passwords referred in the variables will be used to import the accounts in the geth deployed (i.e.: The passwords have not to exist previously). They will keep your account safe if somebody access to the keystore file or if you want to unlock the account.

## Validator accounts

Once you have configured the variables with your accounts and parameters, proceed executing Terraform (gcloud cli must be correctly configured):

```bash
terraform init
teerraform plan
# Check the resources that will be created
terraform apply
```
