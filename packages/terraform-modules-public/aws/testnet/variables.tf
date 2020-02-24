variable region {
    type            = string
    description     = "AWS Region to provision this cluster"
}

variable cidr_blocks {
    type            = object({
      vpc                 = string
      subnet_az1_public   = string
      subnet_az1_private  = string
      subnet_az2_public   = string
      subnet_az2_private  = string
      allowed_ssh_clients = string
    })
    description     = "The cidr_blocks for the different subnets in a redundant Celo network"
    default         = {
      vpc                 = "10.10.0.0/16"
      subnet_az1_public   = "10.10.0.0/24"
      subnet_az1_private  = "10.10.1.0/24"
      subnet_az2_public   = "10.10.10.0/24"
      subnet_az2_private  = "10.10.11.0/24"
      allowed_ssh_clients = "0.0.0.0/0"
    }
}

variable instance_types {
  description = "The instance type for each component"
  type        = map(string)

  default = {
    bastion             = "t3.micro"
    proxy               = "c5.xlarge"
  }
}

variable key_pair_name {
  type        = string
  description = "AWS Key Pair name for SSH access"
}

variable celo_image {
  type        = string
  description = "Docker image for Celo nodes"
}

variable celo_network_id {
  type        = string
  description = "ID of the Celo network to join"
}

variable proxies {
  description = "Configuration for zero or more proxies in each availability zone."
  type        = object({
    az1   = map(object({
      validator_name              = string
      validator_signer_address    = string
    }))
    az2   = map(object({
      validator_name              = string
      validator_signer_address    = string
    }))
  })
}

variable validators {
    description     = "Configuration for zero or more validators in each availability zone"
    type            = object({ 
      az1 = map(object({
        name                          = string
        signer_address                = string
        signer_private_key            = string
        signer_private_key_password   = string
        signer_private_key_filename   = string
        proxy_enode                   = string
        proxy_private_ip              = string
        proxy_public_ip               = string
      }))
      az2 = map(object({
        name                          = string
        signer_address                = string
        signer_private_key            = string
        signer_private_key_password   = string
        signer_private_key_filename   = string
        proxy_enode                   = string
        proxy_private_ip              = string
        proxy_public_ip               = string
      }))
    })
}