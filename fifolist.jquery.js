/*!
 * FiFoList
 * Version 1.0.0-2017.11.02
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

    this._listing = [];
    this._selfMoving = false;
    this._userMoving = false;
    this._closed = false;
    this._somewhere = false;
    this._lp = false;

    this._onEmpty = function(){
      $(this.element).trigger('fifolist-empty');
    };
    this._onOverflow = function(){
      $(this.element).trigger('fifolist-overflow');
    };
    this._onUser = function(){
      $(this.element).trigger('fifolist-user');
    };
    this._onAuto = function(){
      $(this.element).trigger('fifolist-auto');
    };

    this._drawLine = function(theLine) {
      if (this._closed) return false;
      var insertFunc = 'appendTo';
      if (that.prepend) {
        insertFunc = 'prependTo';
      };
      switch(this._tag){
        case 'UL':
        case 'OL':
          var tag = '<li>';
        break;
        default:
          var tag = '<div>';
        break;
      };
      var el = $(tag)[insertFunc](that.element);
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
        that._onOverflow();
      };
      if (this._userMoving) {
        if (this.prepend) {
          that._selfMoving = true;
          var pos = ($el.height() + $container.scrollTop());
          $container.scrollTop(pos);
          that._selfMoving = false;
        };
        return false;
      }
      that._selfMoving = true;
      if (that.prepend) {
        that._userMoving = false;
        $container.animate({
          scrollTop: 0
        }, function(){
          that._selfMoving = false;
        });
        return true;
      };
      $container.animate({
        scrollTop: ($el.offset().top - $container.offset().top + $container.scrollTop())
      }, function(){
        that._selfMoving = false;
      });
      return true;
    };

    this._goto = function(where) {
      $container = $(that.element);
      switch (where) {
        case 'start':
          that._userMoving = true;
          that._selfMoving = true;
          $container.animate({
            scrollTop: 0
          }, function(){
            that._selfMoving = false;
            if (that.prepend) {
              that._userMoving = false;
            };
          });
        break;
        case 'end':
          that._userMoving = true;
          that._selfMoving = true;
          $el = $container.find(':last-child');
          $container.animate({
            scrollTop: ($el.offset().top - $container.offset().top + $container.scrollTop())
          }, function(){
            if (!that.prepend) {
              that._userMoving = false;
            };
            that._selfMoving = false;
          });
        break;
      }
      if (that._userMoving) {
        that._onUser();
      } else {
        that._onAuto();
      }
    };

    this._clear = function() {
      $(that.element).empty();
      that._onEmpty();
    };

    this._destroy = function() {
      that._closed = true;
      that._clear();
      this._listing = [];
      $(that.element).removeData('plugin_' + pluginName);
    };

    this._longpolling = function(options) {
      if ((that._lp) && (typeof options == 'string')) {
        switch(options){
          case 'start':
            that._clear();
            that._lp.start();
          break;
          case 'stop':
            that._lp.stop();
          break;
          case 'resume':
            that._lp.resume();
          break;
          case 'restart':
            that._lp.stop();
            that._clear();
            that._lp.start();
          break;
          case 'destroy':
            that._lp.destroy();
            that._lp = false;
          break;
        }
      };
      if (typeof options == 'object') {
        if (that._lp) {
          that._lp.destroy();
          that._lp = false;
        };
        that._clear();
        var func = function(){};
        if (typeof options.onChunk == 'function') {
          func = options.onChunk;
        }
        options.onChunk = function(chunk, detail) {
          func(chunk, detail);
          that._drawLine(chunk);
        };
        that._lp = new AjaxNeverendingStreaming(options.url, options);
      };
    },

    this._api = function() {
      return {
        add: function(line) {
          that._drawLine(line);
        },
        clear: function() {
          that._clear();
        },
        destroy: function() {
          that._destroy();
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
          if ((typeof options.longpolling == 'object')||(typeof options.longpolling == 'string')) {
            that._longpolling(options.longpolling);
          };
        }
      };
    };

    this.init = function() {
      this._tag = $(that.element).prop("tagName");
      // when user scrolls list elsewhere, then on the end, we let him rule.
      // when user scrolls to the end of list, we are scrolling again.
      $(that.element).on('scroll', function() {
        if (that._selfMoving) return false;
        if($(this).scrollTop() + $(this).innerHeight() >= $(this)[0].scrollHeight) {
          //console.log('end reached');
          if (that.prepend) {
            that._somewhere = true;
          } else {
            that._somewhere = false;
          }
        } else if(0 >= $(this).scrollTop()) {
          //console.log('start reached');
          if (!that.prepend) {
            that._somewhere = true;
          } else {
            that._somewhere = false;
          }
        } else {
          //console.log('somewhere else', $(this).scrollTop());
          that._somewhere = true;
        };
        that._userMoving = that._somewhere;
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
        var o = new Plugin(element);
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