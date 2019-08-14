variable block_time {
  type = number
  description = "Number of seconds between each block"
}

variable celo_env {
  type = string
  description = "Name of the testnet Celo environment"
}

variable ethstats_host {
  type = "string"
  description = "Ethstats url or IP address"
}

variable ethstats_websocket_secret {
  type = string
  description = "Ethstats websocket secret to allow nodes to report activity"
}

variable gcloud_credentials_path {
  type = string
  description = "Path to the file containing the Google Cloud credentials to use"
}

variable gcloud_project {
  type = string
  description = "Name of the Google Cloud project to use"
}

variable gcloud_secrets_base_path {
  type = string
  description = "Base path in the secrets bucket of a Google Cloud Storage file containing node secrets"
}

variable gcloud_secrets_bucket {
  type = string
  description = "Name of the Google Cloud Storage bucket where secrets are kept"
}

variable gcloud_vm_service_account_email {
  type = string
  description = "The email of the service account to associate virtual machines with"
}

variable genesis_content_base64 {
  type = string
  description = "Content of the genesis file encoded in base64"
}

variable geth_bootnode_docker_image_repository {
  type = string
  description = "Repository of the bootnode docker image"
}

variable geth_bootnode_docker_image_tag {
  type = string
  description = "Tag of the bootnode docker image"
}

variable geth_node_docker_image_repository {
  type = string
  description = "Repository of the geth docker image"
}

variable geth_node_docker_image_tag {
  type = string
  description = "Tag of the geth docker image"
}

variable geth_verbosity {
  type = number
  description = "Verbosity of all geth nodes"
}

<<<<<<< HEAD
=======
variable mnemonic {
  type = string
  description = "Mnemonic for the nodes"
}

>>>>>>> e7510c6eecd12e034893dfd7bb7323042f6d2f08
variable network_id {
  type = number
  description = "The network ID number"
}

variable validator_count {
  type = number
  description = "Number of validators to create"
}

<<<<<<< HEAD
=======
variable validator_geth_account_secret {
  type = string
  description = "Geth account secret for validators"
}

>>>>>>> e7510c6eecd12e034893dfd7bb7323042f6d2f08
variable verification_pool_url {
  type = string
  description = "URL of the verification pool"
}
