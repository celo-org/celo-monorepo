variable block_time {
  type = number
  description = "Number of seconds between each block"
}

variable bootnode_ip_address {
  type = string
  description = "The external IP address of the bootnode"
}

variable celo_env {
  type = string
  description = "Name of the testnet Celo environment"
}

variable celotool_docker_image_repository {
  type = string
  description = "Repository of the celotool docker image"
}

variable celotool_docker_image_tag {
  type = string
  description = "Tag of the celotool docker image"
}

variable genesis_content_base64 {
  type = string
  description = "Content of the genesis file encoded in base64"
}

variable geth_account_secret {
  type = string
  description = "Geth account secret"
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
  description = "Verbosity of the validator nodes"
}

variable mnemonic {
  type = string
  description = "Mnemonic for the validators"
}

variable network_id {
  type = number
  description = "The network ID number"
}

variable network_name {
  type = string
  description = "Name of the GCP network the validator VM is in"
}

variable validator_count {
  type = number
  description = "Number of validators to create"
}

variable verification_pool_url {
  type = string
  description = "URL of the verification pool"
}
