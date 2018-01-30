/*!
 * FiFoList
 * Version 1.0.2-2018.01.30
 * Requires jquery
 *
 * Examples at: https://github.com/jasterstary/fifolist/tree/master/example
 * Copyright (c) 2017 JašterStarý
 * Licensed under the MIT license:
 * http://www.opensource.org/licenses/MIT
 *
 */
;(function($, window, document) {
  var pluginName = 'FiFoList';
  var Plugin = function(element, options) {
    var that = this;
    this.element = element;
    this.maxListLength = 0;
    this.prepend = false;
    
    that._fast = false;

    this._listing = [];
    this._selfMoving = false;
    this._userMoving = false;
    this._closed = false;
    this._somewhere = false;
    this._lp = false;
    this._status = 3; // overflow & user, so at start are triggered onEmpty and onAuto functions.

    this._onEmpty = function(){
      $(this.element).trigger('fifolist-empty', {'count': this._listing.length});
    };
    this._onOverflow = function(){
      $(this.element).trigger('fifolist-overflow', {'count': this._listing.length});
    };
    this._onUser = function(){
      $(this.element).trigger('fifolist-user', {});
    };
    this._onAuto = function(){
      $(this.element).trigger('fifolist-auto', {});
    };

    this._onceUser = function(){
      if ((this._status&2) == 0)  {
        this._onUser();
        this._status = this._status | 2;
      }
    };

    this._onceAuto = function(){
      if ((this._status&2) == 2)  {
        this._onAuto();
        this._status = this._status & ~2;
      }
    };

    this._onceOverflow = function(){
      if ((this._status&1) == 0)  {
        this._onOverflow();
        this._status = this._status | 1;
      }
    };

    this._onceEmpty = function(){
      if ((this._status&1) == 1)  {
        this._onEmpty();
        this._status = this._status & ~1;
      }
    };

    this._drawLine = function(theLine) {
      if (this._closed) return false;
      var insertFunc = 'appendTo';
      if (that.prepend) {
        insertFunc = 'prependTo';
      };
      var container = that.element;
      switch(this._tag){
        case 'UL':
        case 'OL':
          var tag = '<li>';
        break;
        case 'TABLE':
        case 'TBODY':
          var tag = '<tr>';
          container = $(tag)[insertFunc](container);
          tag = '<td>';
        break;
        default:
          var tag = '<div>';
        break;
      };
      var el = $(tag)[insertFunc](container);
      el.text(theLine);
      that._listing.push(el);
      that._focus(el);
      if ((that.maxListLength)&&(that._listing.length > that.maxListLength)) {
        var toKill = that._listing.shift();
        $(toKill).remove();
      };
    };

    this._focus = function(el) {
      var $el = $(el);
      var $container = $(that.element);
      if ($container[0].scrollHeight > $container.height()) {
        that._onceOverflow();
      } else {
        that._onceEmpty();
      }
      if (this._userMoving) {
        if (this.prepend) {
          that._selfMoving = true;
          var pos = ($el.height() + $container.scrollTop());
          $container.scrollTop(pos);
          that._selfMoving = false;
        };
        return false;
      }
      
      if (that._selfMoving) {
        $container.stop(true);
        that._selfMoving = false;
        that._fast = true;
      };
      
      that._selfMoving = true;
      if (that.prepend) {
        that._userMoving = false;

        if (that._fast) {
          $container.scrollTop(0);
          that._selfMoving = false;
        } else {
          $container.animate({
            scrollTop: 0
          }, function(){
            that._selfMoving = false;
          });
        }

        return true;
      };
      
      if (that._fast) {
        $container.scrollTop(($el.offset().top - $container.offset().top + $container.scrollTop()));
        that._selfMoving = false;
      } else {
        $container.animate({
          scrollTop: ($el.offset().top - $container.offset().top + $container.scrollTop())
        }, function(){
          that._selfMoving = false;
        });
      }

      return true;
    };

    this._goto = function(where) {
      $container = $(that.element);
      switch (where) {
        case 'start':
          that._userMoving = true;
          that._selfMoving = true;
          if (that._fast) {
            $container.scrollTop(0);
            that._done(true);
          } else {
            $container.animate({
              scrollTop: 0
            }, function(){
              that._done(true);
            });
          }
        break;
        case 'end':
          that._userMoving = true;
          that._selfMoving = true;
          $el = $container.find(':last-child');
          if (that._fast) {
            $container.scrollTop($el.offset().top - $container.offset().top + $container.scrollTop());
            that._done(false);                      
          } else {
            $container.animate({
              scrollTop: ($el.offset().top - $container.offset().top + $container.scrollTop())
            }, function(){
              that._done(false);
            });          
          }          
        break;
      }
    };
    
    this._done = function(bStart) {
      if (that.prepend == bStart) {
        that._userMoving = false;
      };
      that._selfMoving = false;
      that._who();    
    };

    this._who = function() {
      if (that._userMoving) {
        that._onceUser();
      } else {
        that._onceAuto();
      }
    },

    this._clear = function() {
      $(that.element).empty();
      that._listing = [];
      that._onceEmpty();
    };

    this._destroy = function() {
      that._closed = true;
      that._clear();
      this._listing = [];
      $(that.element).removeData('plugin_' + pluginName);
    };

    this._api = function() {
      return {
        add: function(line) {
          that._drawLine(line);
        },
        count: function() {
          return that._listing.length;
        },
        clear: function() {
          that._clear();
        },
        destroy: function() {
          that._destroy();
        },
        goto: function(where) {
          that._goto(where);
        },
        go: function(options) {
          if (typeof options.maxListLength == 'number') {
            that.maxListLength = options.maxListLength;
          } else if (typeof options.maxListLength == 'boolean') {
            that.maxListLength = 0;
          };
          if (typeof options.prepend == 'boolean') {
            that.prepend = options.prepend;
          };
          if (typeof options.line == 'string') {
            that._drawLine(options.line);
          };
          if (typeof options.goto == 'string') {
            that._goto(options.goto);
          };
          if (typeof options.api != 'undefined') {
            options.api = that._api();
          };
          if (typeof options.onEmpty == 'function') {
            that._onEmpty = options.onEmpty;
          };
          if (typeof options.onOverflow == 'function') {
            that._onOverflow = options.onOverflow;
          };
          if (typeof options.onUser == 'function') {
            that._onUser = options.onUser;
          };
          if (typeof options.onAuto == 'function') {
            that._onAuto = options.onAuto;
          };
        }
      };
    };

    this.init = function() {
      this._tag = $(that.element).prop("tagName");
      $(that.element).on('scroll', function() {
        if (that._selfMoving) return false;
        if($(this).scrollTop() + $(this).innerHeight() >= $(this)[0].scrollHeight) {
          if (that.prepend) {
            that._somewhere = true;
          } else {
            that._somewhere = false;
          }
        } else if(0 >= $(this).scrollTop()) {
          if (!that.prepend) {
            that._somewhere = true;
          } else {
            that._somewhere = false;
          }
        } else {
          that._somewhere = true;
        };
        that._userMoving = that._somewhere;
        that._who();
      });

    };
    this.init();

  };

  $.fn[pluginName] = function ( options ) {
      return this.each(function () {
          if (!$(this).data('plugin_' + pluginName)) {
              var o = new Plugin(this);
              var api = o._api();
              api.go(options);
              $(this).data('plugin_' + pluginName, api);
              return api;
          } else {
              var api = $(this).data('plugin_' + pluginName);
              api.go(options);
              return api;
          };
      });
  }

  $[pluginName] = function ( element, options ) {
    if (!$(element).data('plugin_' + pluginName)) {
        var o = new Plugin($(element));
        var api = o._api();
        api.go(options);
        $(element).data('plugin_' + pluginName, api);
        return api;
    } else {
        var api = $(element).data('plugin_' + pluginName);
        api.go(options);
        return api;
    };
  }


  })(jQuery, window, document);
