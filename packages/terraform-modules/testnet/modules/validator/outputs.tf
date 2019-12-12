output internal_ip_addresses {
  value = google_compute_address.validator_internal.*.address
}

output proxy_internal_ip_addresses {
  value = module.proxy.internal_ip_addresses
}
