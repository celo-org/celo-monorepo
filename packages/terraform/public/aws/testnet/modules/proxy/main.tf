locals {
  name_prefix        = "${var.celo_env}-proxy"
  tags = {
    Owner = "Terraform"
    Module = "celo-testnet"
  }
}

# Templates
data "template_file" "template_format_geth_volume" {
  template = "${file("${path.module}/../../../../../scripts/format_geth_volume.sh.template")}"
  vars = {
    attached_disk_name = local.attached_disk_name,
    reset_geth_data = "${var.reset_geth_data}"
  }
}

data "template_file" "template_install_docker" {
  template = "${file("${path.module}/../../../../../scripts/install_docker.sh.template")}"
}

data "template_file" "template_install_geth" {
  count = var.validator_count
  template = "${file("${path.module}/../../../../../scripts/install_geth_proxy.sh.template")}"
  vars = {
    block_time = "${var.block_time}",
    ethstats_host = "${var.ethstats_host}",
    genesis_content_base64 = "${var.genesis_content_base64}",
    geth_node_docker_image_repository = "${var.geth_node_docker_image_repository}",
    geth_node_docker_image_tag = "${var.geth_node_docker_image_tag}",
    geth_verbosity = "${var.geth_verbosity}",
    in_memory_discovery_table = "${var.in_memory_discovery_table}",
    ip_address = "${google_compute_address.proxy[count.index].address}",
    istanbul_request_timeout_ms = "${var.istanbul_request_timeout_ms}",
    max_peers = "${var.proxy_max_peers}",
    network_id = "${var.network_id}",
    rid = "${count.index}",
    proxy_name = "${var.proxy_name}",
    proxy_private_key = "${var.proxy_private_keys[count.index]}",
    validator_account_address = "${var.validator_signer_account_addresses[count.index]}",
    bootnodes_base64 = "${var.bootnodes_base64}"
  }
}

data "template_file" "template_install_geth_exporter" {
  template = "${file("${path.module}/../../../../../scripts/install_geth_exporter.sh.template")}"
  vars = {
    geth_exporter_docker_image_repository = "${var.geth_exporter_docker_image_repository}",
    geth_exporter_docker_image_tag = "${var.geth_exporter_docker_image_tag}",
  }
}

data "aws_ami" "ubuntu" {
  most_recent = true
  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-bionic-18.04-amd64-server-*"]
  }
  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
  owners = ["099720109477"] # Canonical
}

resource "aws_ebs_volume" "data" {
  count             = var.validator_count
  availability_zone = var.public_azs[count.index % length(var.public_azs)]
  type              = gp2
  size              = 100

  tags = merge(local.tags, {"Name"="${locals.prefix}-data-${count.index}"})
}

resource "aws_volume_attachment" "data" {
  count       = var.validator_count
  device_name = "/dev/sdh"
  volume_id   = "${aws_ebs_volume.data[count.index].id}"
  instance_id = "${aws_instance.validator[count.index].id}"
}

resource "aws_security_group" "proxyies" {
  name        = "proxies"
  description = "Allow the traffic for proxy instances"
  vpc_id      = var.vpc_id
  tags = merge(local.tags, {"Name"="${locals.prefix}-sg"})
}

resource "aws_security_group_rule" "ethereum" {
  type            = "ingress"
  from_port       = 30303
  to_port         = 30303
  protocol        = "all"
  cidr_blocks     = var.cidr

  security_group_id = aws_security_group.validators.id
}

resource "aws_security_group_rule" "proxy" {
  type            = "ingress"
  from_port       = 30503
  to_port         = 30503
  protocol        = "all"
  cidr_blocks     = var.cidr
  security_group_id = aws_security_group.validators.id
}

resource "aws_security_group_rule" "geth_exporter" {
  type            = "ingress"
  from_port       = 9200
  to_port         = 9200
  protocol        = "tcp"
  cidr_blocks     = var.cidr
  security_group_id = aws_security_group.validators.id
}

resource "aws_security_group_rule" "output" {
  type            = "egress"
  from_port       = 0
  to_port         = 65535
  protocol        = "all"
  security_group_id = aws_security_group.validators.id
}

resource "aws_instance" "validator" {
  count         = var.validator_count
  name          = "${local.name_prefix}-${count.index}"
  instance_type = var.instance_type
  ami           = data.aws_ami.ubuntu.id
  
  tags = merge(locals.tags,{"Name"="${locals.name_prefix}-${count.index}"})
  
  root_block_device = {
    volume_type = gp2
    volume_size = 50
    delete_on_termination = true    
  }

  subnet_id = var.public_subnets[count.index % length(var.public_subnets)]
  security_groups = [aws_security_group.validators.id]

  user_data = templatefile(
    format("%s/startup.sh", path.module), {
      template_format_geth_volume : data.template_file.template_format_geth_volume.rendered,
      template_install_docker : data.template_file.template_install_docker.rendered,
      template_install_geth : data.template_file.template_install_geth[count.index].rendered,
      template_install_geth_exporter : data.template_file.template_install_geth_exporter.rendered
    }
  )
}
