resource "aws_subnet" "public" {
  vpc_id               = var.vpc_id
  cidr_block           = var.cidr_block
  availability_zone_id = var.availability_zone_id

  tags = {
    Name = "celo-public-${var.availability_zone_id}"
  }
}

resource "aws_eip" "nat" {
  vpc = true

  tags = {
    Name = "celo-nat-eip"
  }
}

resource "aws_nat_gateway" "nat" {
  allocation_id = aws_eip.nat.id
  subnet_id     = aws_subnet.public.id

  tags = {
    Name = "celo-nat-gateway-${var.availability_zone_id}"
  }
}

resource "aws_route_table" "public" {
  vpc_id = var.vpc_id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = var.internet_gateway_id
  }

  tags = {
    Name = "celo-public-route-table-${var.availability_zone_id}"
  }
}

resource "aws_route_table_association" "public" {
  subnet_id      = aws_subnet.public.id
  route_table_id = aws_route_table.public.id
}


resource "aws_network_acl" "public" {
  vpc_id     = var.vpc_id
  subnet_ids = [aws_subnet.public.id]

  tags = {
    Name = "celo-public-acl-${var.availability_zone_id}"
  }

  ingress {
    rule_no    = 100
    protocol   = "tcp"
    from_port  = 22
    to_port    = 22
    cidr_block = var.allowed_ssh_clients_cidr_block
    action     = "allow"
  }

  ingress {
    rule_no    = 110
    protocol   = "tcp"
    from_port  = 80
    to_port    = 80
    cidr_block = "0.0.0.0/0"
    action     = "allow"
  }

  ingress {
    rule_no    = 120
    protocol   = "tcp"
    from_port  = 443
    to_port    = 443
    cidr_block = "0.0.0.0/0"
    action     = "allow"
  }

  ingress {
    rule_no    = 130
    protocol   = "tcp"
    from_port  = 30303
    to_port    = 30303
    cidr_block = "0.0.0.0/0"
    action     = "allow"
  }

  ingress {
    rule_no    = 131
    protocol   = "udp"
    from_port  = 30303
    to_port    = 30303
    cidr_block = "0.0.0.0/0"
    action     = "allow"
  }

  ingress {
    rule_no    = 140
    protocol   = "tcp"
    from_port  = 1024
    to_port    = 65535
    cidr_block = "0.0.0.0/0"
    action     = "allow"
  }

  egress {
    rule_no    = 200
    protocol   = -1
    to_port    = 0
    from_port  = 0
    cidr_block = "0.0.0.0/0"
    action     = "allow"
  }
}

