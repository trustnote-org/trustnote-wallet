## TrustNote

TrustNote是一个社区开源项目，提供可靠可信的区块链公有网络服务，社区版钱包也命名为TrustNote，整个项目都是由TrustNote基金会提供支持。

本项目是TrustNote社区版钱包，安全，简单，易用。钱包内功能包括：转账交易、私密即时消息、安全方案、支持TRC20 Token 等等。

我们希望有兴趣的开发者加入社区，为TrustNote项目贡献代码和国际化语言。TrustNote会在社区共同努力下，逐渐成为世界一流的区块链公有网络。

详细内容见官方网站 [trustnote.org](https://trustnote.org/)

## 软件下载

官方下载: 
- [trustnote.org](https://trustnote.org/application.html)

Github release: 
- [github.com](https://github.com/trustnote/trustnote-wallet/releases)


## 安装

我们提供了多个平台的可执行程序，你可以点击上面的下载链接开始使用TrustNote钱包，也可以使用项目源代码编译成可执行程序。

#### 安装依赖

**需要针对自己使用的操作系统架构选择合适的软件包。**

- git
- [Node.js v8.9.4](https://nodejs.org/dist/v8.9.4/)
- bower
    - `npm install -g bower@1.8.2`
- nw-gyp
    - `npm install -g nw-gyp`


##### Windows

**方法一**

- 用管理员权限打开PowerShell，执行 `npm install --global --production windows-build-tools`
- 配置环境变量 `GYP_MSVS_VERSION = 2015`
- 配置环境变量 在 `PATH` 添加Python安装目录
- `npm config set msvs_version 2015`

参考 [windows-build-tools](https://github.com/felixrieseberg/windows-build-tools)


**方法二**

- 安装 [Visual Studio 2017](https://visualstudio.microsoft.com/zh-hans/thank-you-downloading-visual-studio/?sku=Community&rel=15)，在安装选项中选择VC++ 2015 (v140)工具集。
- 安装 [Python 2.7.14](https://www.python.org/downloads/release/python-2714/)
- 配置环境变量 在 `PATH` 添加Python安装目录
- 配置环境变量 `GYP_MSVS_VERSION = 2017`
- `npm config set msvs_version 2017`


#### 克隆项目代码

```sh
git clone https://github.com/trustnote/trustnote-wallet.git
cd trustnote-wallet
```

#### 编译项目

```sh
# ./trustnote-wallet

bower install
npm install
npm rebuild sqlite3 --build-from-source --runtime=node-webkit --target_arch=x64 --target=0.26.6
cd node_modules/ffi
nw-gyp rebuild --target=0.26.6
cd ../ref
nw-gyp rebuild --target=0.26.6
cd ../..
```

#### 运行程序:

```sh
# ./trustnote-wallet
npm run start
```

#### 软件打包

在trustnote-wallet目录下操作，完成之后会在上级目录trustnotebuilds中生成安装包。

```
--|
  | trustnote-wallet
  | trustnotebuilds
```

##### Android

- 安装 Android SDK （参考 https://developer.android.google.cn/studio/）
- 运行 `npm run android`

##### iOS

- 安装 Xcode 9 (或最新版本)
- 安装 Cordova `npm install -g cordova`
- 安装 ios-deploy `npm install -g ios-deploy`
- 执行 `npm run ios`


##### macOS

- `npm run osx64`

##### Windows

- `npm run win64`

##### Linux

- `npm run linux64`


## TrustNote备份和恢复

TrustNote使用过程中，会在用户目录生成缓存文件，用来保存账本数据和个人设置，并且在卸载软件后不会主动删除这些缓存文件，防止错误卸载软件而丢失个人数字资产，重新安装软件就可恢复数据。若用户已确定要删除这些废弃的数据，可按照下面的操作系统位置去操作。

* macOS: `~/Library/Application Support/TTT`
* Linux: `~/.config/TTT`
* Windows: `%LOCALAPPDATA%\TTT`


## 问题反馈

* [GitHub Issues](https://github.com/trustnote/trustnote-wallet/issues)
* [Email Support](mailto:foundation@trustnote.org)

## 许可证

MIT

