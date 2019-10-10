locals {
  name_prefix = "${var.celo_env}-bootnode"
}

resource "google_compute_address" "bootnode" {
  name         = "${local.name_prefix}-address"
  address_type = "EXTERNAL"
}

resource "google_compute_instance" "bootnode" {
  name         = local.name_prefix
  machine_type = "n1-standard-1"

  allow_stopping_for_update = true

  boot_disk {
    initialize_params {
      image = "debian-cloud/debian-9"
    }
  }

  scratch_disk {

  }

  network_interface {
    network = var.network_name
    access_config {
      nat_ip = google_compute_address.bootnode.address
    }
  }

  metadata_startup_script = templatefile(
    format("%s/startup.sh", path.module), {
      gcloud_secrets_base_path : var.gcloud_secrets_base_path,
      gcloud_secrets_bucket : var.gcloud_secrets_bucket,
      geth_bootnode_docker_image_repository : var.geth_bootnode_docker_image_repository,
      geth_bootnode_docker_image_tag : var.geth_bootnode_docker_image_tag,
      ip_address : google_compute_address.bootnode.address,
      network_id : var.network_id
    }
  )

  service_account {
    email = var.gcloud_vm_service_account_email
    scopes = [
      "https://www.googleapis.com/auth/devstorage.read_only",
      "https://www.googleapis.com/auth/logging.write"
    ]
  }
}
