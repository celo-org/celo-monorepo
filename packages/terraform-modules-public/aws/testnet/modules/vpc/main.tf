resource "aws_vpc" "celo" {
  cidr_block = var.cidr_blocks.vpc

  tags = {
    Name = var.name
  }
}

resource "aws_default_security_group" "default" {
  vpc_id = aws_vpc.celo.id

  ingress {
    protocol  = -1
    self      = true
    from_port = 0
    to_port   = 0
  }
}

resource "aws_internet_gateway" "igw" {
  vpc_id = aws_vpc.celo.id

  tags = {
    Name = "celo-internet-gateway"
  }
}

data "aws_availability_zones" "available" {
  state = "available"
}


module "celo_public_subnet_az1" {
  source = "./modules/subnet-public"

  vpc_id                         = aws_vpc.celo.id
  cidr_block                     = var.cidr_blocks.subnet_az1_public
  internet_gateway_id            = aws_internet_gateway.igw.id
  availability_zone_id           = data.aws_availability_zones.available.zone_ids[0]
  allowed_ssh_clients_cidr_block = var.cidr_blocks.allowed_ssh_clients
}

module "celo_private_subnet_az1" {
  source = "./modules/subnet-private"

  vpc_id               = aws_vpc.celo.id
  cidr_block           = var.cidr_blocks.subnet_az1_private
  availability_zone_id = data.aws_availability_zones.available.zone_ids[0]
  nat_gateway_id       = module.celo_public_subnet_az1.nat_gateway_id
  vpc_cidr_block       = aws_vpc.celo.cidr_block
}

module "celo_public_subnet_az2" {
  source = "./modules/subnet-public"

  vpc_id                         = aws_vpc.celo.id
  cidr_block                     = var.cidr_blocks.subnet_az2_public
  internet_gateway_id            = aws_internet_gateway.igw.id
  availability_zone_id           = data.aws_availability_zones.available.zone_ids[1]
  allowed_ssh_clients_cidr_block = var.cidr_blocks.allowed_ssh_clients
}

module "celo_private_subnet_az2" {
  source = "./modules/subnet-private"

  vpc_id               = aws_vpc.celo.id
  cidr_block           = var.cidr_blocks.subnet_az2_private
  availability_zone_id = data.aws_availability_zones.available.zone_ids[1]
  nat_gateway_id       = module.celo_public_subnet_az2.nat_gateway_id
  vpc_cidr_block       = aws_vpc.celo.cidr_block
}

resource "aws_security_group" "attestation_service" {
  name   = "celo-attestation-service"
  vpc_id = aws_vpc.celo.id

  ingress {
    from_port       = 22
    to_port         = 22
    protocol        = "tcp"
    security_groups = [aws_security_group.bastion.id]
  }

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = -1
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_security_group" "attestation_db" {
  name   = "celo-attestation-db"
  vpc_id = aws_vpc.celo.id

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.attestation_service.id]
  }
}

resource "aws_security_group" "bastion" {
  name   = "celo-bastion"
  vpc_id = aws_vpc.celo.id

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.cidr_blocks.allowed_ssh_clients]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = -1
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_security_group" "full_node" {
  name   = "celo-full-node"
  vpc_id = aws_vpc.celo.id

  ingress {
    from_port       = 22
    to_port         = 22
    protocol        = "tcp"
    security_groups = [aws_security_group.bastion.id]
  }

  ingress {
    from_port   = 30303
    to_port     = 30303
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 30303
    to_port     = 30303
    protocol    = "udp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = -1
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_security_group" "proxy" {
  name   = "celo-proxy"
  vpc_id = aws_vpc.celo.id
}

resource "aws_security_group" "validator" {
  name   = "celo-validator"
  vpc_id = aws_vpc.celo.id
}

resource "aws_security_group_rule" "validator_allow_private_ssh" {
  type                     = "ingress"
  from_port                = 22
  to_port                  = 22
  protocol                 = "tcp"
  security_group_id        = aws_security_group.validator.id
  source_security_group_id = aws_security_group.bastion.id
}

resource "aws_security_group_rule" "validator_allow_proxy_inbound" {
  type                     = "ingress"
  from_port                = 30303
  to_port                  = 30303
  protocol                 = "tcp"
  security_group_id        = aws_security_group.validator.id
  source_security_group_id = aws_security_group.proxy.id
}

resource "aws_security_group_rule" "validator_allow_all_outbound" {
  type              = "egress"
  from_port         = 0
  to_port           = 0
  protocol          = -1
  security_group_id = aws_security_group.validator.id
  cidr_blocks       = ["0.0.0.0/0"]
}

resource "aws_security_group_rule" "proxy_allow_internal_ssh" {
  type                     = "ingress"
  from_port                = 22
  to_port                  = 22
  protocol                 = "tcp"
  security_group_id        = aws_security_group.proxy.id
  source_security_group_id = aws_security_group.bastion.id
}

resource "aws_security_group_rule" "proxy_allow_external_tcp_inbound" {
  type              = "ingress"
  from_port         = 30303
  to_port           = 30303
  protocol          = "tcp"
  security_group_id = aws_security_group.proxy.id
  cidr_blocks       = ["0.0.0.0/0"]
}

resource "aws_security_group_rule" "proxy_allow_external_udp_inbound" {
  type              = "ingress"
  from_port         = 30303
  to_port           = 30303
  protocol          = "udp"
  security_group_id = aws_security_group.proxy.id
  cidr_blocks       = ["0.0.0.0/0"]
}

resource "aws_security_group_rule" "proxy_allow_validator_inbound" {
  type                     = "ingress"
  from_port                = 30503
  to_port                  = 30503
  protocol                 = "tcp"
  security_group_id        = aws_security_group.proxy.id
  source_security_group_id = aws_security_group.validator.id
}

resource "aws_security_group_rule" "proxy_allow_all_outbound" {
  type              = "egress"
  from_port         = 0
  to_port           = 0
  protocol          = -1
  security_group_id = aws_security_group.proxy.id
  cidr_blocks       = ["0.0.0.0/0"]
}



