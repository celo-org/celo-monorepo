# Azure deployment templates

Templates to facilitate deployment of new signers on Azure.

## Prequisites

This setup assumes you've got the Azure CLI installed and that you've already created the Key Vault with the secret.

The container also requires a Log Analytics workspace id and key. To acquire those, [create a Log Analtyics workspace](https://docs.microsoft.com/en-us/azure/azure-monitor/learn/quick-create-workspace). If you won't be using Log Analytics, you'll need to cut those settings from the `container-template.json` file.

## Choose subscription and resource group

```bash
az account set --subscription {YOUR_SUB}
RESOURCE_GROUP={YOUR_RG}
```

## Deploy the database (postgres)

Fill in the `TODO` placeholder params in `db-parameters.json` and then run the following:

```bash
SERVER_NAME={YOUR_SERVER_NAME}

az deployment group create \
  --resource-group $RESOURCE_GROUP \
  --template-file db-template.json \
  --parameters @db-parameters.json \
  --parameters serverName=${SERVER_NAME}

az postgres db create \
  --name phoneNumberPrivacy \
  --resource-group $RESOURCE_GROUP \
  --server-name $SERVER_NAME

az postgres db list --resource-group $RESOURCE_GROUP --server-name $SERVER_NAME
```

To enable connection from the container instance, the default Connection Security settings of the database need to be changed to "Allow access to Azure services".
_TODO find a way to do this via the Azure CLI. Use the portal for now._

You'll also need to run the db migrations, either via a special docker command or by temporarily whitelisting your dev box (see parent [Readme](../README.md)).

## Deploy the container instance and give it keyvault perms

Fill in the `TODO` placeholder params in `container-parameters.json` and then run the following:

```bash
CONTAINER_NAME={YOUR_CONTAINER_NAME}

KEYVAULT_NAME={YOUR_VAULT_NAME}

az deployment group create \
  --resource-group $RESOURCE_GROUP \
  --template-file container-template.json \
  --parameters @container-parameters.json \
  --parameters containerName=$CONTAINER_NAME

SVC_PRINCIPAL_ID=$(az container show \
  --resource-group $RESOURCE_GROUP \
  --name $CONTAINER_NAME \
  --query identity.principalId --out tsv)

az keyvault set-policy \
  --name $KEYVAULT_NAME \
  --resource-group $RESOURCE_GROUP \
  --object-id $SVC_PRINCIPAL_ID \
  --secret-permissions get
```

## Deploy the front door for TLS Termination

```bash
CONTAINER_FQDN=$(az container show \
  --resource-group $RESOURCE_GROUP \
  --name $CONTAINER_NAME \
  --query ipAddress.fqdn --out tsv)

FRONTDOOR_NAME={YOUR_FRONTDOOR_NAME}

az deployment group create \
  --resource-group $RESOURCE_GROUP \
  --template-file frontdoor-template.json \
  --parameters frontdoors_name=$FRONTDOOR_NAME \
  --parameters backend_url=$CONTAINER_FQDN
```

## Monitoring

The logs from the container should flow automatically into the configured Log Analytics workspace.

To see errors, execute a query like the following, which you can save for convinient use in creating alerts:
`ContainerInstanceLog_CL | where Message contains "celo_pnp_err"`

Once you've saved the desired searches, create alerts to notify when errors occur or system resources drop too low (e.g. high CPU usage).
