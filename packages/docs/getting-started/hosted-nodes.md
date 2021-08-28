# Hosted nodes

This page explains how to get a preconfigured Celo blockchain node running on one of the major cloud providers. cLabs currently provides machine images for launching full and lightest nodes on Alfajores and Mainnet, these prebuilt images are updated with every release of the Celo blockchain client and available on Amazon Web Services and Google Cloud Platform.

Before proceeding with a hosted Celo blockchain node, you'll need to have an account with your cloud provider of choice and basic knowledge of networking.

{% hint style="info" %}
If you would like to keep up-to-date with all the news happening in the Celo community, including validation, node operation and governance, please sign up to our [Celo Signal mailing list](https://celo.activehosted.com/f/15).

You can add the [Celo Signal public calendar](https://calendar.google.com/calendar/u/0/embed?src=c_9su6ich1uhmetr4ob3sij6kaqs@group.calendar.google.com) as well which has relevant dates.
{% endhint %}

Currently cLabs provides the following machine images:

* `celo-alfajores-full-node-latest`
* `celo-alfajores-lightest-node-latest`
* `celo-mainnet-full-node-latest`
* `celo-mainnet-lightest-node-latest`

Please note that the time taken to sync a full node could be significant.

## Amazon Web Services

To get started with a Celo blockchain node on AWS, ensure you're in the North Virginia region \(us-east-1\). You'll need to navigate to the AMIs tab of the EC2 page. From there you can change your search to only include `Public images` and enter `celo-`.

{% hint style="info" %}
The cLabs AWS owner ID is `243983831780`, if you're new to Celo or cloud providers, ensure the `Owner` of an AMI you launch matches `243983831780`.
{% endhint %}

For more information if you're not familiar with launching EC2 instances from machine images, please check the excellent [AWS documentation](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/AMIs.html).

## Google Cloud Platform

GCP by default won't display public machine images when you search for them in your console. This means you'll need to go via the API or [gcloud](https://cloud.google.com/sdk/gcloud) command line to launch a node.

Depending on the type of node you'd like to launch \(see the above list\), the `gcloud` command to use may look a bit like this:

```bash
gcloud compute instances create <INSTANCE_NAME> --image <IMAGE_NAME> --image-project celo-testnet --project <YOUR_GCP_PROJECT>
```

For more information please check the excellent [GCP documentation](https://cloud.google.com/compute/docs/images) on how to launch a compute instance from a public image.

