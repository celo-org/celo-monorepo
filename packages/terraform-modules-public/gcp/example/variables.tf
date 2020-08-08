# Provide the next vars with a vars-file or modifying the default value
variable google {
  description = "The GCP Data"
  type        = map(string)

  default = {
    #update these in terraform.tfvars
    project = "MY_PROJECT_NAME"
    region  = "MY_REGION"
    zone    = "MY_ZONE"
  }
}

variable replicas {
  description = "The replica number for each component"
  type        = map(number)

  default = {
    validator           = 1 # Also used for proxy
    txnode              = 1
    attestation_service = 1
  }
}

variable instance_types {
  description = "The instance type for each component"
  type        = map(string)

  default = {
    validator           = "n1-standard-2"   #use n1-standard-2 or better for production
    proxy               = "n1-standard-2"   #use n1-standard-2 or better for production
    txnode              = "n1-standard-1"
    attestation_service = "n1-standard-1"
  }
}

variable network_name {
  description = "The name of the new VPC network created"
  type        = string

  default = "celo-network"
}

variable celo_env {
  description = "The celo network to connect with"
  type        = string

  default = "rc1"
}

variable network_id {
  description = "The ethereum network ID"
  type        = number
  default     = 42220
}

variable ethstats_host {
  description = "Ethstats host to report data"
  type        = string
  default     = "stats-server.celo.org"
}

variable geth_node_docker_image {
  description = "The Celo Blockchain docker image"
  type        = map(string)

  default = {
    repository = "us.gcr.io/celo-org/celo-node"
    tag        = "mainnet"
  }
}

variable validator_signer_accounts {
  description = "The account data for the validator nodes"
  type        = map

  default = {
    account_addresses = [
      "secret in terraform.tfvars",
    ]
    private_keys = [
      "secret in terraform.tfvars",
    ]
    account_passwords = [
      "secret in terraform.tfvars",
    ]
    release_gold_addresses = [
      "secret in terraform.tfvars",
    ]
  }
}

variable proxy_accounts {
  description = "The account data for the proxy nodes"
  type        = map

  default = {
  
    account_addresses = [
      "set in terraform.tfvars",
    ]
    private_keys = [
      "secret in terraform.tfvars",
    ]
    enodes = [
      "set in terraform.tfvars",
    ]
    account_passwords = [
      "set in terraform.tfvars",
    ]
  }
}

variable attestation_signer_accounts {
  description = "Etherbase address and private key to sign the attestations"
  type        = map

  default = {
    account_addresses = [
      "set in terraform.tfvars",
    ]
    private_keys = [
      "secret in terraform.tfvars",
    ]
    account_passwords = [
      "secret in terraform.tfvars"
    ]
  }
}

variable validator_name {
  type        = string
  description = "The validator Name for ethstats"
  default     = "YourValidator"
}

variable proxy_name {
  type        = string
  description = "The proxy Name for ethstats"
  default     = "Your-Proxy"
}

variable reset_geth_data {
  type        = bool
  description = "Specifies if the existing chain data should be removed while creating the instance"
  default     = true    #will restore chaindata from GCS if available
}

variable geth_verbosity {
  description = "Geth log level"
  type        = number
  default     = 3
}

# Attestation variables
variable attestation_service_db {
  description = "Configuration for the Postgres Cloud SQL DB"
  type        = map(string)

  default = {
    username = "celo"
    password = "secret in terraform.tfvars"
  }
}

variable attestation_service_docker_image {
  description = "The attestation_service docker image"
  type        = map(string)

  default = {
    repository = "us.gcr.io/celo-testnet/celo-monorepo"
    tag        = "attestation-service-mainnet"
  }
}

# SMS provider configuration
variable attestation_service_credentials {
  description = "Provider with the credentials for the SMS provider. Provider must be nexmo or twilio"
  type        = map(string)

  default = {
    sms_providers                = "twilio"
    nexmo_key                    = ""
    nexmo_secret                 = ""
    nexmo_blacklist              = ""
    twilio_account_sid           = "secret in terraform.tfvars"
    twilio_messaging_service_sid = "secret in terraform.tfvars"
    twilio_auth_token            = "secret in terraform.tfvars"
    twilio_blacklist             = ""
  }
}

##################
# The next variables have a default value are not intended to be changed if you do not have a reason for it
variable in_memory_discovery_table {
  description = "Geth parameter"
  type        = bool
  default     = false
}

variable block_time {
  description = "The ethereum network block time"
  type        = number
  default     = 5
}

variable istanbul_request_timeout_ms {
  description = "The ethereum request timeout"
  type        = number
  default     = 10000
}

