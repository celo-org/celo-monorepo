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

variable verification_pool_url {
  type        = string
  description = "URL of the verification pool"
}

variable validator_account_addresses {
  type        = list(string)
  description = ""
}

variable validator_private_keys {
  type        = list(string)
  description = ""
}

variable validator_account_passwords {
  type        = list(string)
  description = ""
}

variable proxy_enodes {
  type        = list(string)
  description = ""
}

variable proxy_ips {
  type        = list(string)
  description = ""
}

variable bootnode_enode_address {
  type        = string
  description = ""
}

variable static_nodes_base64 {
  type        = string
  description = "Content of the genesis file encoded in base64"
}
