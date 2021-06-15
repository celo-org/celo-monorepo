resource "google_compute_security_policy" "forno" {
  name = "${var.celo_env}-forno-security-policy"

  rule {
    action   = "deny(403)"
    priority = "1000"
    match {
      versioned_expr = "SRC_IPS_V1"
      config {
        src_ip_ranges = var.banned_cidr
      }
    }
    description = "Deny access to forno due to unfair usage"
  }
}
