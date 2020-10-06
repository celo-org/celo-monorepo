variable name {
  type        = string
  description = "Name of the VPC"
  default     = "celo-vpc"
}

variable cidr_blocks {
  type = object({
    vpc                 = string
    subnet_az1_public   = string
    subnet_az1_private  = string
    subnet_az2_public   = string
    subnet_az2_private  = string
    allowed_ssh_clients = string
  })
  description = "The cidr_blocks for the different subnets in a redundant Celo network"
  default = {
    vpc                 = "10.10.0.0/16"
    subnet_az1_public   = "10.10.0.0/24"
    subnet_az1_private  = "10.10.1.0/24"
    subnet_az2_public   = "10.10.10.0/24"
    subnet_az2_private  = "10.10.11.0/24"
    allowed_ssh_clients = "0.0.0.0/0"
  }
}