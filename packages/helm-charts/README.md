# Helm Charts

This package contains [Helm](https://github.com/helm/helm#helm-in-a-handbasket) charts, which are templatized deployments of entire environments to Kubernetes clusters.

Use this to install helm chart:

```
$ brew unlink kubernetes-helm (if you already have some other version installed)
$ brew install helm
 ( this has to be updated if we upgrade tiller on out clusters )
$ brew switch kubernetes-helm 2.11.0
```

## [testnet](testnet/README.md)

A helm chart that deploys a test network with relevant services:

- Proof of Authority with sealer nodes to which you can port-forward to privileged RPCs
- Geth Transactions nodes to which you can connect with light clients
- Ethstats dashboard for monitoring
- Blockscout indexer pulling from a transaction node

## load-test

A helm chart that deploys a stateful set of clients submitting transactions to the transactions nodes. It writes the data to STDOUT which will then get picked up by our log export to BigQuery

Deploy load test with the following command:

```
celotooljs deploy initial load-test
        -e <env-name>
        --replicas <number-of-clients-which-would-simulate-the-load>
        --load-test-id <some-id-needed-to-distinguish-load-test-results>
        --faucet (needed when you deploy the load test first time, otherwise the clients which would simulate the load will not have enough tokens. could be omitted when deploying load test next times for the same network)
```

In order to stop the load test you could use the following command:
`celotooljs deploy destroy load-test -e <env-name>`

You could see load test logs and run some aggregation queries on them in [BigQuery](https://console.cloud.google.com/bigquery?project=celo-testnet) using the `load_test_data` dataset where all the tables are partitioned by date.

## blockscout

A helm chart that deploys [blockscout](https://github.com/poanetwork/blockscout), a block explorer. Can be deployed with

`celotooljs deploy initial blockscout -e ENV`

## pumba

A helm chart that deploys [pumba](https://github.com/alexei-led/pumba), that we use for network emulation on a cluster. It will read the parameters from the .env file to add network delay, rate limiting and packet loss to all network connection. Note that if you degrade performance by too much, it can actually impact the operations of the Kubernetes cluster itself. Can be deployed with `celotooljs deploy intial pumba -e ENV`

**WARNING**: Pumba applies to the whole Kubernetes cluster. Only use it on dedicated clusters.

## chaoskube

We just just use `stable/chaoskube` with parameters read from the .env file. Chaoskube will just terminate random pods.

# New Kubernetes Environment Standup Guide

These steps set up the Kubernetes components of a new environment.

There's an [architecture diagram](https://docs.google.com/presentation/d/1kIxqXddOS4ewnxhxyMbl9xRcE_CCld_JTBwn3HmnvQc/edit#slide=id.p) you can refer to.

First, make sure you've done the [one-time GCP setup steps](https://github.com/celo-org/bootnode/tree/master/engsetup#one-time-setup-for-google-cloud-platform).

Set the project you will work on:

```console
export PROJECT_NAME=celo-testnet
gcloud config set project $PROJECT_NAME
```

We use `celo-testnet` for all non-production environments, and `celo-production` for production environments.

Then create a new Kubernetes cluster:

```console
export CLUSTER_NAME=xxx
export CLUSTER_ZONE=us-west1-a  # or southamerica-east1-a for Argentina
gcloud container clusters create $CLUSTER_NAME --zone $CLUSTER_ZONE
```

> Usually CLUSTER_NAME should be the same as the Helm release and namespace names (RELEASE_NAME and NAMESPACE_NAME) and we only have one environment (i.e one Helm chart release) per Kubernetes cluster.

Switch to using it:

```console
gcloud container clusters get-credentials $CLUSTER_NAME --project $PROJECT_NAME --zone $CLUSTER_ZONE

kubectl config current-context
```

Deploy [Tiller](https://github.com/helm/helm#helm-in-a-handbasket) to the cluster, so that you can actually deploy helm charts to it.

```console
kubectl create serviceaccount tiller --namespace=kube-system && \
kubectl create clusterrolebinding tiller --clusterrole cluster-admin \
--serviceaccount=kube-system:tiller && \
helm init --service-account=tiller
```

Install kube-lego with the nginx-ingress controller for the new cluster:

```console
helm install --name kube-lego-release stable/kube-lego --set config.LEGO_EMAIL=n@celo.org --set rbac.create=true --set rbac.serviceAccountName=kube-lego --set config.LEGO_URL=https://acme-v01.api.letsencrypt.org/directory

helm install --name nginx-ingress-release stable/nginx-ingress
```

Then you should also deploy Helm charts to monitor the Kubernetes cluster's metrics and export them to Stackdriver:

```console
helm install --name kube-state-metrics stable/kube-state-metrics --set rbac.create=true

helm install --name kube-state-metrics-prometheus-to-sd \
  --set "metricsSources.kube-state-metrics=http://kube-state-metrics.default.svc.cluster.local:8080"  stable/prometheus-to-sd
```

We need to create a service account for the Blockscout indexer and web instances to use to connect to the Cloud SQL database that gets created by `celotooljs`.

First, create a [new service account](https://console.cloud.google.com/iam-admin/serviceaccounts/create?project=celo-testnet), and give it permissions
"Cloud SQL Client".

Download the key in JSON format to your local machine, and then upload the credential to the cluster:

```
`kubectl create secret generic blockscout-cloudsql-credentials --from-file=credentials.json=[PROXY_KEY_FILE_PATH]`)
```

Install the SSD storage class so the Helm chart can specify Geth to use SSDs:

```
kubectl apply -f testnet/ssdstorageclass.yaml
```

Right now, we need to manually add A records for `<RELEASE>-blockscout` and `<RELEASE>-ethstats` to `celo-testnet.org`. Do it [here](https://domains.google.com/registrar?hl=en#z=a&d=25067079,celo-testnet.org&chp=z,d) or ask a Google Domains admin.

Assuming you are still on the right cluster, You can find the external IP address at:

```
kubectl get services nginx-ingress-release-controller
```

Head over to [Google Cloud Console GKE clusters page](https://console.cloud.google.com/kubernetes/list?project=celo-testnet) and open your new cluster. Click Edit and make a few tweaks to the cluster:

- Add the following labels:

  - `environment` - values usually `integration`, `staging`, `production`
  - `envtype` - values usually `nonproduction` or `production`
  - `envinstance` - unique identifer for this environment

- Check "Stackdriver Logging" and "Stackdriver Monitoring" are enabled.

- Upgrade Kubernetes if necessary.

- Turn on Autoscaling for the node pool and set a range of sizes (right now: min 3 to max 8 works well). Upgrade Kubernetes on it.

- Create a second node pool with identical settings to the first.

Finally, create a new environment file:

```
# cd $CELO_ROOT/celo-monorepo/
cp .env .env.$CLUSTER_NAME
```

And update it for the details above.

Now we can deploy the Helm chart release by following the instructions here.
TODO.
