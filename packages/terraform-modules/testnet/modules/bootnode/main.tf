resource "google_compute_address" "bootnode" {
  name = "${var.celo_env}-bootnode-address"
  address_type = "EXTERNAL"
}

resource "google_compute_instance" "bootnode" {
  name          = "${var.celo_env}-bootnode"
  machine_type  = "n1-standard-1"

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
      celotool_docker_image_repository: var.celotool_docker_image_repository,
      celotool_docker_image_tag: var.celotool_docker_image_tag,
      geth_bootnode_docker_image_repository: var.geth_bootnode_docker_image_repository,
      geth_bootnode_docker_image_tag: var.geth_bootnode_docker_image_tag,
      ip_address: google_compute_address.bootnode.address,
    }
  )

  service_account {
    scopes = ["userinfo-email", "compute-ro", "storage-ro"]
  }
}
