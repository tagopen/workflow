'use strict';

import gulp             from 'gulp';
import browserSync      from 'browser-sync';
import del              from 'del';
import pngquant         from 'imagemin-pngquant';
import critical         from 'critical';
import ftp              from 'vinyl-ftp';
import gulpLoadPlugins  from 'gulp-load-plugins';

const $ = gulpLoadPlugins({scope: 'devDependencies', lazy: 'false'});

const dirs = {
  src:              './app',
  dest:             './dist'
};

const path = {
  build: {
    html:           dirs.dest + '/',
    js:             dirs.dest + '/js/',
    css:            dirs.dest + '/css/',
    img:            dirs.dest + '/img/',
    fonts:          dirs.dest + '/fonts/',
    mail:           dirs.dest + '/mail/',
    critical:       dirs.dest + 'dist/css/bundle.min.css'
  },
  src: {
    html:           dirs.src + '/',
    js:             dirs.src + '/js/',
    css:            dirs.src + '/css/',
    img:            dirs.src + '/img/',
    sass:           dirs.src + '/sass/',
    pug:            dirs.src + '/views/',
    fonts:          dirs.src + '/fonts/',
    sprite:         dirs.src + '/sass/utils'
  },
  watch: {
    html:           dirs.src + '/*.html',
    js:             dirs.src + '/js/**/*.js',
    sass:           dirs.src + '/sass/**/*.+(scss|sass)',
    template:       dirs.src + '/views/**/*',
    pug:            dirs.src + '/views/*.pug',
    img:            dirs.src + '/img/**/*.*',
    spritePng:      dirs.src + '/img/icons/**/*.png',
    fonts:          dirs.src + '/fonts/**/*.{woff,woff2}',
    mail:           dirs.src + '/mail/**/*'
  },
  clean:            dirs.dest,
  ftp:              dirs.dest + '**/*',
  outputDir:        dirs.src
};

gulp.task('sass', () => {
  return gulp.src([path.watch.sass])
    .pipe($.plumber())
    .pipe($.sass({
      css:           path.src.css,
      sass:          path.src.sass,
      image:         path.src.img,
      outputStyle:   'expanded'
    }))
    .pipe($.autoprefixer(['last 15 versions', '>1%', 'ie 10'], {cascade: true}))
    .pipe(gulp.dest(path.src.css))
    .pipe(browserSync.stream());
});

gulp.task('scripts', () => {
  return gulp.src([
    'node_modules/tether/dist/js/tether.js',
    'node_modules/bootstrap/dist/js/bootstrap.js',
    'node_modules/jquery/dist/jquery.js',
    'node_modules/bootstrap-validator/dist/validator.js',
    //'node_modules/jquery.cookie/jquery.cookie.js',
    //'node_modules/matchHeight/dist/jquery.matchHeight.js',
    //'node_modules/bootstrap-slider/dist/bootstrap-slider.js',
    //'node_modules/slick-carousel/slick/slick.js',
    //'node_modules/select2/dist/js/select2.js',
    //'node_modules/jquery-tags-input/src/jquery.tagsinput.js',
    //'node_modules/bootstrap-datepicker/dist/js/bootstrap-datepicker.js',
    //'node_modules/bootstrap-datepicker/dist/locales/*'
  ])
  .pipe($.plumber())
  .pipe(gulp.dest(path.src.js));
});

gulp.task('pug', () => {
 return gulp.src(path.watch.pug)
 .pipe($.plumber())
 .pipe($.data(function (file) {
   return {
     relativePath: file.history[0].replace(file.base, '').split(".")[0]
   }
 }))
 .pipe($.pug({
   basedir:     dirs.src,
   pretty:      true
 }))
 .pipe(gulp.dest(path.src.html));
});

// create a task that ensures the `js` task is complete before
// reloading browsers
gulp.task('pug:watch', ['pug'], function (done) {
    browserSync.reload();
    done();
});

gulp.task('fonts', () => {
 return gulp.src([path.watch.fonts])
   .pipe($.font2css.default())
   .pipe($.concat({path: 'fonts.css', cwd: ''}))
   .pipe(gulp.dest(path.src.css))
   .pipe(browserSync.stream());
});

gulp.task('bower', () => {
  return $.bower();
});

gulp.task('sprite', function() {
 gulp.src(path.watch.spritePng)
   .pipe($.plumber())
   .pipe($.spritesmith({
     imgName: 'sprite.png',
     //imgPath: 'app/img/sprite.png',
     //retinaSrcFilter: ['app/img/icons/*@2x.png'],
     //retinaImgName: 'sprite@2x.png',
     cssName: '_sprite.sass',
     cssFormat: 'sass',
     padding: 10
   }))
   .pipe($.if('*.png', 
     gulp.dest(path.src.img)
   ))
   .pipe($.if('*.css', 
     $.replace(/^\.icon-/gm, '.ic--'), 
     gulp.dest(path.src.sprite)
   ));
});

//gulp.task('svgSprite', function () {
//  return gulp.src('app/img/icons/**/*.svg')
//    .pipe($.svgmin({
//      js2svg: {
//        pretty: true
//      }
//    }))
//    .pipe($.cheerio({
//      run: function ($) {
//        $('[fill]').removeAttr('fill');
//        $('[stroke]').removeAttr('stroke');
//        $('[style]').removeAttr('style');
//      },
//      parserOptions: {xmlMode: true}
//    }))
//    .pipe($.replace('&gt;', '>'))
//    // build svg sprite
//    .pipe($.svgSprites({
//      preview: false,
//      selector: "ic--%f",
//      mode: {
//        symbol: {
//          sprite: "../sprite.svg",
//          render: {
//            scss: {
//              dest:'../../../sass/_sprite.scss',
//              template: '../sass/base/_sprite_template.scss'
//            }
//          }
//        }
//      }
//    }))
//    .pipe(gulp.dest('app/img'));
//});

