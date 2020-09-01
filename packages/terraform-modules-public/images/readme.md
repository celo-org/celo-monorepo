### Celo Packer Images

Hashicorp Packer is a tool building machine images to ease deployment on various cloud platforms.

##### Prerequisites

- Packer ([installing packer](https://learn.hashicorp.com/tutorials/packer/getting-started-install))
- Cloud provider credentials for the provider you'd like to deploy on

##### Usage

Running `packer build node.json` is the easiest way to get started. This will build images for Azure, AWS and GCP by default. One handy flag is `-only`, ie. `packer build -only=gcp,aws node.json` will only build images for GCP and AWS.

Supported variables include:

- `region` (default: "eu-central-1")
- `celo_image` (default: "us.gcr.io/celo-org/celo-node:mainnet")
- `network_id` (default: "42220")
- `sync_mode` (default: "full")

For example, to build a light node for Alfajores we could do:

```
packer build \
  -var 'celo_image=us.gcr.io/celo-org/celo-node:alfajores' \
  -var 'network_id=44787' \
  -var 'sync_mode=light' \
  node.json
```
