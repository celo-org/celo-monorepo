variable block_time {
  type        = number
  description = "Number of seconds between each block"
}

variable bootnode_ip_address {
  type        = string
  description = "The external IP address of the bootnode"
}

variable celo_env {
  type        = string
  description = "Name of the testnet Celo environment"
}

variable ethstats_host {
  type        = "string"
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

variable proxy_account_addresses {
  type        = list(string)
  description = "Array with the Proxy etherbase account addresses"
}

variable proxy_private_keys {
  type        = list(string)
  description = "Array with the Proxy etherbase account private keys"
}

variable proxy_account_passwords {
  type        = list(string)
  description = "Array with the Proxy etherbase account passwords"
}

variable proxy_private_node_keys {
  type        = list(string)
  description = "Array with the Proxy node private keys"
}

variable validator_account_addresses {
  type        = list(string)
  description = "Array with the Validator etherbase account addresses"
}

variable bootnode_enode_address {
  type        = string
  description = "Network bootnode enode address"
}

variable static_nodes_base64 {
  type        = string
  description = "Content of the genesis file encoded in base64"
}

variable reset_geth_data {
  type        = bool
  description = "Specifies if the existing chain data should be removed while creating the instance"
  default     = false
}
