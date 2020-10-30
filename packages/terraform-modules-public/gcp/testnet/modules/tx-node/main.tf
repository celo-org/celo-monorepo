locals {
  attached_disk_name = "celo-data"
  #having project in the instance name helps keep you from torching prod when you think you're working on staging
  name_prefix = "${var.gcloud_project}-tx-node"
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
  #name         = "${local.name_prefix}-${count.index}-${random_id.tx_node[count.index].hex}"
  name         = "${local.name_prefix}-${count.index}"
  machine_type = var.instance_type

  deletion_protection = false
  #deletion_protection = true

  count = var.tx_node_count

  tags = ["${var.celo_env}-txnode"]

  allow_stopping_for_update = true
  #allow_stopping_for_update = false   # You cannot stop an instance that uses a local SSD. Delete and recreate the instance

  boot_disk {
    initialize_params {
      #image = "debian-cloud/debian-9"
      image = "debian-cloud/debian-10"
    }
  }

  #375G local SSD is overkill for the txnode.  TODO: add a persistent disk large enough for full chain
  #scratch_disk {
  #  interface = "SCSI"
  #}

  attached_disk {
    source      = google_compute_disk.txnode[count.index].self_link
    device_name = local.attached_disk_name
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
      attached_disk_name : local.attached_disk_name,
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
      gcloud_project : var.gcloud_project,
      bootnodes_base64 : var.bootnodes_base64,
      reset_geth_data : var.reset_geth_data,
      rid : count.index,
      attestation_signer_address : var.attestation_signer_addresses[count.index],
      attestation_signer_private_key : var.attestation_signer_private_keys[count.index],
      attestation_signer_geth_account_secret : var.attestation_signer_account_passwords[count.index],
    }
  )
  
  service_account {
    scopes = var.service_account_scopes
  }
}

resource "random_id" "tx_node" {
  count = var.tx_node_count

  byte_length = 2
}

resource "google_compute_disk" "txnode" {
  name  = "${local.name_prefix}-celo-data-disk-${count.index}"
  count = var.tx_node_count

  #type = "pd-ssd"
  type = "pd-standard"      #disk I/O doesn't yet warrant SSD backed validators/proxies
  # in GB
  size                      = 10
  physical_block_size_bytes = 4096
}