# Testnet

This creates a VM-based testnet with a bootnode and multiple validators.

## Overview

Each type of node (validator/bootnode/soon to be tx-node) is in its own module.
The GCP provider, network, firewall etc declarations are found in the `main.tf` file.

The script that is run immediately upon the startup of a VM instance is found in
a module's `startup.sh` file. This is where `geth` or `bootnode` is started,
and any setup work is performed. The variables required by these are typically
pulled from a `.env` file by `celotool` and passed to `terraform`.

Sometimes, if recreating an address right after deleting one, GCP will say
that the resource already exists and `terraform apply` will fail. In this case,
just wait a little bit and try again.
