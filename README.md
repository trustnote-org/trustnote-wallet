TrustNote is a wallet for storage and transfer of decentralized value.  See [trustnote.org](https://trustnote.org/).

## Binary Downloads

[trustnote.org](https://trustnote.org/)

## Main Features

TBD

## Installation

Download and install [NW.js v0.14.7 LTS](https://dl.nwjs.io/v0.14.7) and [Node.js v5.12.0](https://nodejs.org/download/release/v5.12.0/).  These versions are recommended for easiest install but newer versions will work too.  If you already have another version of Node.js installed, you can use [NVM](https://github.com/creationix/nvm) to keep both.

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

All app bundles will be placed at `../trustnotebuilds` dir, so create it first: `mkdir -p ../trustnotebuilds`


### Android

- Install Android SDK
- Run `make android-debug`

### iOS

- Install Xcode 7 (or newer)
- Install Cordova 6 `npm install cordova@6 -g`
- Run `make ios-debug`
  * In case of ios-deploy missing error: `npm install -g ios-deploy`
  * In case of `DeviceSupport` missing error, run `cd /Applications/Xcode.app/Contents/Developer/Platforms/iPhoneOS.platform/DeviceSupport/ && sudo ln -s 10.3.1\ \(14E8301\)/ 10.3`
  * If you encounter 'bitcore' not found after app launch, install it also `npm install bitcore-lib` and remove `../bytebalbuilds/project-IOS` folder completely, then rerun make again.
  * On code signing error, open Xcode project `../trustnotebuilds/project-IOS/platforms/ios/TrustNote.xcodeproj` in Xcode, open project properties, select TrustNote target and set your AppleID account as a team. Xcode may also ask you to change bundle identifier to be unique, just append any random string to 'org.trustnote.smartwallet' bundle identifier.

### macOS

- `grunt desktop`
- copy `node_modules` into the app bundle ../trustnotebuilds/TrustNote/osx64/TrustNote.app/Contents/Resources/app.nw, except those that are important only for development (karma, grunt, jasmine)
- `grunt dmg`

### Windows

- `grunt desktop`
- copy `node_modules` into the app bundle ../trustnotebuilds/TrustNote/win64, except those that are important only for development (karma, grunt, jasmine)
- `grunt inno64`

### Linux

- `grunt desktop`
- copy `node_modules` into the app bundle ../trustnotebuilds/TrustNote/linux64, except those that are important only for development (karma, grunt, jasmine)
- `grunt linux64`


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

## Credits

The GUI is based on [Copay](https://github.com/bitpay/copay), the most beautiful and easy to use Bitcoin wallet.

## License

MIT.
