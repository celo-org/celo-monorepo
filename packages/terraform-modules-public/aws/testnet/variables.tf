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
    validator           = "c5.xlarge"
    attestation_service = "t3.large"
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

variable celo_image_attestation {
  type        = string
  description = "Docker image for Celo attestation service"
}

variable twilio_messaging_service_sid {
  type            = string
}

variable twilio_account_sid {
  type            = string
}

variable twilio_blacklist {
  type            = string
}

variable twilio_auth_token {
  type            = string
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
        name                                        = string
        signer_address                              = string
        signer_private_key_filename                 = string
        signer_private_key_file_contents            = string
        signer_private_key_password                 = string
        proxy_enode                                 = string
        proxy_private_ip                            = string
        proxy_public_ip                             = string
      }))
      az2 = map(object({
        name                                        = string
        signer_address                              = string
        signer_private_key_filename                 = string
        signer_private_key_file_contents            = string
        signer_private_key_password                 = string
        proxy_enode                                 = string
        proxy_private_ip                            = string
        proxy_public_ip                             = string
      }))
    })
}

variable attestation_services {
    description     = "Configuration for zero or more attestation nodes in each availability zone"
    type            = object({
      az1 = map(object({
        validator_name                                          = string
        validator_address                                       = string
        attestation_signer_address                              = string
        attestation_signer_private_key_filename                 = string
        attestation_signer_private_key_file_contents            = string
        attestation_signer_private_key_password                 = string
      }))
      az2 = map(object({
        validator_name                                          = string
        validator_address                                       = string
        attestation_signer_address                              = string
        attestation_signer_private_key_filename                 = string
        attestation_signer_private_key_file_contents            = string
        attestation_signer_private_key_password                 = string
      }))
    })
}