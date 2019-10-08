variable celo_env {
  type        = string
  description = "Name of the testnet Celo environment"
}

variable gcloud_secrets_base_path {
  type        = string
  description = "Base path in the secrets bucket of a Google Cloud Storage file containing validator secrets"
}

variable gcloud_secrets_bucket {
  type        = string
  description = "Name of the Google Cloud Storage bucket where secrets are kept"
}

variable gcloud_vm_service_account_email {
  type        = string
  description = "The email of the service account to associate virtual machines with"
}

variable geth_bootnode_docker_image_repository {
  type        = string
  description = "Repository of the geth bootnode docker image"
}

variable geth_bootnode_docker_image_tag {
  type        = string
  description = "Tag of the geth bootnode docker image"
}

variable network_id {
  type        = number
  description = "The network ID number"
}

variable network_name {
  type        = string
  description = "Name of the GCP network"
}
