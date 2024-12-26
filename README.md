# Blockless Bless Network Bot
Tool được phát triển bởi nhóm tele Airdrop Hunter Siêu Tốc (<https://t.me/airdrophuntersieutoc>)

## Description

This script automates network or node operations for Blockless Bless Network Bot.

## Features

- **Automated node interaction**
- **Multi account**
- **Multi NodeID**
- **Proxy support**

## Prerequisites

- [Node.js](https://nodejs.org/) (version 12 or higher)

## Installation

1. Clone the repository to your local machine:

   ```bash
 git clone https://github.com/Hunga9k50doker/Block-less-network.git
   ```

2. Navigate to the project directory:
 ```bash
 cd blockless-bless-network-bot
 ```

3. Install the necessary dependencies:
 ```bash
 npm install
 ```

## Usage

1. Register to blockless bless network account first, if you dont have you can register [here](https://bless.network/dashboard?ref=C6OXCZ).
2. Set and Modify `config.js`. Below how to setup this file. Put your `B7S_AUTH_TOKEN (usertoken)`, `nodeid` and `hardwareid` in the file. Below how to get it:
2. Set and Modify `user.txt`. Below how to setup this file, put your B7S_AUTH_TOKEN in the text file, example below:
 ```
 eyJhbGcixxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
 ```
	To get your token, follow this step:

- Login to your blockless account in [https://bless.network/](https://bless.network/dashboard?ref=C6OXCZ),
 - Go to inspect element, press F12 or right-click then pick inspect element in your browser
 - Go to application tab - look for Local Storage in storage list -> click `https://bless.network` and you will see your B7S_AUTH_TOKEN.
 - or you can go Console tab and paste this
 ```bash
 localStorage.getItem('B7S_AUTH_TOKEN')
 ```

3. Create hardware id

- you can automatically create it with this command

    ```
    node setup.js
    ```

	put in `id.txt`. in the text file with this format `nodeid(pubkey)|hardwareid`, example below:
 ```
  12D3Koxxxxxxxxxxxx3ws|e938610xxxxxxxxxxxx
 12D3Koxxxxxxxxxxxx58o|221610xxxxxxxxxxxxx
  ```

4. put your pubkey you get from extension
 ```bash
 nano id.txt
 ```

5. If you want to use `proxy`, edit `proxy.txt` and add your proxy in there. Make sure total proxy is same with your total `nodeid(pubkey)|hardwareid` that you put in `id.txt`
6. Run the script:
 ```bash
 node main.js
 ```

**NOTE: The total time is refreshed every 10minute connection, One account only can have 5 nodeid max and can't be deleted, I recomended to save your Nodeid(pubkey) and hardwareid of your account**
