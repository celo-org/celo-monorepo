# Terraform Celo Validator Stack

## Overview

[Terraform](https://www.terraform.io) is a tool by Hashicorp that allows developers to treat _"infrastructure as code"_, easying the management and repeatibility of the
infrastructure.
Infrastructure and all kind of cloud resources are defined in modules, and Terraform creates/changes/destroys when changes are applied.

Inside the [testnet](./testnet) folder you will find a module (and submodules) to create the setup for running a Celo Validator on Google Cloud Platform. The next logic resources can be created:

- Proxy module for creating a Geth Proxy connected to a validator
- Validator module for deploying a Validator
- TX Node for deploying a transmission node, thought to expose the rpc interface and allows interaction with the network easily
- Attestation service for deploying the Attestation Service (https://docs.celo.org/getting-started/baklava-testnet/running-a-validator#running-the-attestation-service)

## Requirements

Inside the [example](./example) folder you can find an example tf to use the module. We recommend you to use that tf as base file for your deployment, modifying the account variables used for your convenience.
Alternatively you can take that tf files as base for customizing your deployment. Please take care specially about the VPC network configuration. The validators nodes deployed have not a public IP so the access to them is restricted. In order to provide outbound connection of these nodes the VPC network has to be configured with a NAT service allowing external traffic.
