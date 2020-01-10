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
  description = "Verbosity of the proxy nodes"
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
  description = "Name of the GCP network the proxy VM is in"
}

variable tx_node_count {
  type        = number
  description = "Number of tx-nodes that are created"
}

variable validator_count {
  type        = number
  description = "Number of proxys to create"
}

variable proxy_private_keys {
  type        = list(string)
  description = "Array with the Proxy private keys"
}

variable validator_signer_account_addresses {
  type        = list(string)
  description = "Array with the Validator etherbase account addresses"
}

variable bootnodes_base64 {
  type        = string
  description = "Bootnodes ethereum address encoded as base64"
}

variable reset_geth_data {
  type        = bool
  description = "Specifies if the existing chain data should be removed while creating the instance"
  default     = false
}

variable proxy_name {
  type        = string
  description = "The proxy Name for ethstats"
}

variable proxy_max_peers {
  type        = number
  description = "Max number of peers to connect with"
  default     = 120
}
