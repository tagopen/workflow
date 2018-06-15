
(($, sr) => {

  // debouncing function from John Hann
  // http://unscriptable.com/index.php/2009/03/20/debouncing-javascript-methods/
  const debounce = (func, threshold, execAsap) => {
    let timeout

    return function debounced () {
      const obj =    this
      const args =   arguments
      function delayed () {
        if (!execAsap) {
          func.apply(obj, args)
        }

        timeout = null
      }

      if (timeout) {
        clearTimeout(timeout)
      } else if (execAsap) {
        func.apply(obj, args)
      }

      timeout = setTimeout(delayed, threshold || 100)
    }
  }
  // smartresize
  jQuery.fn[sr] = function(fn){  return fn ? this.bind('resize', debounce(fn)) : this.trigger(sr) }

})(jQuery,'smartresize')

// ================================================================================== //

  // # Document on Ready
  // # Document on Resize
  // # Document on Scroll
  // # Document on Load

  // # Old browser notification
  // # Anchor scroll
  // # Phone masked input
  // # Ajax form send
  // # Basic Elements

// ================================================================================== //


const GRVE = GRVE || {};


(($ => {
  // # Document on Ready
  // ============================================================================= //
  GRVE.documentReady = {
    init() {
      GRVE.outlineJS.init()
      GRVE.anchorScroll.init('a[data-scroll][href*="#"]:not([href="#"])')
      GRVE.pageSettings.init()
      GRVE.basicElements.init()
      GRVE.phoneMask.init()
      GRVE.ajax.init()
    }
  }

  // # Document on Resize
  // ============================================================================= //
  GRVE.documentResize = {
    init() {

    }
  }

  // # Document on Scroll
  // ============================================================================= //
  GRVE.documentScroll = {
    init() {

    }
  }

  // # Document on Load
  // ============================================================================= //
  GRVE.documentLoad = {
    init() {

    }
  }

  // # Remove outline on focus
  // ============================================================================= //
  GRVE.outlineJS = {
    init() {
      const self =           this

      this.styleElement =    document.createElement('STYLE'),
      this.domEvents =       'addEventListener' in document

      document.getElementsByTagName('HEAD')[0].appendChild(this.styleElement)

      // Using mousedown instead of mouseover, so that previously focused elements don't lose focus ring on mouse move
      this.eventListner('mousedown', () => {
        self.setCss(':focus{outline:0 !important}')
      })

      this.eventListner('keydown', () => {
        self.setCss('')
      })
    },
    setCss(css_text) {
      // Handle setting of <style> element contents in IE8
      !!this.styleElement.styleSheet ? this.styleElement.styleSheet.cssText = css_text : this.styleElement.innerHTML = css_text
    },
    eventListner(type, callback) {
      // Basic cross-browser event handling
      if (this.domEvents) {
        document.addEventListener(type, callback)
      } else {
        document.attachEvent(`on${type}`, callback)
      }
    }
  }


  // # Check window size in range
  // ============================================================================= //
  GRVE.isWindowSize = {
    init(min = undefined, max = undefined) {
      let media

      if (min !== undefined && max !== undefined) {
        media = matchMedia(`only screen and (min-width: ${min}px) and (max-width: ${max}px)`)
      } else if (min !== undefined && max === undefined) {
        media = matchMedia(`only screen and (min-width: ${min}px)`)
      } else if (min === undefined && max !== undefined) {
        media = matchMedia(`only screen and (max-width: ${max}px)`)
      } else {
        return true
      }

      return media.matches

    }
  }

  // # Anchor scrolling effect
  // ============================================================================= //
  GRVE.anchorScroll = {
    init(selector) {
      const $selector = $(selector)

      if (!$selector.length) return

      $selector.on('click', () => {
        if (location.pathname.replace(/^\//, '') == this.pathname.replace(/^\//, '') && location.hostname == this.hostname) {
          let target = $(this.hash)
          target = target.length ? target : $(`[name=${this.hash.slice(1)}]`)

          if (target.length) {
            $('html, body').animate({
              scrollTop: (target.offset().top + 3)
            }, 1000)
            return false
          }
        }
      })
    }
  }

  // # Phone masked input
  // ============================================================================= //
  GRVE.phoneMask = {
    init() {
      $('[type="tel"]').mask('+38 (099) 999 99 99')
    }
  }

// # Ajax send Form
  // ============================================================================= //
  GRVE.ajax = {
    init() {
      const self = this
      const parsleyOptions = {
        excluded:                'input[type=button], input[type=submit], input[type=reset], [disabled]',
        successClass:            'form-group--success',
        errorClass:              'form-group--error',
        errorsMessagesDisabled:  true,
        minlength:               2,
        classHandler(el) {
          return el.$element.closest(".form-group")
        }
      }
      this.customValidation()
      const $forms = $('.js-form')

      if (!$forms.length) return false
      $forms.parsley(parsleyOptions)
      $forms.on('submit', function(e) {
        const $form = $(this)
        $form.parsley().validate()

        if ($form.parsley().isValid()) {
          self.send( $(this) )
        }

        e.preventDefault()
      })
    },
    send($form) {
      const self =        this

      const isWP =        $form.is("[data-form-ajax=\"wp\"]")
      const $submit =     $form.find('[type=submit]')
      const url =         isWP ? '/wp-admin/admin-ajax.php' : $form.attr('action')
      const type =        ($form.attr('method')) ? $form.attr('method') : 'post'
      const data =        new FormData($form[0])
      const formName =    $submit.val()
      const redirect =    $form.data("redirect")

      this.$result =      $form.find('.result')
      this.$submit =      $submit

      isWP && data.append('action', 'site_form')
      data.append('form', formName)

      $.ajax({
        url:              url,
        type:             type,
        data,
        dataType:         'json',
        processData:      false,
        contentType:      false,
        cache:            false,
        beforeSend() {
          self.progress('hide')
        },
        complete() {
          self.progress('show')
        },
        success(data) {
          if (!data.success) {
            const error = "Возникли проблемы с сервером. Сообщите нам о ошибке, мы постараемся устранить её в ближайшее время."
            console.log(error)
            self.submitFail(error)
          } else if (data.success) {
            $('.modal').modal('hide')
            $('#success').modal('show')
            if (redirect || data.redirect) {
              document.location.href = redirect
            }
            $form.trigger("reset")
          }
        },

        error(XMLHttpRequest, textStatus, errorThrown) {
          self.submitFail(textStatus || errorThrown)
        }
      })
    },
    submitFail(msg) {
      this.alert(msg, "danger")
      return false
    },
    submitDone(msg) {
      this.alert(msg, "success")
      return true
    },
    alert(msg, status) {
      const self =   this
      const $alert = `<div class="alert alert-${status} alert-dismissable fade show" role="alert"><button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times</span></button>${msg}</div>`

      this.$result.html($alert)
      if (status === "success") {
        setTimeout(() => {
          self.$result.slideUp(() => {
            self.$result.html('')
          })
        }, 3000)
      }
    },
    progress(status) {
      if (status === 'hide') {
        this.$submit.prop('disabled', true)
      } else if (status === 'show') {
        this.$submit.prop('disabled', false)
      }
    },
    customValidation() {
      window.Parsley.addValidator('robots', {
        validateString(value) {
          return (value === '') ? true : false
        }
      })
    },
  }

  // # Page Settings
  // ============================================================================= //
  GRVE.pageSettings = {
    init() {
      this.svgPolifill()
      //this.rangeSlider("[data-range-slider]")
    },
    svgPolifill() {
      svg4everybody()
    },
    rangeSlider(target) {
      const $rangeSlider =  $(target)

      const min =      ( parseInt( $rangeSlider.attr("min")) ) ? parseInt( $rangeSlider.attr("min") ) : 0
      const max =      ( parseInt( $rangeSlider.attr("max")) ) ? parseInt( $rangeSlider.attr("max") ) : 1
      const step =     ( parseInt( $rangeSlider.attr("step")) ) ? parseInt( $rangeSlider.attr("step") ) : 1
      const from =    ( parseInt( $rangeSlider.attr("value")) ) ? parseInt( $rangeSlider.attr("value") ) : 0

      $rangeSlider.ionRangeSlider({
        type: "single",
        grid: false,
        step: step,
        min: min,
        max: max,
        from: from,
        hide_min_max: true,
      });
    }
  }


  // # Basic Elements
  // ============================================================================= //
  GRVE.basicElements = {
    init() {

    },
    carousel() {

      const $element = $('.js-carousel')

      $element.each(function(){

        const $carousel =     $(this)
        const $nextNav =      $carousel.find('.js-carousel-next')
        const $prevNav =      $carousel.find('.js-carousel-prev')
        const sliderSpeed =   ( parseInt( $carousel.attr('data-slider-speed') ) ) ? parseInt( $carousel.attr('data-slider-speed') ) : 3000
        const pagination = $carousel.attr('data-pagination') != 'no' ? true : false
        const paginationSpeed = ( parseInt( $carousel.attr('data-pagination-speed') ) ) ? parseInt( $carousel.attr('data-pagination-speed') ) : 400
        const autoHeight = $carousel.attr('data-slider-autoheight') == 'yes' ? true : false
        const autoPlay = $carousel.attr('data-slider-autoplay') != 'no' ? true : false
        const sliderPause = $carousel.attr('data-slider-pause') == 'yes' ? true : false
        const loop = $carousel.attr('data-slider-loop') != 'no' ? true : false
        const itemNum = parseInt( $carousel.attr('data-items'))
        const tabletLandscapeNum = $carousel.attr('data-items-tablet-landscape') ? parseInt( $carousel.attr('data-items-tablet-landscape')) : 3
        const tabletPortraitNum = $carousel.attr('data-items-tablet-portrait') ? parseInt( $carousel.attr('data-items-tablet-portrait')) : 3
        const mobileNum = $carousel.attr('data-items-mobile') ? parseInt( $carousel.attr('data-items-mobile')) : 1
        const gap = $carousel.hasClass('js-with-gap') && !isNaN( $carousel.data('gutter-size') ) ? Math.abs( $carousel.data('gutter-size') ) : 0

        // Carousel Init
        $carousel.owlCarousel({
          loop,
          autoplay : autoPlay,
          autoplayTimeout : sliderSpeed,
          autoplayHoverPause : sliderPause,
          smartSpeed : 500,
          dots : pagination,
          responsive : {
            0 : {
              items : mobileNum
            },
            768 : {
              items : tabletPortraitNum
            },
            1024 : {
              items : tabletLandscapeNum
            },
            1200 : {
              items : itemNum
            }
          },
          margin : gap
        })

        $carousel.css('visibility','visible')

        // Go to the next item
        $nextNav.click(() => {
          $carousel.trigger('next.owl.carousel')
        })
        // Go to the previous item
        $prevNav.click(() => {
          $carousel.trigger('prev.owl.carousel')
        })
      })
    },
    wowjs() {
      var wow = new WOW({
        boxClass:     'js-wow',      // animated element css class (default is wow)
        animateClass: 'animated', // animation css class (default is animated)
        offset:       0,          // distance to the element when triggering the animation (default is 0)
        mobile:       false       // trigger animations on mobile devices (true is default)
      })
      wow.init()
    },
    countdown() {
      $('[data-countdown]').each(function() {
        const $this =                $(this)
        const finalDate =            $this.data('countdown')
        const delimeter =            (!!$this.data('countdown-delimeter') == true)  ? ':' : null
        const hoursCount =           $this.data('countdown-hours')
        const countdownFormat =      $this.data('countdown-format').split('|')
        let countdownItems =         ''
        let text =                   ''


        $.each( countdownFormat, (index, value) => {
          switch (value) {
            case 'w':
              text = "Недель"
              break
            case 'D':
            case 'd':
            case 'n':
              text = "Дней"
              break
            case 'H':
              text = "Часов"
              break
            case 'M':
              text = "Минут"
              break
            case 'S':
              text = "Секунд"
              break
            default:
              text = ''
          }
         
          countdownItems += '<div class="timer__item">'
          countdownItems += `<div class="timer__time">%${value}</div>`
          countdownItems += `<div class="timer__text">${text}</div>`
          countdownItems += '</div>'

          if (index === countdownFormat.length - 1) {
            return
          }

          if (delimeter) {
            countdownItems += '<div class="timer__item">'
            countdownItems += `<div class="timer__time">${delimeter}</div>`
            countdownItems += '</div>'
          }

        })

        $this.countdown(finalDate, function(event) {
          if (hoursCount) {
            const hours = event.offset.totalDays * 24 + event.offset.hours
            countdownItems = countdownItems.replace("%H", hours)
          }

          $(this).html(event.strftime( countdownItems ))
        })
      })
    },
  }


  $(document).ready(() => { GRVE.documentReady.init() })
  $(window).smartresize(() => { GRVE.documentResize.init() })
  $(window).on('load', () => { GRVE.documentLoad.init() })
  $(window).on('scroll', () => { GRVE.documentScroll.init() })
}))(jQuery)
