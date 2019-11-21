locals {
  name_prefix = "${var.celo_env}-attestation-service"
}

resource "google_sql_database_instance" "master" {
  count            = var.deploy_attestation_service ? 1 : 0
  name             = "${local.name_prefix}-db"
  database_version = "POSTGRES_9_6"
  region           = var.gcloud_region

  settings {
    tier = "db-f1-micro"
  }
}

resource "google_sql_user" "celo" {
  count    = var.deploy_attestation_service ? 1 : 0
  name     = var.db_username
  instance = google_sql_database_instance.master[0].name
  password = var.db_password
}

resource "google_compute_address" "attestation_service_internal" {
  count        = var.deploy_attestation_service ? 1 : 0
  name         = "${local.name_prefix}-internal-address"
  address_type = "INTERNAL"
  purpose      = "GCE_ENDPOINT"
}

resource "google_compute_instance" "attestation_service" {
  count        = var.deploy_attestation_service ? 1 : 0
  name         = "${local.name_prefix}"
  machine_type = "n1-standard-1"

  tags = ["${var.celo_env}-attestation-service"]

  allow_stopping_for_update = true

  boot_disk {
    initialize_params {
      image = "debian-cloud/debian-9"
    }
  }

  network_interface {
    network    = var.network_name
    network_ip = google_compute_address.attestation_service_internal[0].address
  }

  metadata_startup_script = templatefile(
    format("%s/startup.sh", path.module), {
      attestation_key : var.attestation_key,
      account_address : var.account_address,
      celo_provider : var.celo_provider,
      attestation_service_docker_image_repository : var.attestation_service_docker_image_repository,
      attestation_service_docker_image_tag : var.attestation_service_docker_image_tag,
      db_username : google_sql_user.celo[0].name,
      db_password : google_sql_user.celo[0].password,
      db_host : google_sql_database_instance.master[0].first_ip_address,
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
