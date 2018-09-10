'use strict';

var breadcrumbs = require('trustnote-common/breadcrumbs.js');

//Setting up route
angular
	.module('trustnoteApp')
	.config(function ($logProvider, $stateProvider, $urlRouterProvider, $compileProvider) {
		$urlRouterProvider.otherwise('/');

		$logProvider.debugEnabled(true);

		// whitelist 'chrome-extension:' for chromeApp to work with image URLs processed by Angular
		// link: http://stackoverflow.com/questions/15606751/angular-changes-urls-to-unsafe-in-extension-page?lq=1
		$compileProvider.imgSrcSanitizationWhitelist(/^\s*((https?|ftp|file|blob|chrome-extension):|data:image\/)/);

		$stateProvider
			.state('splash', {
				url: '/splash',
				needProfile: false,
				views: {
					'main': {
						templateUrl: 'views/splash.html',
					}
				}
			})
			.state('backupWaring', {
				url: '/backupWaring',
				needProfile: false,
				views: {
					'main': {
						templateUrl: 'views/includes/backupWaring.html',
					}
				}
			});


		$stateProvider
			.state('walletHome', {
				url: '/',
				walletShouldBeComplete: true,
				needProfile: true,
				deepStateRedirect: true,
				sticky: true,
				views: {
					'main': {
						templateUrl: 'views/walletHome.html',
					}
				}
			})
			
			.state('create', {
				url: '/create',
				templateUrl: 'views/create.html',
				needProfile: true,
				modal: true,
				views: {
					'main': {
						templateUrl: 'views/create.html'
					}
				}
			})


			// 扫码后 --> 登陆页面
			.state('login', {
				url: '/login',
				templateUrl: 'views/includes/login.html',
				needProfile: true,
				modal: true,
				views: {
					'main': {
						templateUrl: 'views/includes/login.html'
					}
				}
			})
			// 扫码后 --> send页面
			.state('payment', {
				url: '/sendassets',
				templateUrl: 'views/includes/sendassets.html',
				needProfile: true,
				modal: true,
				views: {
					'main': {
						templateUrl: 'views/includes/sendassets.html'
					}
				}
			})

			.state('copayers', {
				url: '/copayers',
				needProfile: true,
				views: {
					'main': {
						templateUrl: 'views/copayers.html'
					}
				}
			})
			.state('correspondentDevices', {
				url: '/correspondentDevices',
				walletShouldBeComplete: false,
				needProfile: true,
				deepStateRedirect: true,
				sticky: true,
				views: {
					'chat': {
						templateUrl: 'views/correspondentDevices.html'
					}
				}
			})
			// 修该代码如下
			.state('mywallet', {
				url: '/mywallet',
				walletShouldBeComplete: false,
				needProfile: true,
				deepStateRedirect: true,
				sticky: true,
				views: {
					'main': {
						templateUrl: 'views/mywallet.html'
					}
				}
			})



			// 聊天编辑  点击返回
			.state('correspondentDevices.correspondentDevice', {
				url: '/device',
				walletShouldBeComplete: false,
				needProfile: true,
				views: {
					'dialog': {
						templateUrl: 'views/correspondentDevice.html'
					}
				}
			})
			// 聊天编辑  点击返回  结束


			// 聊天页面  点击编辑
			.state('correspondentDevices.correspondentDevice.editCorrespondentDevice', {
				url: '/edit',
				walletShouldBeComplete: false,
				needProfile: true,
				views: {
					'dialog@correspondentDevices': {
						templateUrl: 'views/editCorrespondentDevice.html'
					}
				}
			})
			// 聊天页面 点击编辑 结束


			.state('correspondentDevices.addCorrespondentDevice', {
				url: '/add',
				needProfile: true,
				views: {
					'dialog': {
						templateUrl: 'views/addCorrespondentDevice.html'
					}
				}
			})
			.state('correspondentDevices.addCorrespondentDevice.inviteCorrespondentDevice', {
				url: '/invite',
				walletShouldBeComplete: false,
				needProfile: true,
				views: {
					'dialog@correspondentDevices': {
						templateUrl: 'views/inviteCorrespondentDevice.html'
					}
				}
			})
			.state('correspondentDevices.addCorrespondentDevice.acceptCorrespondentInvitation', {
				url: '/acceptCorrespondentInvitation',
				walletShouldBeComplete: false,
				needProfile: true,
				views: {
					'dialog@correspondentDevices': {
						templateUrl: 'views/acceptCorrespondentInvitation.html'
					}
				}
			})
			.state('correspondentDevices.bot', {
				url: '/bot/:id',
				walletShouldBeComplete: false,
				needProfile: true,
				views: {
					'dialog': {
						templateUrl: 'views/bot.html'
					}
				}
			})
			.state('authConfirmation', {
				url: '/authConfirmation',
				walletShouldBeComplete: true,
				needProfile: true,
				views: {
					'main': {
						templateUrl: 'views/authConfirmation.html'
					}
				}
			})
			.state('preferences', {
				url: '/preferences',
				templateUrl: 'views/preferences.html',
				walletShouldBeComplete: true,
				needProfile: true,
				modal: true,
				views: {
					'main': {
						templateUrl: 'views/preferences.html',
					}
				}
			})
			.state('preferences.preferencesColor', {
				url: '/color',
				templateUrl: 'views/preferencesColor.html',
				walletShouldBeComplete: true,
				needProfile: true,
				views: {
					'main@': {
						templateUrl: 'views/preferencesColor.html'
					}
				}
			})

			// 路由到： 冷钱包认证码
			.state('preferences.preferencesCold', {
				url: '/cold',
				templateUrl: 'views/preferencesCold.html',
				walletShouldBeComplete: true,
				needProfile: true,
				views: {
					'main@': {
						templateUrl: 'views/preferencesCold.html'
					}
				}
			})

			// 添加路由：T口令 --- 接收/发送糖果
			.state('preferences.preferencesTcode', {
				url: '/tcode',
				templateUrl: 'views/preferencesTcode.html',
				walletShouldBeComplete: true,
				needProfile: true,
				views: {
					'main@': {
						templateUrl: 'views/preferencesTcode.html'
					}
				}
			})
			.state('preferences.preferencesTcode.send', {
				url: '/airDrop',
				templateUrl: 'views/includes/airDrop.html',
				walletShouldBeComplete: true,
				needProfile: true,
				views: {
					'main@': {
						templateUrl: 'views/includes/airDrop.html'
					}
				}
			})
			.state('preferences.preferencesTcode.receive', {
				url: '/airDropReceive',
				templateUrl: 'views/includes/airDropReceive.html',
				walletShouldBeComplete: true,
				needProfile: true,
				views: {'main@': {templateUrl: 'views/includes/airDropReceive.html'}}
			})
			.state('preferences.preferencesTcode.preferencesRecords', {
				url: '/records',
				templateUrl: 'views/preferencesRecords.html',
				walletShouldBeComplete: true,
				needProfile: true,
				views: {
					'main@': {
						templateUrl: 'views/preferencesRecords.html'
					}
				}
			})


			.state('preferences.preferencesAlias', {
				url: '/alias',
				templateUrl: 'views/preferencesAlias.html',
				walletShouldBeComplete: true,
				needProfile: true,
				views: {
					'main@': {
						templateUrl: 'views/preferencesAlias.html'
					}

				}
			})
			.state('preferences.preferencesAdvanced', {
				url: '/advanced',
				templateUrl: 'views/preferencesAdvanced.html',
				walletShouldBeComplete: true,
				needProfile: true,
				views: {
					'main@': {
						templateUrl: 'views/preferencesAdvanced.html'
					}
				}
			})
			.state('preferences.preferencesAdvanced.preferencesInformation', {
				url: '/information',
				walletShouldBeComplete: true,
				needProfile: true,
				views: {
					'main@': {
						templateUrl: 'views/preferencesInformation.html'
					}
				}
			})
			.state('preferences.preferencesAdvanced.preferencesDeleteWallet', {
				url: '/delete',
				templateUrl: 'views/preferencesDeleteWallet.html',
				walletShouldBeComplete: true,
				needProfile: true,
				views: {
					'main@': {
						templateUrl: 'views/preferencesDeleteWallet.html'
					}
				}
			})
			.state('preferencesGlobal', {
				url: '/preferencesGlobal',
				needProfile: true,
				modal: true,
				views: {
					'main': {
						templateUrl: 'views/preferencesGlobal.html',
					}
				}
			})
			.state('preferencesGlobal.preferencesDeviceName', {
				url: '/deviceName',
				walletShouldBeComplete: false,
				needProfile: false,
				views: {
					'main@': {
						templateUrl: 'views/preferencesDeviceName.html'
					}
				}
			})
			.state('preferencesGlobal.preferencesHub', {
				url: '/hub',
				walletShouldBeComplete: false,
				needProfile: false,
				views: {
					'main@': {
						templateUrl: 'views/preferencesHub.html'
					}
				}
			})
			.state('preferencesGlobal.preferencesLanguage', {
				url: '/language',
				walletShouldBeComplete: true,
				needProfile: true,
				views: {
					'main@': {
						templateUrl: 'views/preferencesLanguage.html'
					}
				}
			})
			.state('preferencesGlobal.backup', {
				url: '/backup',
				templateUrl: 'views/backup.html',
				walletShouldBeComplete: true,
				needProfile: true,
				views: {
					'main@': {
						templateUrl: 'views/backup.html'
					}
				}
			})


			// 点击 进入钱包恢复页面
			.state('preferencesGlobal.recoveryFromSeed', {
				url: '/recoveryFromSeed',
				templateUrl: 'views/recoveryFromSeed.html',
				walletShouldBeComplete: true,
				needProfile: true,
				views: {
					'main@': {
						templateUrl: 'views/recoveryFromSeed.html'
					}
				}
			})

			.state('preferencesGlobal.recoveryFromSeeddir', {
				url: '/recoveryFromSeeddir',
				templateUrl: 'views/recoverFormSeedDir.html',
				walletShouldBeComplete: true,
				needProfile: true,
				views: {
					'main@': {
						templateUrl: 'views/recoverFormSeedDir.html'
					}
				}
			})


			.state('preferencesGlobal.synchronization', {
				url: '/synchronization',
				templateUrl: 'views/synchronization.html',
				walletShouldBeComplete: true,
				needProfile: true,
				views: {
					'main@': {
						templateUrl: 'views/synchronization.html'
					}
				}
            })
            
			.state('preferencesGlobal.preferencesAbout', {
				url: '/about',
				templateUrl: 'views/preferencesAbout.html',
				walletShouldBeComplete: true,
				needProfile: true,
				views: {
					'main@': {
						templateUrl: 'views/preferencesAbout.html'
					}
				}
			})
			.state('preferencesGlobal.preferencesAbout.disclaimer', {
				url: '/disclaimer',
				needProfile: false,
				views: {
					'main@': {
						templateUrl: 'views/disclaimer.html',
					}
				}
			})
			.state('preferencesGlobal.preferencesAbout.translators', {
				url: '/translators',
				walletShouldBeComplete: true,
				needProfile: true,
				views: {
					'main@': {
						templateUrl: 'views/translators.html'
					}
				}
			})

			.state('add', {
				url: '/add',
				needProfile: true,
				views: {
					'main': {
						templateUrl: 'views/add.html'
					}
				}
			})
			.state('cordova', { // never used
				url: '/cordova/:status/:isHome',
				views: {
					'main': {
						controller: function ($rootScope, $state, $stateParams, $timeout, go, isCordova) {
							console.log('cordova status: ' + $stateParams.status);
							switch ($stateParams.status) {
								case 'resume':
									$rootScope.$emit('Local/Resume');
									break;
								case 'backbutton':
									if (isCordova && $stateParams.isHome == 'true' && !$rootScope.modalOpened)
										navigator.app.exitApp();
									else
										$rootScope.$emit('closeModal');
									break;
							};
							// why should we go home on resume or backbutton?
							/*
							 $timeout(function() {
							 $rootScope.$emit('Local/SetTab', 'walletHome', true);
							 }, 100);
							 go.walletHome();
							 */
						}
					}
				},
				needProfile: false
			});
	})
	.run(function ($rootScope, $state, $log, uriHandler, isCordova, profileService, storageService, $timeout, nodeWebkit, uxLanguage, animationService) {
		FastClick.attach(document.body);

		uxLanguage.init();

		// Register URI handler, not for mobileApp
		if (!isCordova) {
			uriHandler.register();
		}


// 更改代码
		// if (nodeWebkit.isDefined()) {
		//   var gui = require('nw.gui');
		//   var win = gui.Window.get();
		//   var nativeMenuBar = new gui.Menu({
		//     type: "menubar"
		//   });
		//   try {
		//     nativeMenuBar.createMacBuiltin("Trustnote");
		//   } catch (e) {
		//     $log.debug('This is not OSX');
		//   }
		//   win.menu = nativeMenuBar;
		// }

		$rootScope.$on('$stateChangeStart', function (event, toState, toParams, fromState, fromParams) {

			if (!profileService.profile && toState.needProfile) {

				// Give us time to open / create the profile
				event.preventDefault();

				if (!profileService.assocVisitedFromStates)
					profileService.assocVisitedFromStates = {};
				breadcrumbs.add('$stateChangeStart no profile from ' + fromState.name + ' to ' + toState.name);
				if (profileService.assocVisitedFromStates[fromState.name] && !fromState.name)
					return breadcrumbs.add("already loading profile, ignoring duplicate $stateChangeStart from " + fromState.name);
				profileService.assocVisitedFromStates[fromState.name] = true;

				// Try to open local profile
				profileService.loadAndBindProfile(function (err) {
					delete profileService.assocVisitedFromStates[fromState.name];
					if (err) {
						if (err.message && err.message.match('NOPROFILE')) {
							$log.debug('No profile... redirecting');
							$state.transitionTo('splash');
						}
						else if (err.message && err.message.match('NONAGREEDDISCLAIMER')) {
							$log.debug('Display disclaimer... redirecting');
							$state.transitionTo('preferencesGlobal.preferencesAbout.disclaimer');
						} else {
							throw new Error(err); // TODO
						}
					} else {
						$log.debug('Profile loaded ... Starting UX.');
						storageService.gethaschoosen(function (err, val) {
							if (val == 1) {
								$log.debug('No choosen... redirecting');
								$state.transitionTo('backupWaring');
							}
							else {
								$state.transitionTo(toState.name || toState, toParams);
							}
						});

					}
				});
			}

			if (profileService.focusedClient && !profileService.focusedClient.isComplete() && toState.walletShouldBeComplete) {
				$state.transitionTo('copayers');
				event.preventDefault();
			}

			if (!animationService.transitionAnimated(fromState, toState)) {
				event.preventDefault();
				// Time for the backpane to render
				setTimeout(function () {
					$state.transitionTo(toState);
				}, 50);
			}
		});
	});
