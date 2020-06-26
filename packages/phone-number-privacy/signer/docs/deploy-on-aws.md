# Deploying to AWS

## Prerequisites

- awscli (https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-install.html)
- AWS credentials configured (https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-configure.html)

## Steps

### Setting up the network and database

The next steps will explain how to create a new VPC and a RDS Postgres database needed to run the signer. If desired, it is possible to use an existing VPC and a database deployed in some any other way. Treat it as a reference for the port/security group configuration.

1. OPTIONAL: [Create new vpc and subnets](https://docs.aws.amazon.com/directoryservice/latest/admin-guide/gsg_create_vpc.html) for the resources (use the CIDR block and AZs that fits with your network setup). The VPC should have at least two subnets, and if it does not have any public subnet (for running the Signer container) the private subnets should have an [Internet Gateway configured](https://docs.aws.amazon.com/vpc/latest/userguide/VPC_Internet_Gateway.html)

1. Create the security groups for the database and signer:

    ```bash
    aws ec2 create-security-group --description "pgpnp database" --group-name pgpnp-db --vpc-id <id>
    aws ec2 create-security-group --description "signer" --group-name signer --vpc-id <id>
    ```

1. Create the security group rules The database should expose 5432 (the port could be specified and change during the database creation), and the signer by default uses port 8080:

    ```bash
    aws ec2 authorize-security-group-ingress --group-id <gpnp-db-id> --protocol tcp --port 5432 --source-group sg-0a1064e7d9cba38a9
    aws ec2 authorize-security-group-ingress --group-id <signer-id> --protocol tcp --port 8080 --cidr 0.0.0.0/0
    ```

1. [Create a RDS PostgreSQL DB](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_CreateDBInstance.html) (from the AWS web console).
The database does not require public access and you should accessing the VPC and security group previously created (or any other VPC and the security group if it is the case).

For the DB Instance size, `Free tier` should be enough.

### Running the Signer on Fargate

ECS Fargate is a container execution service provided by AWS. It runs containers without requiring explicit management of hosts or virtual machines.
Alternatively the signer service can be run using any other service that allows to run containers, such as EC2 or EKS. In the case of EC2, you will need to install docker, configure the instance profile and follow the documentation from [the signer readme](https://github.com/celo-org/celo-monorepo/tree/master/packages/phone-number-privacy/signer).

1. Create the service-linked role. If it is the first time you run ECS on your account you will need to run this command.

    ```bash
    aws iam create-service-linked-role --aws-service-name ecs.amazonaws.com
    ```

1. Create a Task Role for the signer ([documentation](https://docs.amazonaws.cn/en_us/AmazonECS/latest/userguide/ecs-cli-tutorial-fargate.html)).
First we will create the `assume-role` policy that allows ECS tasks to be assigned to this task role. 

    ```bash
    cat <<'EOF' > /tmp/task-execution-assume-role.json
    {
      "Version": "2012-10-17",
      "Statement": [
        {
          "Sid": "",
          "Effect": "Allow",
          "Principal": {
            "Service": "ecs-tasks.amazonaws.com"
          },
          "Action": "sts:AssumeRole"
        }
      ]
    }
    EOF
    ```

    Now  we will create the task-role:

    ```bash
    aws iam --region us-east-2 create-role --role-name signerTaskExecutionRole --assume-role-policy-document file:///tmp/task-execution-assume-role.json
    ```

    Finally we create the policy assigned to this task-role that allows retrieval of secrets from AWS Secret Manager. Then we attach that policy to the task role. 

    ```bash
    cat <<'EOF' > /tmp/secret-manager-signer-policy.json
    {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Action": [
                    "secretsmanager:GetResourcePolicy",
                    "secretsmanager:GetSecretValue",
                    "secretsmanager:DescribeSecret",
                    "secretsmanager:ListSecretVersionIds"
                ],
                "Resource": [
                    "arn:aws:secretsmanager:us-east-2:{YOUR_ACCOUNT_ID}:secret:{YOUR_SECRET_ID}"
                ]
            }
        ]
    }
    EOF

    aws iam create-policy --policy-name signerTaskAllowSecretManager --policy-document file:///tmp/secret-manager-signer-policy.json
    aws iam attach-role-policy --role-name signerTaskExecutionRole --policy-arn arn:aws:iam::{YOUR_ACCOUNT_ID}:policy/signerTaskAllowSecretManager
    ```

    If you want to manage the RDS postgres permissions using IAM, you can also add permissions for signer access to this policy.

1. Create ECS Fargate cluster

    ```bash
    aws ecs create-cluster --cluster-name pgpnp --capacity-providers FARGATE_SPOT --default-capacity-provider-strategy FARGATE_SPOT
    ```

1. Create task definition. Using the web interface, create a task definition with the next configuration:

    - [Task definition detail](./images/fargate-task-definition.png)
    - [Container definition detail](./images/fargate-container-definition.png)

1. Create the service using the task definition.

    - [Service definition detail](./images/fargate-service-definition.png)
