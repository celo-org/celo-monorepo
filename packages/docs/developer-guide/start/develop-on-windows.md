# Using Windows

Many popular tools and resources for blockchain development are written for developers working on UNIX machines. It is common for developers working on Windows to encounter errors that are not covered in the documentation and have no luck with Google. Fortunately, Microsoft makes it easy to run a UNIX machine directly from a Windows desktop _\*\*_with the [Windows Subsystem for Linux](https://docs.microsoft.com/en-us/windows/wsl/faq).

Here, we are going to show you how to get set up for developing on Celo on Windows.

## **Getting set up with Windows**

Open PowerShell as an administrator and run

```text
Enable-WindowsOptionalFeature -Online -FeatureName Microsoft-Windows-Subsystem-Linux
```

Restart your computer when prompted.

Next, install a Linux distribution from the Microsoft Store. When developing this guide, we chose [Ubuntu](https://www.microsoft.com/en-us/p/ubuntu-1804-lts/9n9tngvndl3q?rtc=1&activetab=pivot:overviewtab).

Set up your Linux distro by setting a username and password then update and upgrade the packages by running the following command in the terminal: **`$ sudo apt update && sudo apt upgrade`**

You can view the source documentation for setting up the Linux distro [here](https://docs.microsoft.com/en-us/windows/wsl/initialize-distro) and the Microsoft documentation for setting up the Windows Subsystem for Linux [here](https://docs.microsoft.com/en-us/windows/wsl/install-win10?WT.mc_id=smashingmag-article-buhollan).

## Set up the Linux Environment

Now that you have Linux installed, let’s install [nvm](https://github.com/nvm-sh/nvm) and [yarn](https://yarnpkg.com/). Nvm \(node version manager\) makes it easy to install and manage different versions of Node.js. The following instructions are from the [celo-monoreop setup documentation for Linux](https://github.com/celo-org/celo-monorepo/blob/master/SETUP.md#linux).

Run the following commands in the Linux terminal.

```text
# Installing Nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.34.0/install.sh | bash
source ~/.bashrc

# Setting up the right version of Nvm
nvm install 12
nvm alias default 12
```

Running `$ node -v` in the terminal should print a node version if it is installed correctly.

Yarn is a package manager similar to npm. The [celo-monorepo](https://github.com/celo-org/celo-monorepo/) uses yarn to build and manage packages. Install yarn with the following command.

```text
# Installing Yarn - https://yarnpkg.com/en/docs/install#debian-stable
curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | sudo apt-key add -
echo "deb https://dl.yarnpkg.com/debian/ stable main" | sudo tee /etc/apt/sources.list.d/yarn.list
sudo apt-get update && sudo apt-get install yarn
```

Test that yarn is installed by running `$ yarn --version`.

## Developing with WSL

You can now start working on your projects in your Linux environment. Install [the WSL VS Code extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-wsl) for a seamless integration between VS Code and WSL.

Be aware that networking will be different depending on which version of WSL you are using. The details of managing network interfaces goes beyond the scope of this guide, but you can [learn more here](https://adamtheautomator.com/windows-subsystem-for-linux/#developing-on-wsl-with-visual-studio-code-vs-code-).  
You are good to go! If you have any questions, [join our Discord server](https://chat.celo.org) and just ask.

## Additional Resources

* [**Windows Subsystem for Linux Installation Guide for Windows 10**](https://docs.microsoft.com/en-us/windows/wsl/install-win10?WT.mc_id=smashingmag-article-buhollan)
* [**WSL: Ultimate Guide**](https://adamtheautomator.com/windows-subsystem-for-linux/#developing-on-wsl-with-visual-studio-code-vs-code-)

