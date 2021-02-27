locals {
  attached_disk_name = "celo-data"
  #having project in the instance name helps keep you from torching prod when you think you're working on staging
  name_prefix = "${var.gcloud_project}-backup-node"
}

resource "google_compute_address" "backup_node" {
  #name         = "${local.name_prefix}-address-${count.index}-${random_id.backup-node[count.index].hex}"
  name         = "${local.name_prefix}-address-${count.index}"
  address_type = "EXTERNAL"

  count = var.backup_node_count

  lifecycle {
    create_before_destroy = true
  }
}

resource "google_compute_address" "backup_node_internal" {
  name         = "${local.name_prefix}-internal-address-${count.index}"
  address_type = "INTERNAL"
  purpose      = "GCE_ENDPOINT"

  count = var.backup_node_count
}

resource "google_compute_instance" "backup_node" {
  name         = "${local.name_prefix}-${count.index}"
  machine_type = var.instance_type

  deletion_protection = false

  count = var.backup_node_count

  tags = ["${var.celo_env}-backup-node"]

  allow_stopping_for_update = true

  boot_disk {
    initialize_params {
      image = "debian-cloud/debian-10"
      size = 10
    }
  }

  attached_disk {
    source      = google_compute_disk.backup_node[count.index].self_link
    device_name = local.attached_disk_name
  }

  network_interface {
    network    = var.network_name
    network_ip = google_compute_address.backup_node_internal[count.index].address
    access_config {
      nat_ip = google_compute_address.backup_node[count.index].address
    }
  }

  metadata_startup_script = templatefile(
    format("%s/startup.sh", path.module), {
      attached_disk_name : local.attached_disk_name,
      block_time : var.block_time,
      ethstats_host : var.ethstats_host,
      geth_exporter_docker_image_repository : var.geth_exporter_docker_image_repository,
      geth_exporter_docker_image_tag : var.geth_exporter_docker_image_tag,
      geth_node_docker_image_repository : var.geth_node_docker_image_repository,
      geth_node_docker_image_tag : var.geth_node_docker_image_tag,
      geth_verbosity : var.geth_verbosity,
      in_memory_discovery_table : var.in_memory_discovery_table,
      ip_address : google_compute_address.backup_node[count.index].address,
      max_peers : var.backup_node_max_peers,
      network_id : var.network_id,
      gcloud_project : var.gcloud_project,
      reset_geth_data : var.reset_geth_data,
      rid : count.index,
    }
  )
  
  service_account {
    scopes = var.service_account_scopes
  }
}

resource "random_id" "backup_node" {
  count = var.backup_node_count
  byte_length = 2
}

resource "google_compute_disk" "backup_node" {
  name  = "${local.name_prefix}-celo-data-disk-${count.index}"
  count = var.backup_node_count

  #type = "pd-ssd"
  type = "pd-standard"      #disk I/O doesn't yet warrant SSD backed validators/proxies
  # in GB
  size                      = 20
  physical_block_size_bytes = 4096
}