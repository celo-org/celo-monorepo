# locals {
#   name_prefix             = "${var.celo_env}"
#   target_https_proxy_name = "${var.celo_env}-tx-node-lb-external-http-proxy"
# }

resource "google_compute_health_check" "http_health_check" {
  name = "${var.celo_env}-${each.key}-forno-health-check"

  for_each = var.contexts_zones

  http_health_check {
    # For NetworkEndpointGroup, the port specified for each network endpoint is used for health checking
    port_specification = "USE_SERVING_PORT"
  }
}

# This is a reference to the ClusterIP RPC service inside this region's k8s cluster
data "google_compute_network_endpoint_group" "rpc_service_network_endpoint_group" {
  name = each.value
  zone = var.zone

  for_each = var.context_rpc_service_network_endpoint_groups
}

resource "google_compute_backend_service" "backend_service" {
  name = "${var.celo_env}-${each.key}-forno--backend-service"

  for_each = var.context_zones

  health_checks = [google_compute_health_check.http_health_check[each.key].id]

  backend {
    balancing_mode = "RATE"
    max_rate = var.backend_max_requests_per_second
    group = google_compute_network_endpoint_group.rpc_service_network_endpoint_group[each.key].id
  }
}
