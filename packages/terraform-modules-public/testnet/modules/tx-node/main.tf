locals {
  name_prefix = "${var.celo_env}-tx-node"
}

resource "google_compute_address" "tx_node" {
  name         = "${local.name_prefix}-address-${count.index}-${random_id.tx_node[count.index].hex}"
  address_type = "EXTERNAL"

  count = var.tx_node_count

  lifecycle {
    create_before_destroy = true
  }
}

resource "google_compute_address" "tx_node_internal" {
  name         = "${local.name_prefix}-internal-address-${count.index}-${random_id.tx_node[count.index].hex}"
  address_type = "INTERNAL"
  purpose      = "GCE_ENDPOINT"

  count = var.tx_node_count
}

resource "google_compute_instance" "tx_node" {
  name         = "${local.name_prefix}-${count.index}-${random_id.tx_node[count.index].hex}"
  machine_type = var.instance_type

  count = var.tx_node_count

  tags = ["${var.celo_env}-txnode"]

  allow_stopping_for_update = true

  boot_disk {
    initialize_params {
      image = "debian-cloud/debian-9"
    }
  }

  scratch_disk {
    interface = "SCSI"
  }

  network_interface {
    network    = var.network_name
    network_ip = google_compute_address.tx_node_internal[count.index].address
    access_config {
      nat_ip = google_compute_address.tx_node[count.index].address
    }
  }

  metadata_startup_script = templatefile(
    format("%s/startup.sh", path.module), {
      block_time : var.block_time,
      ethstats_host : var.ethstats_host,
      genesis_content_base64 : var.genesis_content_base64,
      geth_exporter_docker_image_repository : var.geth_exporter_docker_image_repository,
      geth_exporter_docker_image_tag : var.geth_exporter_docker_image_tag,
      geth_node_docker_image_repository : var.geth_node_docker_image_repository,
      geth_node_docker_image_tag : var.geth_node_docker_image_tag,
      geth_verbosity : var.geth_verbosity,
      in_memory_discovery_table : var.in_memory_discovery_table,
      ip_address : google_compute_address.tx_node[count.index].address,
      max_peers : var.txnode_max_peers,
      network_id : var.network_id,
      bootnodes_base64 : var.bootnodes_base64,
      rid : count.index,
    }
  )
}

resource "random_id" "tx_node" {
  count = var.tx_node_count

  byte_length = 8
}
