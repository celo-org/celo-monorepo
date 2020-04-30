variable subnet_id {
  type        = string
  description = "Subnet for the SSH Bastion"
}

variable security_group_id {
  type        = string
  description = "VPC Security group for this instance"
}

variable key_pair_name {
  type        = string
  description = "SSH Key Pair name"
}

variable name {
  type        = string
  description = "Name for this instance"
}

variable instance_type {
  type = string
}