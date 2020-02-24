variable subnet_id {
    type            = string
    description     = "Subnet for the SSH Bastion"
}

variable key_pair_name {
    type            = string
    description     = "SSH Key Pair name"
}

variable name {
    type            = string
    description     = "Name for this instance"
}

variable instance_type {
    type            = string
}