locals {
  name_prefix             = "${var.celo_env}-tx-node-lb"
  target_https_proxy_name = "${var.celo_env}-tx-node-lb-external-http-proxy"
}

# We want to maintain websockets (which are not supposed by the HTTPS external
# load balancer) & avoid unnecessary egress costs.
# An internal & external load balancer cannot use the same instance group. To
# get around this, we allocate 1 of the tx-nodes to be for internal load balancing.
# It's still included in `static_nodes.json`, but not included in the forno
# setup. In the future, consider moving this node to live in Kubernetes to be
# along with the services that use it.

# internal load balancer for cLabs-run infra:

resource "google_compute_instance_group" "internal" {
  name = "${local.name_prefix}-internal-group-${random_id.internal.hex}"

  instances = var.private_tx_node_self_links

  lifecycle {
    create_before_destroy = true
  }
}

resource "random_id" "internal" {
  byte_length = 8
}

data "google_compute_subnetwork" "subnet" {
  name = var.network_name
}

resource "google_compute_address" "internal" {
  name         = "${local.name_prefix}-internal-address"
  address_type = "INTERNAL"
  subnetwork   = data.google_compute_subnetwork.subnet.self_link
}

resource "google_compute_forwarding_rule" "internal" {
  name = "${local.name_prefix}-internal-fwd-rule"

  backend_service       = google_compute_region_backend_service.internal.self_link
  ip_address            = google_compute_address.internal.address
  load_balancing_scheme = "INTERNAL"
  network               = var.network_name
  ports                 = ["8545", "8546"]
}

resource "google_compute_region_backend_service" "internal" {
  name = "${local.name_prefix}-internal-service"

  # internal HTTP load balancing does not support WebSockets
  protocol = "TCP"

  backend {
    group = google_compute_instance_group.internal.self_link
  }

  health_checks = [
    google_compute_health_check.internal.self_link
  ]
}

resource "google_compute_health_check" "internal" {
  name = "${local.name_prefix}-internal-health"

  tcp_health_check {
    port = 8545
  }
}

# external load balancer for forno setup


resource "google_compute_instance_group" "external" {
  name = "${local.name_prefix}-group-${random_id.external.hex}"

  instances = var.tx_node_self_links

  lifecycle {
    create_before_destroy = true
  }

  named_port {
    name = "http"
    port = "8545"
  }
}

resource "random_id" "external" {
  byte_length = 8
}

resource "google_compute_global_address" "external" {
  name         = "${local.name_prefix}-external-address"
  address_type = "EXTERNAL"
}

resource "google_compute_global_forwarding_rule" "external" {
  name = "${local.name_prefix}-external-fwd-rule"

  ip_address            = google_compute_global_address.external.address
  load_balancing_scheme = "EXTERNAL"
  port_range            = "443"
  target                = google_compute_target_https_proxy.external.self_link
}

resource "google_compute_target_https_proxy" "external" {
  name             = "${local.name_prefix}-external-http-proxy"
  url_map          = google_compute_url_map.external.self_link
  ssl_certificates = [google_compute_ssl_certificate.external.self_link]
  quic_override    = "NONE"
}

resource "google_compute_url_map" "external" {
  name            = "${local.name_prefix}-external-url-map"
  default_service = google_compute_backend_service.external.self_link

  host_rule {
    hosts        = [var.forno_host]
    path_matcher = "allpaths"
  }

  path_matcher {
    name            = "allpaths"
    default_service = google_compute_backend_service.external.self_link
  }
}

resource "google_compute_backend_service" "external" {
  name      = "${local.name_prefix}-external-service"
  port_name = "http"
  protocol  = "HTTP"

  backend {
    group = google_compute_instance_group.external.self_link
  }

  health_checks = [
    google_compute_health_check.external.self_link
  ]
}

resource "google_compute_health_check" "external" {
  name = "${local.name_prefix}-external-health"

  http_health_check {
    port = 8545
  }
}

resource "google_dns_record_set" "external" {
  # google cloud requires the name to end with a "."
  name         = "${var.forno_host}."
  managed_zone = data.google_dns_managed_zone.external.name
  type         = "A"
  ttl          = 3600

  rrdatas = [google_compute_global_address.external.address]

  project = var.dns_gcloud_project
}

data "google_dns_managed_zone" "external" {
  name    = var.dns_zone_name
  project = var.dns_gcloud_project
}

# SSL certificate from Let's Encrypt:

resource "google_compute_instance" "external_ssl" {
  name         = "${local.name_prefix}-external-ssl"
  machine_type = "f1-micro"

  tags = ["${var.celo_env}-external-ssl"]

  allow_stopping_for_update = true

  boot_disk {
    initialize_params {
      image = "debian-cloud/debian-9"
    }
  }

  network_interface {
    network = var.network_name
    access_config {
    }
  }

  metadata_startup_script = templatefile(
    format("%s/ssl-startup.sh", path.module), {
      cert_prefix : "${local.name_prefix}-forno-",
      forno_host : var.forno_host,
      gcloud_project : var.dns_gcloud_project,
      letsencrypt_email : var.letsencrypt_email,
      target_https_proxy_name : local.target_https_proxy_name
    }
  )

  service_account {
    email = var.gcloud_vm_service_account_email
    scopes = [
      "https://www.googleapis.com/auth/compute",
      "https://www.googleapis.com/auth/devstorage.read_only",
      "https://www.googleapis.com/auth/logging.write",
      "https://www.googleapis.com/auth/ndev.clouddns.readwrite"
    ]
  }
}

# temporary self-signed certificate that will be overwritten by
# google_compute_instance.external_ssl

resource "google_compute_ssl_certificate" "external" {
  name_prefix = "${local.name_prefix}-ssl-cert"
  private_key = tls_private_key.tmp.private_key_pem
  certificate = tls_self_signed_cert.tmp.cert_pem

  lifecycle {
    create_before_destroy = true
  }
}

resource "tls_self_signed_cert" "tmp" {
  key_algorithm   = "RSA"
  private_key_pem = tls_private_key.tmp.private_key_pem

  subject {
    common_name  = var.forno_host
    organization = "Temporary self signed cert"
  }

  validity_period_hours = 12

  allowed_uses = [
    "server_auth",
  ]
}

resource "tls_private_key" "tmp" {
  algorithm = "RSA"
}
