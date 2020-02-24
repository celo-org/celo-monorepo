variable region {
    type            = string
    description     = "AWS Region to provision this cluster"
    default         = "us-west-1"
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

variable key_pair_name {
    type            = string
    description     = "SSH key pair name"
}

variable celo_image {
  type              = string
  description       = "Docker image for Celo nodes"
  default           = "us.gcr.io/celo-testnet/celo-node:1.8"
}

variable celo_network_id {
  type              = string
  description       = "ID of the Celo network to join"
  default           = "200110"
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
  default = {
    az1     = {}
    az2     = {}
  }
  # Here is an example configuration. We recommend putting this into a secret.auto.tfvars file.
  # default = {
  #   az1 = {
  #     myvalidator_az1_01 = {
  #       validator_name            = "myvalidator_az1_01"
  #       validator_signer_address  = "0000000011111111222222223333333344444444"
  #     }
  #     myvalidator_az1_02 = {
  #       validator_name            = "myvalidator_az1_02"
  #       validator_signer_address  = "5555555566666666777777778888888899999999"
  #     }
  #   }
  #   az2 = {
  #     myvalidator_az2_01 = {
  #       validator_name            = "myvalidator_az2_01"
  #       validator_signer_address  = "4444444433333333222222221111111100000000"
  #     }
  #     myvalidator_az2_02 = {
  #       validator_name            = "myvalidator_az2_02"
  #       validator_signer_address  = "9999999988888888777777776666666655555555"
  #     }
  #   }
  #
  # }
}