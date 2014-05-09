function AposBlocks() {
  var self = this;
  self.enable = function($el) {
    if ($el.data('aposBlocksEnabled')) {
      return;
    }
    $el.data('aposBlocksEnabled', true);

    var $blocks = $el.find('[data-apos-blocks]');
    var slug = $el.attr('data-slug');
    var $template = $el.find('[data-block-wrapper].apos-template');
    $template.remove();
    var group = $el.attr('data-block-group');
    var types = apos.data.blockTypes;
    $el.on('click', '[data-new-block]', function() {
      var type = $(this).attr('data-type');
      $.jsonCall(
        '/apos-blocks/new',
        {
          group: group,
          type: type,
          slug: slug
        }, function(result) {
          if (result.status !== 'ok') {
            // TODO this is not a graceful error message or a graceful way of showing one
            alert(result.status);
          }
          var $html = $.parseHTML(result.html);
          var $blockWrapper = $template.clone();
          $blockWrapper.removeClass('apos-template');
          $blockWrapper.attr('data-id', result.id);
          $blockWrapper.find('[data-block]').html($html);
          $blocks.append($blockWrapper);
          self.triggerAposReady();
        }
      );
      return false;
    });

    $el.on('click', '[data-switch-block]', function() {
      var type = $(this).attr('data-type');
      var $blockWrapper = $(this).closest('[data-block-wrapper]');
      var id = $blockWrapper.attr('data-id');
      $.jsonCall(
        '/apos-blocks/switch',
        {
          group: group,
          id: id,
          slug: slug,
          type: type
        }, function(result) {
          if (result.status !== 'ok') {
            alert(result.status);
          }
          var $html = $.parseHTML(result.html);
          $blockWrapper.find('[data-block]').html($html);
          self.triggerAposReady();
        }
      );
      return false;
    });

    $el.on('click', '[data-remove-block]', function() {
      var $blockWrapper = $(this).closest('[data-block-wrapper]');
      var id = $blockWrapper.attr('data-id');
      $.jsonCall(
        '/apos-blocks/remove',
        {
          group: group,
          id: id,
          slug: slug
        }, function(result) {
          if (result.status !== 'ok') {
            alert(result.status);
          }
          $blockWrapper.remove();
        }
      );
      return false;
    });

    // DROPDOWN TOGGLE
    $('body').on('aposCloseMenus', function() {
      $('[data-content-block-menu-options]').toggleClass('open', false);
      $('.apos-block-controls').toggleClass('open', false);
    });

    $el.on('click', '[data-content-block-menu-toggle]', function() {
      var opened;
      if($(this).next('[data-content-block-menu-options]').hasClass('open')){
        opened = true;
      }
      $('body').trigger('aposCloseMenus');
      if (!opened) {
        $(this).closest('.apos-block-controls').toggleClass('open', true);
        $(this).next('[data-content-block-menu-options]').toggleClass('open', true);
      }
    });

    $el.on('click', '[data-move-block]', function() {
      var $wrapper = $(this).parents('[data-block-wrapper]');
      if ($(this).attr('data-move-block') === 'up') {
        $wrapper.prev().before($wrapper);
      } else {
        $wrapper.next().after($wrapper);
      }
      self.saveOrder($el);
      return false;
    });

    $el.on('click', '[data-switch-block]', function() {
      $('body').trigger('aposCloseMenus');
    });

    $el.find('[data-apos-blocks]').sortable({
      handle: '[data-block-handle]',
      stop: function() {
        self.saveOrder($el);
      }
    });

    $el.on('click', '[data-content-blocks-menu]', function() {
      var opened;
      if ($(this).next('[data-content-blocks-menu-options]').hasClass('open')) {
        opened = true;
      }
      $('body').trigger('aposCloseMenus');
      if (!opened) {
        $(this).closest('.apos-block-group-controls').toggleClass('open');
        $(this).next('[data-content-blocks-menu-options]').toggleClass('open', true);
      }

    });
    $el.on('click', '[data-new-block]', function() {
      $('body').trigger('aposCloseMenus');
    });
    $('body').on('aposCloseMenus', function() {
      $('[data-content-blocks-menu-options]').toggleClass('open', false);
      $('.apos-block-group-controls').toggleClass('open', false);
      $('[data-content-blocks-menu]').toggleClass('open', false);
    });

  };

  // We just did something that might introduce new areas into the DOM, so
  // trigger aposReady and anything else that isn't yet smart enough to just listen
  // for aposReady (ideally, nothing, but so far, enablePlayers).

  self.triggerAposReady = function() {
    $(function() {
      // TODO we should refactor enablePlayers so it is just one more thing
      // triggered automatically by aposReady
      apos.enablePlayers();
      $('body').trigger('aposReady');
    });
  };

  self.enableAll = function() {
    $('[data-block-group]').each(function() {
      self.enable($(this));
    });
  };

  self.saveOrder = function($el) {
    var ids = [];
    $el.find('[data-block-wrapper]').each(function() {
      ids.push($(this).attr('data-id'));
    });
    $.jsonCall(
      '/apos-blocks/order',
      {
        group: $el.attr('data-block-group'),
        ids: ids,
        slug: $el.attr('data-slug')
      }, function(result) {
        if (result.status !== 'ok') {
          alert(result.status);
        }
      }
    );
    // return;
  }

  self.auto = function() {
    // For blocks present at page load
    $('body').on('aposReady', function() {
      aposBlocks.enableAll();
    });
  };


}

var aposBlocks = new AposBlocks();

$(function() {
  // Note we do this at DOMready, so if you want to hack it for some reason,
  // you have time to monkeypatch before it is invoked
  aposBlocks.auto();
});
