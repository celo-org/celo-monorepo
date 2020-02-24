provider "aws" {
    region = var.region
}

module "celo_vpc" {
    source = "./modules/vpc"

    name                = "celo-vpc"
    cidr_blocks         = var.cidr_blocks
}