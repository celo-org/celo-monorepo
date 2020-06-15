# Terraform Celo Validator Stack

## Overview

[Terraform](https://www.terraform.io) is a tool by Hashicorp that allows developers to treat _"infrastructure as code"_, easying the management and repeatibility of the
infrastructure.
Infrastructure and all kind of cloud resources are defined in modules, and Terraform creates/changes/destroys when changes are applied.

Inside the [testnet](./testnet) folder you will find a module (and submodules) to create the setup for running a Celo Validator on AWS. The next logic resources can be created:

- `vpc` module for setting up a VPC with a public and private subnet on multiple availability zones. Validator nodes go in the private subnet while bastion, proxy, and attestation nodes go in the public subnet.
- `bastion` module for an SSH bastion node. For security purposes, this is the only node that accepts external SSH traffic. All other nodes only accept SSH from the bastion.
- `proxy` module for creating a Proxy connected to a validator
- `validator` module for deploying a Validator
- `attestation-service` for deploying the Attestation Service (https://docs.celo.org/getting-started/baklava-testnet/running-a-validator#running-the-attestation-service). Each attestation service will connect to the same multi-AZ RDS DB instance. Only Twilio is supported at this time.

## Operating System

All nodes run on the Ubuntu LTS 18.04 AMI. Running `terraform apply` will select the latest available AMI.

## Hardening & Security

Celo nodes will get provisioned with some recommended security settings from cLab's Security Audit team. Most of this hardening is done in `install-base.sh` and `final-hardening.sh`. 

## Requirements

Inside the [example](./example) folder you can find an example tf to use the module. Use that tf as base file for your deployment, modifying the account variables used for your convenience.
Alternatively you can take that tf files as base for customizing your deployment. Please take care specially about the VPC network configuration. The validators nodes deployed have not a public IP so the access to them is restricted. In order to provide outbound connection of these nodes the VPC network has to be configured with a NAT service allowing external traffic.
