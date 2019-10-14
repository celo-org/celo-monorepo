locals {
  name_prefix = "${var.celo_env}-tx-node-lb"
}

resource "google_compute_instance_group" "tx_node_lb" {
  name = "${local.name_prefix}-group-${random_id.tx_node_lb.hex}"

  instances = slice(var.tx_node_self_links, 1, length(var.tx_node_self_links))

  lifecycle {
    create_before_destroy = true
  }

  named_port {
    name = "http"
    port = "8545"
  }
}

resource "random_id" "tx_node_lb" {
  byte_length = 8
}

resource "google_compute_instance_group" "internal" {
  name = "${local.name_prefix}-internal-group-${random_id.internal.hex}"

  instances = slice(var.tx_node_self_links, 0, 1)

  lifecycle {
    create_before_destroy = true
  }
}

resource "random_id" "internal" {
  byte_length = 8
}

# We want to maintain websockets (which are not supposed by the HTTPS external
# load balancer) & avoid unnecessary egress costs.
# An internal & external load balancer cannot use the same instance group. To
# get around this, we allocate 1 of the tx-nodes to be for internal load balancing.
# It's still included in `static_nodes.json`, but not included in the infura-like
# setup. In the future, consider moving this node to live in Kubernetes to be
# along with the services that use it.

# internal load balancer for metrics & blockscout:

resource "google_compute_address" "internal" {
  name         = "${local.name_prefix}-internal-address"
  address_type = "INTERNAL"
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

# external load balancer for infura-like setup

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
}

resource "google_compute_url_map" "external" {
  name            = "${local.name_prefix}-external-url-map"
  default_service = "${google_compute_backend_service.external.self_link}"

  host_rule {
    hosts        = [var.infura_setup_host]
    path_matcher = "allpaths"
  }

  path_matcher {
    name            = "allpaths"
    default_service = "${google_compute_backend_service.external.self_link}"
  }
}

resource "google_compute_backend_service" "external" {
  name      = "${local.name_prefix}-external-service"
  port_name = "http"
  protocol  = "HTTP"

  backend {
    group = google_compute_instance_group.tx_node_lb.self_link
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

resource "google_compute_ssl_certificate" "external" {
  name_prefix = "${local.name_prefix}-ssl-cert"
  private_key = acme_certificate.external.private_key_pem
  # acme_certificate's `certificate_pem` does not include the issuer pem in the chain
  certificate = "${acme_certificate.external.certificate_pem}${acme_certificate.external.issuer_pem}"

  lifecycle {
    create_before_destroy = true
  }
}

resource "google_dns_record_set" "external" {
  # google cloud requires the name to end with a "."
  name         = "${var.infura_setup_host}."
  managed_zone = data.google_dns_managed_zone.external.name
  type         = "A"
  ttl          = 3600

  rrdatas = [google_compute_global_address.external.address]
}

data "google_dns_managed_zone" "external" {
  name = var.dns_zone_name
}

# SSL certificate from Let's Encrypt:

resource "tls_private_key" "acme" {
  algorithm = "RSA"
}

resource "acme_registration" "external" {
  account_key_pem = tls_private_key.acme.private_key_pem
  email_address   = "trevor@celo.org"
}

resource "acme_certificate" "external" {
  account_key_pem = acme_registration.external.account_key_pem
  common_name     = var.infura_setup_host

  dns_challenge {
    provider = "gcloud"

    config = {
      GCE_POLLING_INTERVAL     = "10"
      GCE_PROPAGATION_TIMEOUT  = "180"
      GCE_TTL                  = "60"
      GCE_PROJECT              = var.gcloud_project
      GCE_SERVICE_ACCOUNT_FILE = var.gcloud_credentials_path
    }
  }
}