gulp.task('server', function() {
  browserSync({
    server: {
      baseDir: dirs.src,
      reloadDelay: 2000,
      browser: "google chrome"
    },
    notify: false
  });
});

// Generate & Inline Critical-path CSS
gulp.task('critical', function () {
 return gulp.src(path.build.html)
   .pipe(critical.stream({
     base: 'dist/', 
     inline: true, 
     dimensions: [{
       width: 320,
       height: 480
     },{
       width: 768,
       height: 1024
     },{
       width: 1280,
       height: 960
     }],
       css: [path.build.critical],
       minify: true,
       extract: false,
       ignore: ['font-face']
     }))
   .pipe(gulp.dest(dirs.dest));
});

gulp.task('clean', function () {
  return del.sync(path.clean);
});

gulp.task('clear', function () {
  return $.cache.clearAll();
});

gulp.task('img', function() {
  return gulp.src(path.watch.img)
    .pipe($.plumber())
    .pipe($.cache($.imagemin({
      interlaced:    true,
      progressive:   true,
      svgoPlugins:   [{removeViewBox: false}],
      use:           [pngquant()]
    })))
    .pipe(gulp.dest(path.build.img));
})

gulp.task('ftp', () => {
  const options = require('./settings.js');

  let conn = ftp.create({
    host:       options.host,
    user:       options.user,
    password:   options.password,
    parallel:   3,
    log:        $.util.log
  });

  return gulp.src( [path.ftp], { base: dirs.dest, buffer: false } )
    //.pipe(conn.clean(options.uploadPath)) // remove files
    .pipe(conn.newer(options.uploadPath)) // only upload newer files 
    .pipe(conn.dest(options.uploadPath));
});

gulp.task('test', () => {
  console.log($);
});

// watch
gulp.task('watch', function(){

    $.watch([path.watch.spritePng], function(event, cb) {
        gulp.start('sprite');
    });

    $.watch([path.watch.sass], function(event, cb) {
        gulp.start('sass');
    });

    $.watch([path.watch.template], function(event, cb) {
        gulp.start('pug:watch');
    });

    $.watch([path.watch.fonts], function(event, cb) {
        gulp.start('fonts');
    });

     //билдим js в случае изменения
    $.watch([path.watch.js], function(event, cb) {
      browserSync.reload;
    });
});

//gulp.task('build', ['clean', 'pug', 'img', 'scripts', 'sass'], function() {
//  var buildCss = gulp.src([
//      'app/css/**/*.css'
//    ])
//    .pipe($.plumber())
//    //.pipe(gulp.dest('dist/css'))   // if need not minified files
//    .pipe($.cleanCSS())
//    .pipe($.rename({suffix: '.min'}))
//    .pipe(gulp.dest('dist/css'));
//
//  var buildFonts = gulp.src('app/font/**/*')
//    .pipe(gulp.dest('dist/font'));
//
//  var buildJs = gulp.src('app/js/**/*.js')
//    .pipe(gulp.dest('dist/js'))
//    .pipe($.uglifyjs())
//    .pipe($.rename({suffix: '.min'}))
//    //.pipe($.concat('all.min.js')) // if need concat js
//    //.pipe($.uglify())
//    .pipe(gulp.dest('dist/js'));
//
//  var buildHtml = gulp.src('app/*.html')
//    .pipe(useref())
//    .pipe(gulpif('*.js', uglifyjs()))
//    .pipe(gulpif('*.css', cleanCss()))
//    .pipe(gulp.dest('dist'));
//});

gulp.task('dev', ['clean', 'pug', 'fonts', 'sprite', 'img', 'sass', 'scripts'], () => {

  let buildmail = gulp.src(path.watch.mail)
    .pipe(gulp.dest(path.build.mail));

  return gulp.src(path.watch.html)
    .pipe($.plumber({
      handleError: function (err) {
        console.log(err);
        this.emit('end');
      }
    }))
    .pipe($.useref({
      searchPath: dirs.src
    }))
    .pipe($.if(
      '*.js', $.uglifyjs()
    ))
    .pipe($.if(
      '*.css', $.cssnano({
        discardComments: {removeAll: true}
      })
    ))
    .pipe($.if(
      '*.html', $.htmlMinifier({
        collapseWhitespace:               true, 
        collapseInlineTagWhitespace:      true,
        removeAttributeQuotes:            true,
        conservativeCollapse:             true,
        processConditionalComments:       true, 
        removeComments:                   true,
        removeEmptyAttributes:            true,
        sortAttributes:                   true,
        sortClassName:                    true,
        removeStyleLinkTypeAttributes:    true,
        removeScriptTypeAttributes:       true,
        minifyJS:                         true,
        minifyCSS:                        true
      })
    ))
   .pipe(gulp.dest(dirs.dest));
});

gulp.task('build', [
    'scripts',
    'pug',
    'sass',
    'fonts',
    'img',
    'sprite',
]);

gulp.task('default', ['build', 'watch', 'server']);