variable geth_exporter_docker_image {
  description = "The geth exporter docker image"
  type        = map(string)

  default = {
    repository = "us.gcr.io/celo-testnet/geth-exporter"
    tag        = "ed7d21bd50592709173368cd697ef73c1774a261"
  }
}

#not yet implemented.  intent is to only install the stackdriver agents and inject the log exclusions if 'true'
variable "enable_stackdriver" {
  description = "If set to true, enable Stackdriver for monitoring and logging"
  type        = bool

  default = true
}

variable "stackdriver_logging_exclusions" {
  description = "List of objects that define logs to exclude on stackdriver"
  type = map(object({
    description  = string
    filter       = string
  }))

  default = {
    tf_gcm_infinite = {
      description  = "Ignore stackdriver agent errors re: infinite values"
      filter       = "resource.type = gce_instance AND \"write_gcm: can not take infinite value\""
    }
  
    tf_gcm_swap = {
      description  = "Ignore stackdriver agent errors re: swap percent/value"
      filter       = "resource.type = gce_instance AND \"write_gcm: wg_typed_value_create_from_value_t_inline failed for swap/percent/value! Continuing\""
    }

    tf_gcm_invalid_time = {
      description  = "Ignore stackdriver agent errors related to timing"
      filter       = "resource.type = gce_instance AND \"write_gcm: Unsuccessful HTTP request 400\" AND \"The start time must be before the end time\""
    }

    tf_gcm_transmit_unique_segments = {
      description  = "Ignore stackdriver agent errors re: transmit_unique_segments"
      filter       = "resource.type = gce_instance AND \"write_gcm: wg_transmit_unique_segment\""
    }

    tf_ver_certs = {
      description  = "Ignore Eth peer flapping warnings caused by peers disconnecting naturally when exceeding max_peers"
      filter       = "resource.type = gce_instance AND \"Error sending all version certificates\""
    }
  
    tf_peer_conns = {
      description  = "Ignore Eth peer connections. Constant flux"
      filter       = "resource.type = gce_instance AND \"Ethereum peer connected\""
    }
  }
}

variable "stackdriver_logging_metrics" {
  description = "List of objects that define COUNT (DELTA) logging metric filters to apply to Stackdriver to graph and alert on useful signals"
  type        = map(object({
    description = string
    filter      = string
  }))

  default = {

    tf_eth_handshake_failed = {
      description = "Ethereum peer handshake failed"
       filter      = "resource.type=gce_instance AND \"Ethereum handshake failed\""
    }

    tf_eth_genesis_mismatch = {
      description = "Client with different genesis block attempted connection"
      filter      = "resource.type=gce_instance AND \"Genesis mismatch\""
    }

    tf_eth_block_ingested = {
      description = "Ethereum block(s) ingested"
      filter      = "resource.type=gce_instance AND \"blocks\" AND \"Imported new chain segment\""
    }

    tf_eth_block_mined = {
      description = "Block mined"
      filter = "resource.type=gce_instance AND \"Successfully sealed new block\""
    }

    tf_eth_block_signed = {
      description = "Block signed"
      filter = "resource.type=gce_instance AND \"Commit new mining work\""
    }

    tf_eth_commit_old_block = {
      description = "Committed seal on old block"
      filter = "resource.type=gce_instance AND \"Would have sent a commit message for an old block\""
    }

    tf_validator_not_elected = {
      description = "Validator failed to be elected"
      filter = "resource.type=gce_instance \"Validator Election Results\" AND \"\\\"elected\\\":\\\"false\\\"\" AND NOT \"tx-node\""
    }

  }
}


variable "service_account_scopes" {
  description = "Scopes to apply to the service account which all nodes in the cluster will inherit"
  type        = list(string)

  #scope reference: https://cloud.google.com/sdk/gcloud/reference/alpha/compute/instances/set-scopes#--scopes
  #verify scopes: curl --silent --connect-timeout 1 -f -H "Metadata-Flavor: Google" http://169.254.169.254/computeMetadata/v1/instance/service-accounts/default/scopes
  default = [
    "https://www.googleapis.com/auth/monitoring.write",
    "https://www.googleapis.com/auth/logging.write",
    "https://www.googleapis.com/auth/cloud-platform"         #this gives r/w to all storage buckets, which is overly broad
    ]
}

variable "GCP_DEFAULT_SERVICE_ACCOUNT" {
  description = "gcp default service account for project, $projectid-compute@developer.gserviceaccount.com"
  type = string
}

variable "public_www_fqdn" {
  description = "fully qualified domain name for public website"
  type = string
}
