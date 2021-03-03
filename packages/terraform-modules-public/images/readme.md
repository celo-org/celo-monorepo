# Celo Blockchain Images

Hashicorp Packer is a tool for building machine images to ease deployment on various cloud platforms.

As cLabs we provide prebuilt full and lightest Celo blockchain machine images for popular cloud platforms using this Packer script, however anyone is free to use this as inspiration for generating their own.

## Setup

To generate a machine image for a cloud provider you'll first need to [install Packer](https://learn.hashicorp.com/tutorials/packer/getting-started-install) and configure your credentials as specified.

## Building Images

A Makefile is provided for easy image generation, running `make alfajores` for example, will generate full and lightest nodes for each major cloud provider (AWS, GCP and Azure).

For more fine grained control you can run Packer manually with `packer build node.json`. One handy flag to note is `-only`, ie. `packer build -only=gcp,aws node.json` will only build images for GCP and AWS.

See the Makefile for precise examples of how you can generate machine images and pass through additional variables.

## Making Images Public

### AWS

Navigate to the your AMIs tab in AWS (under the EC2 screen) and select the image before clicking `Actions` ->`Modify Image Permissions` -> `Public`.

### GCP

Making an image public to the world on GCP requires you to run the following command after you've correctly configured your `gcloud` access.

```bash
gcloud compute images add-iam-policy-binding <IMAGE_NAME>
    --member='allAuthenticatedUsers' \
    --role='roles/compute.imageUser'
```
