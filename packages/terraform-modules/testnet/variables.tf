variable block_time {
  type        = number
  description = "Number of seconds between each block"
}

variable celo_env {
  type        = string
  description = "Name of the testnet Celo environment"
}

variable dns_gcloud_project {
  type        = string
  description = "Name of the Google Cloud project where Cloud DNS is"
}

variable dns_zone_name {
  type        = string
  description = "Name of the DNS zone for the domain used for the forno setup"
}

variable ethstats_host {
  type        = string
  description = "Ethstats url or IP address"
}

variable forno_host {
  type        = string
  description = "The host name to use for the tx node forno setup"
}

variable gcloud_credentials_path {
  type        = string
  description = "Path to the file containing the Google Cloud credentials to use"
}

variable gcloud_project {
  type        = string
  description = "Name of the Google Cloud project to use"
}

variable gcloud_secrets_base_path {
  type        = string
  description = "Base path in the secrets bucket of a Google Cloud Storage file containing node secrets"
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

variable geth_bootnode_docker_image_repository {
  type        = string
  description = "Repository of the bootnode docker image"
}

variable geth_bootnode_docker_image_tag {
  type        = string
  description = "Tag of the bootnode docker image"
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

variable letsencrypt_email {
  type        = string
  description = "The email to create letsencrypt certificates with"
}

variable network_id {
  type        = number
  description = "The network ID number"
}

variable network_name {
  type        = string
  description = "The name of the network to use"
}

variable private_tx_node_count {
  type        = number
  description = "Number of private tx-nodes that are created with RPC ports only internally exposed"
  default     = 0
}

variable proxied_validator_count {
  type        = number
  description = "Number of validator_count validators that are hidden behind proxies"
}

variable tx_node_count {
  type        = number
  description = "Number of public tx-nodes to create"
}

variable validator_count {
  type        = number
  description = "Number of validators to create"
}
