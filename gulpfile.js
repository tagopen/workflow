var gulp          = require('gulp'),
    browserSync   = require('browser-sync'),
    del           = require('del'),
    pngquant      = require('imagemin-pngquant'),
    critical      = require('critical').stream,
    ftp           = require( 'vinyl-ftp' ),
    $             = require('gulp-load-plugins')({scope: 'devDependencies', lazy: 'false'});

gulp.task('sass', function() {
  return gulp.src(['app/sass/**/*.+(scss|sass)'])
    .pipe($.plumber())
    .pipe($.sass({
      css: 'app/css',
      sass: 'app/sass',
      image: 'app/img'
    }))
    .pipe($.autoprefixer(['last 15 versions', '>1%', 'ie 10'], {cascade: true}))
    .pipe(gulp.dest('app/css'))
    .pipe(browserSync.reload({stream: true}));
});

gulp.task('scripts', ['bower'], function() {
  return gulp.src([
      'bower_components/jquery/dist/jquery.js',
      'bower_components/slick-carousel/slick/slick.js',
      'bower_components/bootstrap/dist/js/bootstrap.js'
    ])
  .pipe($.plumber())
  .pipe(gulp.dest('app/js'));
});

gulp.task('pug', function() {
  return gulp.src('app/views/*.pug')
  .pipe($.plumber())
  .pipe($.pug( {basedir: 'app', pretty: true}))
  .pipe(gulp.dest('app/'))
  .pipe(browserSync.reload({stream: true}));
});

gulp.task('fonts', function () {
  return gulp.src(['app/fonts/**/*.{woff,woff2}'])
    .pipe($.cssfont64())
    .pipe($.concat({path: 'fonts.css', cwd: ''}))
    .pipe(gulp.dest('app/css/'))
    .pipe(browserSync.stream());
});

gulp.task('bower', function() {
  return $.bower();
});

gulp.task('sprites', function () {
  return gulp.src('assets/svg/*.svg')
    .pipe(svgSprite({
      svgId: "svg-%f"
    }))
    .pipe(gulp.dest("assets"));
});

gulp.task('svgSprite', function () {
  return gulp.src('app/img/icons/**/*.svg')
    .pipe($.svgmin({
      js2svg: {
        pretty: true
      }
    }))
    .pipe($.cheerio({
      run: function ($) {
        $('[fill]').removeAttr('fill');
        $('[stroke]').removeAttr('stroke');
        $('[style]').removeAttr('style');
      },
      parserOptions: {xmlMode: true}
    }))
    .pipe($.replace('&gt;', '>'))
    // build svg sprite
    .pipe($.svgSprites({
      preview: false,
      selector: "ic--%f",
      mode: {
        symbol: {
          sprite: "../sprite.svg",
          render: {
            scss: {
              dest:'../../../sass/_sprite.scss',
              template: '../sass/base/_sprite_template.scss'
            }
          }
        }
      }
    }))
    .pipe(gulp.dest('app/img'));
});


gulp.task('css-libs', ['sass'], function() {
  return gulp.src([
    'app/css/libs.css'
    ])
  .pipe(gulp.dest('app/css'));
});

gulp.task('browser-sync',  ['pug', 'sass'], function() {
  browserSync({
    server: {
      baseDir: 'app'
    },
    notify: false
  });
});
/*
// Generate & Inline Critical-path CSS
gulp.task('critical', function () {
  return gulp.src('dist/*.html')
  .pipe(critical({base: 'dist/', inline: true, css: ['dist/styles/components.css','dist/styles/main.css']}))
  .pipe(gulp.dest('dist'));
});
*/
gulp.task('clean', function () {
  return del.sync('dist');
});

gulp.task('clear', function () {
  return $.cache.clearAll();
});

gulp.task('img', function() {
  return gulp.src('app/img/**/*')
    .pipe($.plumber())
    .pipe($.cache($.imagemin({
      interlaced: true,
      progressive: true,
      svgoPlugins: [{removeViewBox: false}],
      use: [pngquant()]
    })))
    .pipe(gulp.dest('dist/img'));
})

gulp.task('ftp', function() {
  var options = require("./settings.js");

  var conn = ftp.create( {
    host:     options.host,
    user:     options.user,
    password: options.password,
    parallel: 3,
    log:      $.util.log
  });

  return gulp.src( ['dist/**/*'], { base: './dist/', buffer: false } )
    .pipe(conn.newer(options.uploadPath)) // only upload newer files 
    .pipe(conn.dest(options.uploadPath));
});

gulp.task('test', function() {
  console.log($);
});

gulp.task('watch', ['browser-sync', 'pug', 'fonts', 'sass',  'scripts', 'css-libs'], function() {
  gulp.watch('app/sass/**/*.+(scss|sass)', ['sass']);
  gulp.watch('app/views/**/*.pug', ['pug']);
  gulp.watch('app/fonts/**/*', ['fonts']);
  gulp.watch('app/js/**/*.js', browserSync.reload);

});

gulp.task('build', ['clean', 'pug', 'img', 'scripts', 'sass'], function() {
  var buildCss = gulp.src([
      'app/css/**/*.css'
    ])
    .pipe($.plumber())
    //.pipe(gulp.dest('dist/css'))   // if need not minified files
    .pipe($.cleanCSS())
    .pipe($.rename({suffix: '.min'}))
    .pipe(gulp.dest('dist/css'));

  var buildFonts = gulp.src('app/font/**/*')
    .pipe(gulp.dest('dist/font'));

  var buildJs = gulp.src('app/js/**/*.js')
    .pipe(gulp.dest('dist/js'))
    .pipe($.uglifyjs())
    .pipe($.rename({suffix: '.min'}))
    //.pipe($.concat('all.min.js')) // if need concat js
    //.pipe($.uglify())
    .pipe(gulp.dest('dist/js'));

  var buildHtml = gulp.src('app/*.html')
    .pipe(useref())
    .pipe(gulpif('*.js', uglifyjs()))
    .pipe(gulpif('*.css', cleanCss()))
    .pipe(gulp.dest('dist'));
});

gulp.task('dev', ['clean', 'pug', 'fonts', 'img', 'sass', 'scripts'], function() {

  //var buildCss = gulp.src(['app/css/**/*.css'])  
  //  .pipe($.plumber())
  //  .pipe($.cleanCss())
  //  .pipe($.concat({path: 'bundle.min.css', cwd: ''}))
  //  .pipe(gulp.dest('demo/css'));

  //var buildJs = gulp.src(['app/js/**/*.js'])
  //  .pipe($.plumber())
    //.pipe($.uglifyjs())
    //.pipe($.javascriptObfuscator({
    //    compact: true
    //}))
  //  .pipe($.concat({path: 'bundle.min.js', cwd: ''}))
  // .pipe(gulp.dest('demo/js'));

  var BuildJs =  gulp.src('app/**/*.html')
    .pipe($.plumber({
      handleError: function (err) {
        console.log(err);
        this.emit('end');
      }
    }))
    .pipe($.useref({searchPath: 'app/'}))
    //.pipe($.selectors.run())
    .pipe($.if('*.js', $.uglifyjs()))
    .pipe($.if('*.css', $.cssnano({
            discardComments: {removeAll: true}
        })
    ))
    .pipe($.if('*.html', $.htmlMinifier({
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
        removeScriptTypeAttributes:       true
      })
    ))
    .pipe(gulp.dest('dist'));
});