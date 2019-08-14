# Terraform Testnets

## Overview

Terraform is a tool that allows developers to treat "infrastructure as code."
Infrastructure is defined in modules, and Terraform creates/changes/destroys
when changes are applied.

## Local Setup

It's best to use this package with `celotool`, but if you need to
run `terraform` commands locally:

1.  Download Terraform https://www.terraform.io/downloads.html
1.  Ensure you have a service account key file at the path shown in the
    module's `provider "google"` section.
1.  `terraform init` to download anything specific to the module (i.e. GCP specific
    binaries)
1.  `terraform apply` to initially deploy or upgrade
1.  `terraform destroy` to destroy
