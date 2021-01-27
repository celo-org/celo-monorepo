# Terraform Celo Validator Stack for GCP

## Overview

[Terraform](https://www.terraform.io) is a tool by Hashicorp that allows developers to treat _"infrastructure as code"_, easying the management and repeatibility of the infrastructure.  Infrastructure and all kind of cloud resources are defined in modules, and Terraform creates/changes/destroys resources when changes are applied.

Inside the [testnet](./testnet) folder you will find a module (and submodules) to create the setup for running a Celo Validator on Google Cloud Platform. The following resources can be created via these modules:

- `proxy` module for creating a Geth Proxy which peers with other Celo nodes over the public Internet
- `validator` module for deploying a Validator which peers *only* with the proxy
- `tx-node` for deploying a transaction node (also known as full-node) which is used to support the attestation service, which connects to the RPC via the VPC
- `attestation-service` for deploying the Attestation Service (https://docs.celo.org/getting-started/baklava-testnet/running-a-validator#running-the-attestation-service)

The proxy, validator and tx-node services expose metrics for collection via Prometheus or similar.  See [example/metrics.md](./example/metrics.md) for more info.

## Stackdriver Logging, Monitoring and Alerting
Support for GCP's Stackdriver platform has been added, which makes it easy to get visibility into how your Celo validator stack is performing.

## Quick start
Look inside the [example](./example) folder and follow the steps in the README.md there to get started. 