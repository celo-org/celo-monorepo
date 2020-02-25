resource "aws_subnet" "private" {
  vpc_id               = var.vpc_id
  cidr_block           = var.cidr_block
  availability_zone_id = var.availability_zone_id

  tags = {
    Name = "celo-private-${var.availability_zone_id}"
  }
}

resource "aws_route_table" "private" {
  vpc_id = var.vpc_id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = var.nat_gateway_id
  }

  tags = {
    Name = "celo-private-route-table-${var.availability_zone_id}"
  }
}

resource "aws_route_table_association" "private" {
  subnet_id      = aws_subnet.private.id
  route_table_id = aws_route_table.private.id
}

resource "aws_network_acl" "private" {
  vpc_id     = var.vpc_id
  subnet_ids = [aws_subnet.private.id]

  tags = {
    Name = "celo-private-acl-${var.availability_zone_id}"
  }

  ingress {
    rule_no    = 100
    protocol   = "tcp"
    from_port  = 22
    to_port    = 22
    cidr_block = var.vpc_cidr_block
    action     = "allow"
  }

  ingress {
    rule_no    = 110
    protocol   = "tcp"
    from_port  = 5432
    to_port    = 5432
    cidr_block = var.vpc_cidr_block
    action     = "allow"
  }

  ingress {
    rule_no    = 130
    protocol   = "tcp"
    from_port  = 30303
    to_port    = 30303
    cidr_block = var.vpc_cidr_block
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
    rule_no    = 100
    protocol   = -1
    from_port  = 0
    to_port    = 0
    cidr_block = "0.0.0.0/0"
    action     = "allow"
  }
}

