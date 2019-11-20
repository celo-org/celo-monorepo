variable block_time {
  type        = number
  description = "Number of seconds between each block"
}

variable celo_env {
  type        = string
  description = "Name of the testnet Celo environment"
}

variable ethstats_host {
  type        = string
  description = "Ethstats url or IP address"
}

variable gcloud_project {
  type        = string
  description = "Name of the Google Cloud project to use"
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
  description = "Verbosity of all geth nodes"
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
  description = "The name of the network to use"
}

variable tx_node_count {
  type        = number
  description = "Number of tx-nodes to create"
}

variable validator_count {
  type        = number
  description = "Number of validators to create"
}

variable verification_pool_url {
  type        = string
  description = "URL of the verification pool"
}

# New vars
variable gcloud_region {
  type        = string
  description = "Name of the Google Cloud region to use"
}

variable gcloud_zone {
  type        = string
  description = "Name of the Google Cloud zone to use"
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

variable txnode_account_addresses {
  type        = list(string)
  description = ""
}

variable txnode_private_keys {
  type        = list(string)
  description = ""
}

variable txnode_account_passwords {
  type        = list(string)
  description = ""
}

variable proxy_enodes {
  type        = list(string)
  description = ""
}

variable proxy_account_addresses {
  type        = list(string)
  description = ""
}

variable proxy_private_node_keys {
  type        = list(string)
  description = ""
}

variable proxy_account_passwords {
  type        = list(string)
  description = ""
}

variable proxy_private_keys {
  type        = list(string)
  description = ""
}

variable bootnode_enode_address {
  type        = string
  description = ""
  default     = ""
}

variable bootnode_ip_address {
  type        = string
  description = ""
  default     = ""
}

variable deploy_txnode_lb {
  type        = bool
  description = ""
  default     = false
}

variable static_nodes_base64 {
  type        = string
  description = "Content of the genesis file encoded in base64"
}

# Attestation service vars
variable deploy_attestation_service {
  type        = bool
  description = ""
  default     = false
}

variable attestation_service_db_username {
  type        = string
  description = ""
  default     = ""
}

variable attestation_service_db_password {
  type        = string
  description = ""
  default     = ""
}

variable attestation_service_docker_image_repository {
  type        = string
  description = ""
  default     = ""
}

variable attestation_service_docker_image_tag {
  type        = string
  description = ""
  default     = ""
}

variable attestation_service_attestation_key {
  type        = string
  description = ""
  default     = ""
}

variable attestation_service_account_address {
  type        = string
  description = ""
  default     = ""
}

variable attestation_service_celo_provider {
  type        = string
  description = ""
  default     = ""
}

variable attestation_service_sms_providers {
  type        = string
  description = ""
  default     = ""
}

variable attestation_service_nexmo_key {
  type        = string
  description = ""
  default     = ""
}

variable attestation_service_nexmo_secret {
  type        = string
  description = ""
  default     = ""
}

variable attestation_service_nexmo_blacklist {
  type        = string
  description = ""
  default     = ""
}

