'use strict';

var breadcrumbs = require('trustnote-pow-common/breadcrumbs.js');

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
            })
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
                views: {
                    'main@': {
                        templateUrl: 'views/includes/airDropReceive.html'
                    }
                }
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
            });
    })
    .run(function ($rootScope, $state, $log, profileService, storageService, uxLanguage, animationService) {
        FastClick.attach(document.body); // remove click delays on browsers with touch UIs

        uxLanguage.init();

        $rootScope.$on('$stateChangeStart', function (event, toState, toParams, fromState, fromParams) {

            if (!profileService.profile && toState.needProfile) {

                // Give us time to open / create the profile
                event.preventDefault();

                // Try to open local profile
                profileService.loadAndBindProfile(function (err) {
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
                        $log.debug('Profile loaded... Starting');
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
