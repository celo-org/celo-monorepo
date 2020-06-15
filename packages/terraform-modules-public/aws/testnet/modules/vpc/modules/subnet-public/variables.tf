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

variable internet_gateway_id {
  type        = string
  description = "ID for the internet gateway this subnet will route to"
}

variable "allowed_ssh_clients_cidr_block" {
  type        = string
  description = "CIDR block of allowed SSH clients."
}