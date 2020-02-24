provider "aws" {
    region = var.region
}

module "celo_vpc" {
    source = "./modules/vpc"

    name                = "celo-vpc"
    cidr_blocks         = var.cidr_blocks
}

module "celo_bastion_az1" {
    source            = "./modules/bastion"

    subnet_id         = module.celo_vpc.subnet_ids.az1.public
    key_pair_name     = var.key_pair_name
    name              = "celo-bastion-az1"
    instance_type     = var.instance_types.bastion
}

module "celo_bastion_az2" {
    source            = "./modules/bastion"

    subnet_id         = module.celo_vpc.subnet_ids.az2.public
    key_pair_name     = var.key_pair_name
    name              = "celo-bastion-az2"
    instance_type     = var.instance_types.bastion
}