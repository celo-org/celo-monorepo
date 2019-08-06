variable celo_env {
  type = string
  description = "Name of the testnet Celo environment"
}

<<<<<<< HEAD
variable celotool_docker_image_repository {
  type = string
  description = "Repository of the celotool docker image"
}

variable celotool_docker_image_tag {
  type = string
  description = "Tag of the celotool docker image"
}

variable geth_bootnode_docker_image_repository {
  type = string
  description = "Repository of the geth bootnode docker image"
}

variable geth_bootnode_docker_image_tag {
  type = string
  description = "Tag of the geth bootnode docker image"
}

=======
>>>>>>> Make names of resources specific to a celo_env
variable mnemonic {
  type = string
  description = "Mnemonic for the bootnode"
}

variable network_name {
  type = string
  description = "Name of the GCP network"
}
