locals {
  name_prefix = "${var.celo_env}-attestation-service"
}

resource "google_sql_database_instance" "master" {
  count            = var.attestation_service_count > 0 ? 1 : 0
  name             = "${local.name_prefix}-db-${random_id.db_name.hex}"
  database_version = "POSTGRES_9_6"
  region           = var.gcloud_region

  settings {
    tier = "db-f1-micro"
  }
}

resource "google_sql_user" "celo" {
  count    = var.attestation_service_count > 0 ? 1 : 0
  name     = var.db_username
  instance = google_sql_database_instance.master[0].name
  password = var.db_password
}

resource "google_compute_address" "attestation_service" {
  count        = var.attestation_service_count > 0 ? var.attestation_service_count : 0
  name         = "${local.name_prefix}-address"
  address_type = "EXTERNAL"
}

resource "google_compute_address" "attestation_service_internal" {
  count        = var.attestation_service_count > 0 ? var.attestation_service_count : 0
  name         = "${local.name_prefix}-internal-address"
  address_type = "INTERNAL"
  purpose      = "GCE_ENDPOINT"
}

resource "google_compute_instance" "attestation_service" {
  count        = var.attestation_service_count > 0 ? var.attestation_service_count : 0
  name         = "${local.name_prefix}-instance"
  machine_type = var.instance_type

  tags = ["${var.celo_env}-attestation-service"]

  allow_stopping_for_update = true

  boot_disk {
    initialize_params {
      image = "debian-cloud/debian-9"
    }
  }

  network_interface {
    network    = var.network_name
    network_ip = google_compute_address.attestation_service_internal[count.index].address
    access_config {
      nat_ip = google_compute_address.attestation_service[count.index].address
    }
  }

  service_account {
    scopes = ["https://www.googleapis.com/auth/sqlservice.admin"]
  }

  metadata_startup_script = templatefile(
    format("%s/startup.sh", path.module), {
      rid : count.index,
      attestation_key : "0x${var.attestation_key[count.index]}",
      account_address : var.account_address[count.index],
      celo_provider : var.celo_provider,
      attestation_service_docker_image_repository : var.attestation_service_docker_image_repository,
      attestation_service_docker_image_tag : var.attestation_service_docker_image_tag,
      db_username : google_sql_user.celo[0].name,
      db_password : google_sql_user.celo[0].password,
      db_connection_name : google_sql_database_instance.master[0].connection_name,
      sms_providers : var.sms_providers,
      nexmo_key : var.nexmo_key,
      nexmo_secret : var.nexmo_secret,
      nexmo_blacklist : var.nexmo_blacklist,
      twilio_account_sid : var.twilio_account_sid,
      twilio_messaging_service_sid : var.twilio_messaging_service_sid,
      twilio_auth_token : var.twilio_auth_token,
      twilio_blacklist : var.twilio_blacklist,
    }
  )
}

resource "random_id" "db_name" {
  byte_length = 8
}
