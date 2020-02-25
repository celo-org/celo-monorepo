variable instance_type {
  type          = string
  description   = "AWS instance type for this node"
}

variable subnet_id {
  type          = string
  description   = "Subnet ID to place this proxy. This should be a public subnet from your Celo VPC."
}

variable key_pair_name {
  type          = string
  description   = "Name of the SSH key pair to access this node from the bastion"
}

variable volume_size {
  type          = number
  description   = "Size of the EBS volume for this instance"
  default       = 256
}

variable celo_image {
    type          = string
    description   = "Name of the docker image to run"
}

variable celo_network_id {
    type          = string
    description   = "Celo network ID to join"
}

variable validators {
    description     = "Map of validator configurations"
    type            = map(object({
      name                                        = string
      signer_address                              = string
      signer_private_key_file_contents            = string
      signer_private_key_password                 = string
      signer_private_key_filename                 = string
      proxy_enode                                 = string
      proxy_private_ip                            = string
      proxy_public_ip                             = string
    }))
}