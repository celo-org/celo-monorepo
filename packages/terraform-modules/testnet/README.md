# Testnet

This creates a VM-based testnet with a bootnode and multiple validators.

## Overview

Each type of node (validator/bootnode/tx-node) is in its own module.
A separate module `tx-node-load-balancer` defines an internal TCP load balancer
for ports 8545 and 8546. This is so Blockscout on the same VPC can reach the tx-nodes.
The GCP provider, network, firewall etc declarations are found in the `main.tf` file.

The script that is run immediately upon the startup of a VM instance is found in
a module's `startup.sh` file. This is where `geth` or `bootnode` is started,
and any setup work is performed. The variables required by these are typically
pulled from a `.env` file by `celotool` and passed to `terraform`.

Sometimes, if recreating an address right after deleting one, GCP will say
that the resource already exists and `terraform apply` will fail. In this case,
just wait a little bit and try again.

## Setup

A few infrastructure assumptions are made by this module and `celotool`:

1.  Google Cloud Platform is used
1.  The environment variable `GOOGLE_APPLICATION_CREDENTIALS` is set to the path
    of a JSON key file with the credentials that will be used by Terraform.
1.  The GCP project used is the value of `TESTNET_PROJECT_NAME` in the environment's `.env` file
1.  A bucket called `celo_tf_state` has been manually created. This is where the Terraform
    remote backends are. Nothing very sensitive is stored in here, but it should be private.
1.  A bucket called `celo-testnet-secrets` has been manually created. This is used to store
    sensitive secrets that are uploaded by celotool and downloaded at startup from inside
    `startup.sh`. This is to ensure that secrets are not stored in the state files.

## Google Cloud Permissions Needed

A service account must be able to create/list/modify/delete networks,
firewalls, instances, objects, addresses, and disks.

For C-Labs employees, a Google Cloud role `Terraform Testnet Admin` has been
created.
