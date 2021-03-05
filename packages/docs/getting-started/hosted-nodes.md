# Hosted nodes

This page explains how to get a preconfigured Celo blockchain node running on one of the major cloud providers. cLabs currently provides machine images for launching full and lightest nodes on Alfajores and Mainnet, these prebuilt images are updated with every release of the Celo blockchain client and available on Amazon Web Services and Google Cloud Platform.

Before proceeding with a hosted Celo blockchain node, you'll need to have an account with your cloud provider of choice and basic knowledge of networking.

{% hint style="info" %}
If you would like to keep up-to-date with all the news happening in the Celo community, including validation, node operation and governance, please sign up to our [Celo Signal mailing list](https://celo.activehosted.com/f/15).

You can add the [Celo Signal public calendar](https://calendar.google.com/calendar/u/0/embed?src=c_9su6ich1uhmetr4ob3sij6kaqs@group.calendar.google.com) as well which has relevant dates.
{% endhint %}

## Amazon Web Services

To get started with a Celo blockchain node on AWS, ensure you're in the North Virginia region (us-east-1). You'll need to navigate to the AMIs tab of the EC2 page. From there you can change your search to only include `Public images` and enter `celo-`.

{% hint style="info" %}
The cLabs AWS owner ID is `243983831780`, if you're new to Celo or cloud providers, ensure the `Owner` of an AMI you launch matches `243983831780`.
{% endhint %}

For more information if you're not familiar with launching EC2 instances from machine images, please check the excellent [AWS documentation](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/AMIs.html).

## Google Cloud Platform

To get started with a Celo blockchain node on GCP, you'll need to navigate to the Images tab of the Compute Engine page. From there you can search for public images and enter `celo-`.

{% hint style="info" %}
The cLabs GCP account is called `celo-testnet`, if you're new to Celo or GCP, ensure that the `Created by` column of the image you're launching matches `celo-testnet`.
{% endhint %}

For more information please check the excellent [GCP documentation](https://cloud.google.com/compute/docs/images) on how to launch a compute instance from a public image.
