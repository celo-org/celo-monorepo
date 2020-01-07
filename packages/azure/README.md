# Azure ARM Templates

## Current state

This set of ARM templates deploys an Azure infrastructure (_e.g._,
compute nodes, firewall rules, public IPs, secret management) for
running a validator system (validator node, proxy, attestation
service), and configures the software (_e.g._, `geth`,
attestation-service) on the compute nodes.

## Build

The JSON files in [components/](components/) define resources for the
validator network. You must merge them into a single JSON
`template.json` file before deploying:

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

Deploy `template.json`, specifying an admin username, a path to an
SSH public key, and your Azure User ID:

```
ADMIN_USER=...
PUBLIC_KEY=...
AZURE_USER_ID=... # You can get this via the Portal or with `az ad user list`
az group deployment create \
   --resource-group $GROUP \
   --name ${GROUP}-deployment \
   --template-file=template.json \
   --parameters adminPublicKey=@${PUBLIC_KEY} adminUsername=${ADMIN_USER} userObjectId=${AZURE_USER_ID}
```

Clean up your resources when you're done:

```
az group delete --name $GROUP
```

### Required Parameters

| Parameter | Type | Description |
| --------- | -----| ----------- |
| `userObjectId` | string | The object ID of a user, service principal or security group in the Azure Active Directory tenant for the vault. |
| `proxyName` | string | The proxy name for ethstats |
| `validatorName` | string | The validator name for ethstats |
| `adminUsername` | string | Admin username for SSH access |
| `adminPublicKey` | secureString | Admin public key for SSH access |
| `attesterPostgreSQLUsername` | string | Admin username for Attester PostgreSQL server |
| `attesterPostgreSQLPassword` | secureString | Admin password for Attester PostgreSQL server |
| `validatorAccountAddress` | string | Validator etherbase account address |
| `proxyPublicKey` | string | Proxy enode public key |
| `proxyPrivateKey` | secureString | Proxy etherbase account private key |
| `validatorPrivateKey` | secureString | Validator etherbase account private key |
| `validatorGethAccountSecret` | secureString | Validator etherbase account password |
| `attesterAccountAddress` | string | Attester account address |
| `attesterPrivateKey` | secureString | Attester account private key |
| `attesterGethAccountSecret` | secureString | Attester account password |
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

1.  Use suggested defaults for VM sizes and OS disk types.
1.  Convert to an [Azure Managed
    Application](https://docs.microsoft.com/en-us/azure/azure-resource-manager/managed-applications/overview).
