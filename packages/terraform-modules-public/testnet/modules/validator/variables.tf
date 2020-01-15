variable block_time {
  type        = number
  description = "Number of seconds between each block"
}

variable celo_env {
  type        = string
  description = "Name of the testnet Celo environment"
}

variable instance_type {
  description = "The instance type"
  type        = string
  default     = "n1-standard-2"
}

variable ethstats_host {
  type        = string
  description = "Ethstats url or IP address"
}

variable genesis_content_base64 {
  type        = string
  description = "Content of the genesis file encoded in base64"
}

variable geth_exporter_docker_image_repository {
  type        = string
  description = "Repository of the geth exporter docker image"
}

variable geth_exporter_docker_image_tag {
  type        = string
  description = "Tag of the geth exporter docker image"
}

variable geth_node_docker_image_repository {
  type        = string
  description = "Repository of the geth docker image"
}

variable geth_node_docker_image_tag {
  type        = string
  description = "Tag of the geth docker image"
}

variable geth_verbosity {
  type        = number
  description = "Verbosity of the validator nodes"
}

variable in_memory_discovery_table {
  type        = bool
  description = "Specifies whether to use an in memory discovery table"
}

variable istanbul_request_timeout_ms {
  type        = number
  description = "The number of ms for the istanbul request timeout"
}

variable network_id {
  type        = number
  description = "The network ID number"
}

variable network_name {
  type        = string
  description = "Name of the GCP network the validator VM is in"
}

variable tx_node_count {
  type        = number
  description = "Number of tx-nodes that are created"
}

variable validator_count {
  type        = number
  description = "Number of validators to create"
}

variable validator_signer_account_addresses {
  type        = list(string)
  description = "Array with the Validator account addresses"
}

variable validator_signer_private_keys {
  type        = list(string)
  description = "Array with the Validator account private keys"
}

variable validator_signer_account_passwords {
  type        = list(string)
  description = "Array with the Validator account passwords"
}

variable proxy_enodes {
  type        = list(string)
  description = "Array list with the proxy enode address (without enode://)"
}

variable proxy_internal_ips {
  type        = list(string)
  description = "Array list with the proxy internal addresses"
}

variable proxy_external_ips {
  type        = list(string)
  description = "Array list with the proxy external addresses"
}

variable reset_geth_data {
  type        = bool
  description = "Specifies if the existing chain data should be removed while creating the instance"
  default     = false
}

variable validator_name {
  type        = string
  description = "The validator Name for ethstats"
}

variable validator_max_peers {
  type        = number
  description = "Max number of peers to connect with"
  default     = 120
}
