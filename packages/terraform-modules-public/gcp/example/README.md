# Overview

This repository allows you to run a fully functional Celo validator setup on mainnet, including the following instances:
* a geth proxy that peers with other nodes over the Internet, and is exposed to the Internet
* a validator ithat peers only with the proxy (via VPC), has no public IP address
* a txnode that peers with other nodes over the Internet, and exposes an RPC interface for the attestation service via the VPC
* an attestation service that is exposed to the Internet

# Initial Configuration

## Install gcloud cli
### OSX
Via brew cask:
```brew cask install google-cloud-sdk```
or follow the [Google Docs](https://cloud.google.com/sdk/docs/quickstart-macos) for other install methods

## Create a new GCP project for Terraform with bootstrap.sh
Run bootstrap.sh, which will create a skeleton gcloud.env file.  Now open gcloud.env in an editor, and set the following variables:
```bash
export TF_VAR_org_id=YOUR_ORG_ID
export TF_VAR_billing_account=YOUR_BILLING_ACCOUNT
export TF_VAR_project=NAME_OF_PROJECT_TO_BE_CREATED_BY_THIS_SCRIPT
export TF_CREDS=~/.config/gcloud/${USER}-${TF_VAR_project}.json     #cred file will be created by bootstrap.sh
export GOOGLE_APPLICATION_CREDENTIALS=${TF_CREDS}
export GOOGLE_PROJECT=${TF_VAR_project}
```

Once you have entered these variables, save the file and run bootstrap.sh again.  This will do everything required to:
* Create a new project within your GCP organization
* Create an IAM service account for Terraform, with permissions required to create/modify/destroy resources *only within this project*
* Create GCP keys for the Terraform service account to use, and download them to the filesystem
* Grants the following permissions *within this project* to the Terraform service account 
   roles/storage.admin
   roles/logging.configWriter
   roles/editor
   roles/monitoring.admin
* Enables the following GCP API's *within this project*
   cloudresourcemanager.googleapis.com
   cloudbilling.googleapis.com
   iam.googleapis.com
   compute.googleapis.com
   serviceusage.googleapis.com
   stackdriver.googleapis.com
   clouderrorreporting.googleapis.com
* Creates a GCS bucket for storing Terraform state.  Note that the Terraform state contains sensitive information, so do not expose this bucket publicly.  TODO: ensure that the GCP default service account for the project has no access to this bucket, to avoid compromise of a lower security context node (eg txnode or proxy) from compromising a higher security node (eg validator).


## Configure secrets in terraform.tfvars
Copy terraform.tfvars.example to terraform.tfvars, and edit as necessary to provide the required secrets.  The .example file includes descriptions of each secret.  terraform.tfvars is excluded in .gitignore, so be sure to safely back this up into a password management system.


## (Optional) Configure variables.tf
The file [variables.tf](./variables.tf) contains most of the (non sensitive) parameters used by the module, that can safely be checked into source control.

The parameters in this file have sane defaults. You can configure the replica count for each service, but a good starting point would be 1 validator, 1 proxy, and 1 attestation service. Each validator service has an attached proxy service.  Note that if you set the txnode count to 0, the modules will fail, due to a bug not yet fixed.


## Ethereum accounts

The terraform module uses as input the different account parameters: public address, public key (that also corresponds to the enode address), and the private key. These accounts are submitted as an array variable, and you have to include inputs as much as instances of that service you are deploying. Although you can specify different number or validators and attestation service, it makes more sense to deploy the same number of instances for both services. The number of proxy instances will be matched 1:1 with the number of validator instances.

These accounts are imported by geth as json keystore files in the nodes that need them using the `password` parameter configured in the variables.

It is important to be familiar with the [validator documentation](https://docs.celo.org/getting-started/mainnet/running-a-validator-in-mainnet). The addresses submitted here should corresponds `CELO_VALIDATOR_SIGNER_ADDRESS` and `ATTESTATION_SIGNER_ADDRESS` from that documentation, and have to be associated to your validator addresses with `celocli` following that documentation.

Using the [celocli](https://www.npmjs.com/package/@celo/celocli), run the following command to get credentials for the required accounts:

```bash
$ celocli account:new
This is not being stored anywhere, so, save the mnemonic somewhere to use this account at a later point

mnemonic: history lemon flight ask umbrella emerge lawsuit bar tortoise demand oak brave together kiss dance filter yellow scheme check victory also daring reward uphold
privateKey: d497b2c97f5cd276c09e53b80ee5300ff37bbf6c6e9b814d908d2ab654e56137
publicKey: 041e9f487477b7d9f5c5818a1337601f05b790267ffc052aa98b49bea88a920bb2667aea5c99b47718da9198645669d6fa3643e547b9e2e1d386c4d9ee300db0cd
accountAddress: 0x2A809BeE654AAe41794838291390BC75BEd100BB
```

In the example, `0x2A809BeE654AAe41794838291390BC75BEd100BB` would be an account address, `d497b2c97f5cd276c09e53b80ee5300ff37bbf6c6e9b814d908d2ab654e56137` a private key, and the `publicKey` removing the two first characters (`1e9f487477b7d9f5c5818a1337601f05b790267ffc052aa98b49bea88a920bb2667aea5c99b47718da9198645669d6fa3643e547b9e2e1d386c4d9ee300db0cd` in the example) corresponds to the enode address.  (TODO: there is a bug in celocli which is truncating the public key, making it presently unusable for generating the enode deterministically)

You have to generate an account for each instance of each component you want to deploy.

The passwords referred in the variables will be used by geth to import the accounts into the json keystore on the filesystem of the deployed instance.

## Running terraform

Once you have configured the variables with your accounts and parameters, proceed with initializing Terraform and deploy your infrastructure:

```bash
terraform init
teerraform plan
# Check the resources that will be created
terraform apply
```

## Logging and Monitoring

### Logging
Stackdriver exclusions are configured to silently drop noisy log entries from geth.  Logging metrics are created for events critical to running Celo validator infrastructure, including proposing (mining) blocks and signing blocks proposed by others.  Genesis mismatches and p2p network failures are also instrumented.

### Dashboards
Terraform's GCP provider doesn't presently support management of dashboard resources.  However, you can use the gcloud SDK to import a Celo dashboard as follows:
```gcloud monitoring dashboards create --config-from-file=dashboards/hud.json```

### Alerting
Stackdriver can be easily configured with notification channels, and alerts can be added for important situations, such as your validator failing to mine or sign blocks within a period of time.  TODO: add support for [alert policies](https://www.terraform.io/docs/providers/google/r/monitoring_alert_policy.html) and [notification channels](https://www.terraform.io/docs/providers/google/r/monitoring_notification_channel.html).  These are not yet implemented in this module.


## Areas for improvement

- Make stackdriver optional (use variable "enable_stackdriver") to control installation of the agents and injection of the exclusions.  This is super powerful, but perhaps not everybody who is in GCP will want to use Stackdriver
- Lock down Storage such that the default creds on all instances do NOT have ability to pull terraform state
