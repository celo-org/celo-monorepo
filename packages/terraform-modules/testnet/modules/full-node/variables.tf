variable additional_geth_flags {
  type        = string
  description = "Additional flags to be passed when running geth"
  default     = ""
}

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

variable gcloud_secrets_base_path {
  type        = string
  description = "Base path in the secrets bucket of a Google Cloud Storage file containing tx-node secrets"
}

variable gcloud_secrets_bucket {
  type        = string
  description = "Name of the Google Cloud Storage bucket where secrets are kept"
}

variable gcloud_vm_service_account_email {
  type        = string
  description = "The email of the service account to associate virtual machines with"
}

variable genesis_content_base64 {
  type        = string
  description = "Content of the genesis file encoded in base64"
}

variable geth_metrics {
  type        = string
  description = "Enable Geth metrics (prometheus format) on port 6060"
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
  description = "Verbosity of the nodes"
}

variable in_memory_discovery_table {
  type        = bool
  description = "Specifies whether to use an in memory discovery table"
}

variable instance_tags {
  type        = list(string)
  description = "Tags to set for the instance"
  default     = []
}

variable max_light_peers {
  type        = number
  description = "The maximum number of light client peers"
  default     = 50
}

variable max_peers {
  type        = number
  description = "The maximum number of peers for the node"
  default     = 100
}

variable name {
  type        = string
  description = "Name of the nodes. Should be specified if names is not."
  default     = ""
}

variable names {
  type        = set(string)
  description = "Name of each node to create. If not specified, the names will be generated using the name variable and an index."
  default     = []
}

variable network_id {
  type        = number
  description = "The network ID number"
}

variable network_name {
  type        = string
  description = "Name of the GCP network the node VM is in"
}

variable node_count {
  type        = number
  description = "Number of nodes to create if names is not specified"
  default     = 0
}

variable node_disk_size_gb {
  type        = number
  description = "The size in GB for each node's disk"
}

variable gcmode {
  type        = string
  description = "Celo-blockchain --gcmode option"
  default     = "full"
}

variable proxy {
  type        = bool
  description = "Whether the node is a proxy for a validator"
  default     = false
}

variable rpc_apis {
  type        = string
  description = "Comma separated string including which RPC APIs to expose"
  default     = "eth,net,web3"
}
