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

module "celo_proxy_az1" {
    source            = "./modules/proxy"

    subnet_id         = module.celo_vpc.subnet_ids.az1.public
    key_pair_name     = var.key_pair_name
    instance_type     = var.instance_types.proxy
    celo_image        = var.celo_image
    celo_network_id   = var.celo_network_id

    proxies           = var.proxies.az1
}

module "celo_proxy_az2" {
    source            = "./modules/proxy"

    subnet_id         = module.celo_vpc.subnet_ids.az2.public
    key_pair_name     = var.key_pair_name
    instance_type     = var.instance_types.proxy
    celo_image        = var.celo_image
    celo_network_id   = var.celo_network_id

    proxies           = var.proxies.az2
}