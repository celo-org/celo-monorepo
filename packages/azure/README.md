# Azure ARM Templates

## Current state

This set of ARM templates deploys an Azure infrastructure (_e.g._,
compute nodes, firewall rules, public IPs, secret management) for
running a validator system (validator node, proxy, attestation
service), and configures the software (_e.g._, `geth`,
attestation-service) on the compute nodes.

## Pre-built template

[mainTemplate.json](./mainTemplate.json) is a pre-built ARM template.

## Build

The JSON files in [components/](components/) define resources for the
validator network. You must merge them into a single JSON
`mainTemplate.json` file before deploying:

```
npm run build
```

## Usage

Pick a location and create a resource group:

```
LOCATION=... # e.g., westus2
GROUP=... # e.g., celoValidator
az group create \
   --name $GROUP --location $LOCATION
```

Deploy `mainTemplate.json`, specifying all the required parameters:

```
az group deployment create \
   --resource-group $GROUP \
   --name ${GROUP}-deployment \
   --template-file=mainTemplate.json \
   --parameters \
   proxyName=... \
   validatorName=... \
   adminUsername=... \
   adminPublicKey=... \
   attesterPostgreSQLUsername=... \
   attesterPostgreSQLPassword=... \
   validatorAccountAddress=... \
   proxyPublicKey=... \
   proxyPrivateKey=... \
   validatorPrivateKey=... \
   attesterAccountAddress=... \
   attesterPrivateKey=... \
   attesterTwilioAccountSID=... \
   attesterTwilioAuthToken=... \
   attesterTwilioMessageServiceSID=... \
```

You can delete all the services you created with:

```
az group delete --name $GROUP
```

### Required Parameters

| Parameter | Type | Description |
| --------- | -----| ----------- |
| `proxyName` | string | The proxy name for ethstats |
| `validatorName` | string | The validator name for ethstats |
| `adminUsername` | string | Admin username for SSH access |
| `adminPublicKey` | secureString | Admin public key for SSH access |
| `attesterPostgreSQLUsername` | string | Admin username for Attester PostgreSQL server |
| `attesterPostgreSQLPassword` | secureString | Admin password for Attester PostgreSQL server |
| `validatorAccountAddress` | string | Authorized validator signer etherbase account address |
| `proxyPublicKey` | string | Proxy enode public key |
| `proxyPrivateKey` | secureString | Proxy etherbase account private key |
| `validatorPrivateKey` | secureString | Authorized validator signer etherbase account private key |
| `attesterAccountAddress` | string | Attester account address |
| `attesterPrivateKey` | secureString | Attester account private key |
| `attesterTwilioAccountSID` | string | Attester Twilio account SID |
| `attesterTwilioAuthToken` | secureString | Attester Twilio authentication token |
| `attesterTwilioMessageServiceSID` | string | Attester Twilio message service SID |

### SSH access

The proxy and attester expose port 22 on their public IP addresses.

You can access the validator by starting an [Azure
Bastion](https://azure.microsoft.com/en-us/services/azure-bastion/) or
by attaching public IP address manually:

```
az network public-ip create \
   --name validatorPublicIpAddress \
   --resource-group $GROUP
az network nic ip-config update \
   --name ipconfig1 \
   --nic-name validatorNetworkInterface \
   --resource-group ${GROUP} \
   --public-ip-address validatorPublicIpAddress
```

## Future work

1.  Use UniqueString for naming issues with Key Value and PostgreSQL. <https://github.com/celo-org/celo-monorepo/issues/2920>
1.  Move validator, proxy, and attester to self-contained templates. <https://github.com/celo-org/celo-monorepo/issues/2921>
1.  Instructions for "Running a Validator on Azure". <https://github.com/celo-org/celo-monorepo/issues/2922>
1.  Tune the default values for resources sizes (*e.g.*, VM, disk, etc). <https://github.com/celo-org/celo-monorepo/issues/2923>
1.  Convert to an [Azure Managed
    Application](https://docs.microsoft.com/en-us/azure/azure-resource-manager/managed-applications/overview).
