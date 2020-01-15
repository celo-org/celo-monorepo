# Provide the next vars with a vars-file or modifying the default value
variable google {
  description = "The GCP Data"
  type        = map(string)

  default = {
    project = "my-project"
    region  = "us-west1"
    zone    = "us-west1-a"
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

  default = "baklava"
}

variable network_id {
  description = "The ethereum network ID"
  type        = number
  default     = 200110
}

variable ethstats_host {
  description = "Ethstats host to report data"
  type        = string
  default     = "baklava-ethstats.celo-testnet.org"
}

variable geth_node_docker_image {
  description = "The Celo Blockchain docker image"
  type        = map(string)

  default = {
    repository = "us.gcr.io/celo-testnet/celo-node"
    tag        = "baklava"
  }
}

variable replicas {
  description = "The replica number for each component"
  type        = map(number)

  default = {
    validator           = 1 # Also used for proxy
    txnode              = 0
    attestation_service = 1
  }
}

variable instance_types {
  description = "The instance type for each component"
  type        = map(string)

  default = {
    validator           = "n1-standard-2"
    proxy               = "n1-standard-2"
    txnode              = "n1-standard-1"
    attestation_service = "n1-standard-1"
  }
}

variable validator_signer_accounts {
  description = "The account data for the validator nodes"
  type        = map

  default = {
    account_addresses = [
      "0x45...",
    ]
    private_keys = [
      "7a2...",
    ]
    account_passwords = [
      "secret1",
    ]
  }
}

variable proxy_accounts {
  description = "The account data for the proxy nodes"
  type        = map

  default = {
    # account_address is not needed by the module. Can be left blank.
    account_addresses = [
      "0xF2...",
    ]
    private_keys = [
      "1b...",
    ]
    enodes = [
      "f8...",
    ]
  }
}

variable attestation_signer_accounts {
  description = "Etherbase address and private key to sign the attestations"
  type        = map

  default = {
    account_addresses = [
      "0x45...",
    ]
    private_keys = [
      "1b...",
    ]
  }
}

variable validator_name {
  type        = string
  description = "The validator Name for ethstats"
  default     = "myvalidator"
}

variable proxy_name {
  type        = string
  description = "The proxy Name for ethstats"
  default     = "myvalidator-proxy"
}

variable reset_geth_data {
  type        = bool
  description = "Specifies if the existing chain data should be removed while creating the instance"
  default     = false
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
    password = "mysecret"
  }
}

variable attestation_service_docker_image {
  description = "The attestation_service docker image"
  type        = map(string)

  default = {
    repository = "us.gcr.io/celo-testnet/celo-monorepo"
    tag        = "attestation-service-baklava"
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
    twilio_account_sid           = "ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
    twilio_messaging_service_sid = "MGXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
    twilio_auth_token            = "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
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
