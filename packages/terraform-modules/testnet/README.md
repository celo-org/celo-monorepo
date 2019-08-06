# Terraform Testnets

## Overview

Terraform is a tool that allows developers to treat "infrastructure as code."
Infrastructure is defined in code, and Terraform creates/changes/destroys
when changes are applied.

Each type of node (validator/tx-node/bootnode) is in its own module. The GCP
address and instance declarations are found in its `main.tf` file. The script
that is run immediately upon the startup of the VM instance is found in its
`startup.sh` file. Variables that are required by both those files that are
specific to the module are found in `variables.tf`.

## Local Setup

1.  Download Terraform https://www.terraform.io/downloads.html
1.

Sometimes, if recreating an address right after deleting one, GCP will say
that the resource already exists and `terraform apply` will fail. In this case,
just wait a little bit and try again.

`terraform apply --var-file=secrets.tfvars`

TODO:
health checks?
figure out best way to handle secrets?
is it enough to just hide the state in google storage?
