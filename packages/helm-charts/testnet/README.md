# Testnet Helm Chart

This helm chart allows you to deploy testnets, on which you can deploy smart contracts or interact with our app. See the README at the parent folder for more general Helm

`NAMESPACE_NAME` is the Kubernetes namespace all Kubernetes primitives are getting deployed to. This isolates various networks from each other. `RELEASE_NAME` is the helm chart release name, i.e. a consistent name that refers to the primitives as a group. By convention, `NAMESPACE_NAME` and `RELEASE_NAME` should be the same name and just use [a-z0-9\-] characters so that most scripts you just pass `NAME` instead of having to specify all the names separately. However if you would like to, you can generally use the `-r` or `-n` flags to do so.

(These commands assume your current path is at packages/helm-charts )

Deploy a release of the helm chart by running the following command:

```bash
export NAME=my-name
./testnet/scripts/create-network.sh -r $NAME
```

> if you are deploying to non-development envs(i.e. testnet_dev, testnet_staging or testnet_prod), pass also `celo-testnet` as domain name
> or the ethstats domain will not resolve properly: `./testnet/scripts/create-network.sh -r $NAME -d celo-testnet`

You can also upgrade an environment by passing the `-u` flag:

```bash
export NAME=my-name
./testnet/scripts/create-network.sh -u -r $NAME
```

The output of the above should have more interesting instructions regarding getting info of the nodes you'll likely want to connect to. You'll have to wait a minute or two for the loadbalancers to provision. You can also use a script to produce the necessary connection info for the mobile package.

```bash
./testnet/scripts/write-mobile-network-config.sh $NAME
```

If you need to connect via RPC, you can run:

```bash
./testnet/scripts/port-forward.sh $NAME
```

All the port-forward script really does is find the pod under the `gethminer1` service of your release and port-forwards it to your machine.

So a contract deploy as per [protocol README](../../protocol/README.md) would look like:

```bash
# pwd: .../packages/protocol
# portforward is active
# Don't forget to set $NAME in the new terminal
yarn run init-network -n $NAME
```

You can then share the contract build artifacts by running:

```bash
yarn run upload-artifacts -n $NAME
```

This will upload the build artifacts to the cluster, and can be consequently downloaded via:

```bash
yarn run download-artifacts -n $NAME
```

This will download the build artifacts to your build folder, as if you deployed the contracts yourself.

You should be sure to update the appropriate yaml file in `packages/blockchain-api/` with the addresses of the GoldToken and StableToken proxy contracts.

The last step is to update the contract ABIs and addresses for use in the mobile app as per [mobile README](../../mobile/README.md)

```bash
# pwd: .../packages/mobile
yarn run update-contracts --testnets=testnet_prod,integration,argentinastaging,argentinaproduction,$NAME
```

After you are done, you can (and should after usage) teardown your testnet by running:

```console
./testnet/scripts/destroy-network.sh -r $NAME
```

## Geth Docker Images

Docker images for Geth (and other services) are built automatically by [Google Cloud Build](https://console.cloud.google.com/cloud-build/triggers?organizationId=54829595577&project=celo-testnet) when a PR is raised or merged to master.

To try out local changes to Geth, use `celotool`. Alternatively, to deploy a dev version of Geth to a Helm release without pushing commits, you can build your own Docker image locally.

First, install [Docker](https://store.docker.com/editions/community/docker-ce-desktop-mac). You'll need to create an account with Docker to do this. It's a bit painful to install Docker via Homebrew.

Then run:

```console
cd $CELO/geth
make clean && make all
./dockerize_testnet.sh -p PROJECT_ID -t TAG
```

where TAG is any old string.

For a Docker build reflecting an actual commit of geth we tend to use the commit hash:

```console
git rev-parse HEAD
```

This script will produce and upload two Docker images (one for Geth regular nodes, and one for the Bootnode) to the [GCP Container Registry](https://console.cloud.google.com/gcr/images/celo-testnet/GLOBAL/testnet-geth) under `gcr.io/PROJECT_ID/testnet-geth:TAG`.

You can then start a network with your custom builds by modifying the `geth/image/repository/tag` value in `values.yaml`. (Alternatively you can pass the values in your `helm install` command with `--set geth.miner.tag=TAG` but that makes it harder to use `create-network` and other scripts).

When you are finally happy with your changes to geth:

- Raise a PR and get that reviewed and merged
- Identify the tag for the latest Docker image built
- Update the value in the geth.miner.tag field in `values.yaml` and raise a PR

## Configuration

The following table lists the configurable parameters of the vault chart and their default values.

| Parameter                   | Description                                                        | Default                                |
| --------------------------- | ------------------------------------------------------------------ | -------------------------------------- |
| `imagePullPolicy`           | Container pull policy                                              | `IfNotPresent`                         |
| `nodeSelector`              | Node labels for pod assignmen                                      |                                        |
| `bootnode.image.repository` | bootnode container image to use                                    | `ethereum/client-go`                   |
| `bootnode.image.tag`        | bootnode container image tag to deploy                             | `alltools-v1.7.3`                      |
| `ethstats.image.repository` | ethstats container image to use                                    | `ethereumex/eth-stats-dashboard`       |
| `ethstats.image.tag`        | ethstats container image tag to deploy                             | `latest`                               |
| `ethstats.webSocketSecret`  | ethstats secret for posting data                                   | `my-secret-for-connecting-to-ethstats` |
| `ethstats.service.type`     | k8s service type for ethstats                                      | `LoadBalancer`                         |
| `geth.image.repository`     | geth container image to use                                        | `ethereum/client-go`                   |
| `geth.image.tag`            | geth container image tag to deploy                                 | `v1.7.3`                               |
| `geth.tx.replicaCount`      | geth transaction nodes replica count                               | `1`                                    |
| `geth.miner.replicaCount`   | geth miner nodes replica count                                     | `1`                                    |
| `geth.miner.account.secret` | geth account secret                                                | `my-secret-account-password`           |
| `geth.genesis.networkId`    | Ethereum network id                                                | `1101`                                 |
| `geth.genesis.difficulty`   | Ethereum network difficulty                                        | `0x0400`                               |
| `geth.genesis.gasLimit`     | Ethereum network gas limit                                         | `0x8000000`                            |
| `geth.account.address`      | Geth Account to be initially funded and deposited with mined Ether |                                        |
| `geth.account.privateKey`   | Geth Private Key                                                   |                                        |
| `geth.account.secret`       | Geth Account Secret                                                |                                        |
