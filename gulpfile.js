var gulp = require("gulp");
var exec = require("child_process").exec;
var concat = require("gulp-concat");
var copy = require("gulp-copy");
var inno = require("gulp-inno");
var gettext = require("gulp-angular-gettext");

// angular-gettext start
gulp.task("nggettext_extract", function() {
    return gulp
        .src([
            "public/index.html",
            "public/views/*.html",
            "public/views/**/*.html",
            "src/js/routes.js",
            "src/js/services/*.js",
            "src/js/controllers/*.js"
        ])
        .pipe(
            gettext.extract("template.pot", {
                // options to pass to angular-gettext-tools...
            })
        )
        .pipe(gulp.dest("i18n/po/template.pot"));
});

gulp.task("nggettext_compile", function() {
    return gulp
        .src("i18n/po/*.po")
        .pipe(
            gettext.compile({
                // options to pass to angular-gettext-tools...
                format: "json"
            })
        )
        .pipe(gulp.dest("public/languages"));
});
// angular-gettext end

// generate version start
gulp.task("version", function(cb) {
    exec("node ./util/version.js", function(err) {
        cb(err);
    });
});
// generate version end

// concat start
gulp.task("concat_angular", function() {
    return gulp
        .src([
            "bower_components/fastclick/lib/fastclick.js",
            "bower_components/qrcode-generator/js/qrcode.js",
            "bower_components/qrcode-decoder-js/lib/qrcode-decoder.js",
            "bower_components/moment/min/moment-with-locales.js",
            "bower_components/angular/angular.js",
            "bower_components/angular-ui-router/release/angular-ui-router.js",
            "bower_components/angular-foundation/mm-foundation-tpls.js",
            "bower_components/angular-moment/angular-moment.js",
            "bower_components/ng-lodash/build/ng-lodash.js",
            "bower_components/angular-qrcode/angular-qrcode.js",
            "bower_components/angular-gettext/dist/angular-gettext.js",
            "bower_components/angular-touch/angular-touch.js",
            "bower_components/angular-carousel/dist/angular-carousel.js",
            "bower_components/angular-ui-switch/angular-ui-switch.js",
            "bower_components/angular-elastic/elastic.js",
            "bower_components/ui-router-extras/release/ct-ui-router-extras.js"
        ])
        .pipe(concat("angular.js"))
        .pipe(gulp.dest("./public/"));
});

gulp.task("concat_js", function() {
    return gulp
        .src([
            "angular-bitcore-wallet-client/index.js",
            "src/js/app.js",
            "src/js/routes.js",
            "src/js/directives/*.js",
            "src/js/filters/*.js",
            "src/js/models/*.js",
            "src/js/services/*.js",
            "src/js/controllers/*.js",
            "src/js/version.js",
            "src/js/init.js"
        ])
        .pipe(concat("trustnote.js"))
        .pipe(gulp.dest("./public/"));
});

gulp.task("concat_css", function() {
    return gulp
        .src(["src/css/*.css"])
        .pipe(concat("trustnote.css"))
        .pipe(gulp.dest("./public/css/"));
});

gulp.task("concat_foundation", function() {
    return gulp
        .src([
            "bower_components/angular/angular-csp.css",
            "bower_components/foundation/css/foundation.css",
            "bower_components/animate.css/animate.css",
            "bower_components/angular-ui-switch/angular-ui-switch.css",
            "bower_components/angular-carousel/dist/angular-carousel.css"
        ])
        .pipe(concat("foundation.css"))
        .pipe(gulp.dest("./public/css/"));
});
// concat end

// copy start
gulp.task("copy_icon", function() {
    return gulp
        .src(["bower_components/foundation-icon-fonts/foundation-icons.*"])
        .pipe(copy("public/icons/", { prefix: 2 }));
});

gulp.task("copy_modules", function() {
    return gulp
        .src(["src/js/fileStorage.js"])
        .pipe(copy("./public/", { prefix: 2 }));
});
// copy end

gulp.task("concat", [
    "concat_angular",
    "concat_js",
    "concat_css",
    "concat_foundation"
]);

gulp.task("copy", ["copy_icon", "copy_modules"]);

gulp.task("win64", function() {
    return gulp.src("./webkitbuilds/setup-win64.iss").pipe(
        inno({
            verbose: false
        })
    );
});
gulp.task("osx64");
gulp.task("linux64");

gulp.task("default", ["nggettext_compile", "version", "concat", "copy"]);
