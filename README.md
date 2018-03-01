TrustNote is a wallet for storage and transfer of decentralized value.  See [trustnote.org](https://trustnote.org/).

## Binary Downloads

[trustnote.org](https://trustnote.org/application.html)

## Main Features

TBD

## Installation

Download and install [NW.js v0.14.7 LTS](https://dl.nwjs.io/v0.14.7) and [Node.js v5.12.0](https://nodejs.org/download/release/v5.12.0/) (or newer).  These versions are recommended for easiest install but newer versions will work too.  If you already have another version of Node.js installed, you can use [NVM](https://github.com/creationix/nvm) to keep both.

Clone the source:

```sh
git clone https://github.com/trustnote/trustnote-wallet.git
cd trustnote-wallet
```

Install [bower](http://bower.io/) and [grunt](http://gruntjs.com/getting-started) if you haven't already:

```sh
npm install -g bower
npm install -g grunt-cli
```

Build TrustNote:

```sh
bower install
npm install
grunt
```
If you are on Windows or using NW.js and Node.js versions other than recommended, see [NW.js instructions about building native modules](http://docs.nwjs.io/en/latest/For%20Users/Advanced/Use%20Native%20Node%20Modules/).

After first run, you'll likely encounter runtime error complaining about node_sqlite3.node not being found, copy the file from the neighboring directory to where the program tries to find it, and run again. (e.g. from `trustnote-wallet/node_modules/sqlite3/lib/binding/node-v47-darwin-x64` to `trustnote-wallet/node_modules/sqlite3/lib/binding/node-webkit-v0.14.7-darwin-x64`)

Then run TrustNote desktop client:

```sh
/path/to/your/nwjs/nwjs .
```

## Build TrustNote App Bundles

All app bundles will be placed at `../trustnotebuilds` dir.


### Android

- Install Android SDK
- Run `make android`

### iOS

- Install Xcode 9 (or newer)
- Install Cordova `npm install cordova -g`
- Run `make ios`
  * In case of ios-deploy missing error: `npm install -g ios-deploy`
  * If you encounter 'bitcore' not found after app launch, install it also `npm install bitcore-lib` and remove `../trustnotebuilds/project-IOS` folder completely, then rerun make again.
  * On code signing error, open Xcode project `../trustnotebuilds/project-IOS/platforms/ios/TrustNote.xcodeproj` in Xcode, open project properties, select TrustNote target and set your AppleID account as a team. Xcode may also ask you to change bundle identifier to be unique, just append any random string to 'org.trustnote.smartwallet' bundle identifier.

### macOS

- `make osx64`

### Windows

- `make win64`

### Linux

- `make linux`


## About TrustNote

TBD

## TrustNote Backups and Recovery

TrustNote uses a single extended private key for all wallets, BIP44 is used for wallet address derivation.  There is a BIP39 mnemonic for backing up the wallet key, but it is not enough.  Private payments and co-signers of multisig wallets are stored only in the app's data directory, which you have to back up manually:

* macOS: `~/Library/Application Support/TTT`
* Linux: `~/.config/TTT`
* Windows: `%LOCALAPPDATA%\TTT`


## Support

* [GitHub Issues](https://github.com/trustnote/trustnote-wallet/issues)
  * Open an issue if you are having problems with this project
* [Email Support](mailto:foundation@trustnote.org)

## License

MIT.
