variable vpc_id {
  type        = string
  description = "VPC ID this subnet will belong to"
}

variable cidr_block {
  type        = string
  description = "CIDR block for this subnet"
}

variable availability_zone_id {
  type        = string
  description = "Availability zone for this subnet"
}

variable nat_gateway_id {
  type        = string
  description = "NAT Gateway so this subnet can reach the internet"
}

variable vpc_cidr_block {
  type        = string
  description = "CIDR block for the VPC this subnet belongs to"
}
