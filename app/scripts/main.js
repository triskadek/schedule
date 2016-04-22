/*! Tiny Pub/Sub - v0.7.0 - 2013-01-29
* https://github.com/cowboy/jquery-tiny-pubsub
* Copyright (c) 2013 "Cowboy" Ben Alman; Licensed MIT */
(function ($) {

  var o = $({});

  $.subscribe = function () {
    o.on.apply(o, arguments);
  };

  $.unsubscribe = function () {
    o.off.apply(o, arguments);
  };

  $.publish = function () {
    o.trigger.apply(o, arguments);
  };

} (jQuery));

var Schedule = (function ($) {

  'use strict';

  var timeline = new TimelineMax(),
    isOpen = false,
    ui = {},
    leagues = [],
    baseUrl = 'http://pizarra.debbie.com.mx/widget/',
    elem,
    path = 'partidos',

    create = function (el) {

      if (!document.contains(el)) {
        return false;
      }

      // wrapp the element
      elem = $(el);

      cache();
      bind();
      subscriptions();

      $.publish('schedule/query');
    },

    cache = function () {

      ui = {
        trigger: elem.find('.o-sched__trigger'),
        thin: elem.find('.o-sched__thin'),
        wide: elem.find('.o-sched__wide'),
        background: elem.find('.o-sched__background'),
        close: elem.find('.o-sched__close-button'),
        scroller: elem.find('.js-scroll'),
        selectLeague: elem.find('#s-league'),
        loader: elem.find('.o-sched__loader')
      };

      // preparing the interaction 
      timeline
        .to(ui.thin, 0.1, { left: -50 })
        .to(ui.background, 0.1, { display: 'block' })
        .to(ui.background, 0.2, { opacity: 0.7 })
        .to(ui.wide, 0.3, { left: "0%" })
        .to(ui.close, 0.1, { display: 'block' })
        .to(ui.close, 0.3, { rotationY: '0deg', force3D: true });

      // stop the tween for first time
      timeline.stop();

    },

    bind = function () {
    
      ui.trigger.on('click', function (evt) {
        evt.preventDefault();
        toggle();
      });
      
      ui.background.on('click', function (evt) {
        evt.preventDefault();
        toggle();
      });

      ui.selectLeague.on('change', function () {
        $.publish('schedule/query:league', [this.value]);
      });
      
    },

    subscriptions = function () {
      $.subscribe('schedule/query', fetchJSON);
      $.subscribe('schedule/render', renderResults);
      $.subscribe('schedule/query:league', fetchByLeague);
    },

    fetchJSON = function (e, action) {
      ui.scroller.empty();
      ui.loader.show();
      
     $.post(baseUrl + path, function (res) {
        if (res.status === "ok") {
          ui.scroller.empty();
          
          leagues = res.leagues;
          
          setTimeout(function () {
            $.publish('schedule/render', [action]);
          }, 1500)

          console.log(leagues);
        }
      });
    },

    fetchByLeague = function (e, league) {

      path = '​';

      // check if a league exists
      if (typeof league !== undefined && typeof league !== null) {
        // get all the leagues
        if (league == "0") {
          path = 'partidos';
        } else {
          // get only specific league
          path = 'leagues/' + league;
        }
      }

      $.publish('schedule/query', ['LEAGUE_CHANGE']);
    },

    renderResults = function (e, action) {
      
      var dom = template('leagues-tpl')(leagues),
        opts = template('opt-league-tpl')(leagues),
        matches;
        
      ui.loader.hide();
      
      if (action !== undefined && action === 'LEAGUE_CHANGE') {
        ui.scroller
          .append(dom);
      } else {
        ui.scroller
          .append(dom);
        ui.selectLeague
          .append(opts);
      }

      matches = ui.scroller.find('.o-league__match');

      Ps.initialize(ui.scroller[0], {
        suppressScrollX: true
      });

      TweenMax.staggerFrom(matches, .5, { rotationX: '90deg', delay: 0.5, force3D: true }, 0.2);
    },

    toggle = function () {
     
      if (!isOpen) {
        elem
          .removeClass('js-collapsed')
          .addClass('js-opened');

        timeline.play();
      } else {
        elem
          .addClass('js-collapsed')
          .removeClass('js-opened');

        timeline.reverse();
      }

      return isOpen = !isOpen;
    },

    template = function (idTemplate) {
      var source = $('#' + idTemplate).html();
      return Handlebars.compile(source);
    }

  // public API
  return {
    create: create,
    toggle : toggle
  }

})(jQuery || window.jQuery);

(function (global) {

  var element = document.querySelector('.o-sched'),
    pizarra = Schedule.create(element);
   
   global.pizarra = pizarra;
   
})(window);
