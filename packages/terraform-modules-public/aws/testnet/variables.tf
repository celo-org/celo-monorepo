variable region {
    type            = string
    description     = "AWS Region to provision this cluster"
}

variable cidr_blocks {
    type            = map(string)
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
  }
}

variable key_pair_name {
  type        = string
  description = "AWS Key Pair name for SSH access"
}