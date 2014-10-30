var _ = require('lodash');
var async = require('async');

module.exports = blocks;

function blocks(options, callback) {
  return new blocks.Blocks(options, callback);
}

function Blocks(options, callback) {
  var self = this;
  self._app = options.app;
  self._apos = options.apos;
  self._pages = options.pages;
  self._types = options.types;
  self._action = '/apos-blocks';

  // Mix in the ability to serve assets and templates
  self._apos.mixinModuleAssets(self, 'blocks', __dirname, options);

  self.pushAsset('script', 'editor', { when: 'user' });
  self.pushAsset('stylesheet', 'editor', { when: 'user' });

  // Typical syntax: aposBlocks(page, 'groupname', [ 'typeone', 'typetwo'])

  // Also allowed: aposBlocks(page, 'groupname', { types: [ 'typeone', 'typetwo' ] })

  // And if you must: aposBlocks({ page: page, group: 'groupname', types: [ 'typeone', 'typetwo'] })

  // You may pass additional data which is visible to the blocks.html template:
  //
  // aposBlocks(page, 'groupname', [ 'typeone', 'typetwo'], { user: user, permissions: permissions, groupLabel: 'Lego Block' })
  //
  // Newly added blocks do NOT see such additional data, however they DO see "user" and "permissions"
  // because these are explicitly passed to new blocks. Currently newly added blocks don't see any
  // joins or custom page loader results in the page object either.

  self._apos.addLocal('aposBlocks', function() {
    var options = {};
    if (!arguments.length) {
      throw new Error('You must pass at least one argument to aposBlocks. Typical usage is aposBlocks(page, "body", [ "blockTypeOne", "blockTypeTwo"]).');
    }
    if (arguments.length === 1) {
      options = arguments[0];
    } else {
      options.page = arguments[0];
      options.group = arguments[1];
      if (arguments[2]) {
        if (Array.isArray(arguments[2])) {
          options.types = arguments[2];
          if (arguments[3]) {
            _.extend(options, arguments[3]);
          }
        } else {
          _.extend(options, arguments[2]);
        }
      }
    }
    var data = {};
    _.extend(data, options);
    data.blocks = (options.page.blockGroups && options.page.blockGroups[options.group] && options.page.blockGroups[options.group].blocks) || [];
    data.types = _.filter(self._types, function(type) {
      return _.contains(options.types, type.name);
    });
    data.groupLabel = options.groupLabel;
    return self.render('blocks', data);
  });

  self._app.post(self._action + '/new', function(req, res) {
    var page;
    var result;
    var group = self._apos.sanitizeString(req.body.group);
    var type = self._apos.sanitizeString(req.body.type);
    var id = self._apos.generateId();
    var slug = self._apos.sanitizeString(req.body.slug);
    if (!type) {
      return res.send({ status: 'invalid' });
    }
    var typeConfig = _.find(self._types, function(typeConfig) {
      return typeConfig.name === type;
    });
    if (!typeConfig) {
      return res.send({ status: 'nosuchblock' });
    }
    return async.series({
      get: function(callback) {
        return self._apos.getPage(req, slug, {}, function(err, _page) {
          if (err) {
            console.log(err);
            return callback('error');
          }
          if (!_page) {
            return callback('notfound');
          }
          page = _page;
          return callback(null);
        });
      },
      render: function(callback) {
        result = {
          status: 'ok',
          type: type,
          id: id,
          html: self.render(type, {
            page: page,
            type: type,
            group: group,
            // Make basic user and permissions info available to ease the pain of
            // not having proper page loaders running for new blocks yet
            user: req.user,
            permissions: (req.user && req.user.permissions) || {},
            id: id,
            prefix: group + '_' + id + '_'
          }, req)
        };
        return callback(null);
      },
      insert: function(callback) {
        if (!page.blockGroups) {
          page.blockGroups = {};
        }
        if (!page.blockGroups[group]) {
          page.blockGroups[group] = {
            blocks: []
          };
        }
        page.blockGroups[group].blocks.push({
          type: type,
          id: id
        });
        return self._apos.putPage(req, slug, page, callback);
      }
    }, function(err) {
      if (err) {
        return res.send({ status: err });
      }
      return res.send(result);
    });
  });

  self._app.post(self._action + '/switch', function(req, res) {
    var page;
    var result;
    var group = self._apos.sanitizeString(req.body.group);
    var type = self._apos.sanitizeString(req.body.type);
    var id = self._apos.sanitizeId(req.body.id);
    var slug = self._apos.sanitizeString(req.body.slug);
    if (!type) {
      return res.send({ status: 'invalid' });
    }
    var typeConfig = _.find(self._types, function(typeConfig) {
      return typeConfig.name === type;
    });
    if (!typeConfig) {
      return res.send({ status: 'nosuchblock' });
    }
    return async.series({
      get: function(callback) {
        return self._apos.getPage(req, slug, {}, function(err, _page) {
          if (err) {
            console.log(err);
            return callback('error');
          }
          if (!_page) {
            return callback('notfound');
          }
          page = _page;
          return callback(null);
        });
      },
      render: function(callback) {
        result = {
          status: 'ok',
          type: type,
          id: id,
          html: self.render(type, {
            page: page,
            type: type,
            group: group,
            id: id,
            prefix: group + '_' + id + '_'
          }, req)
        };
        return callback(null);
      },
      update: function(callback) {
        _.each(page.blockGroups[group].blocks, function(block) {
          if (block.id === id) {
            block.type = type;
          }
        });
        return self._apos.putPage(req, slug, page, callback);
      }
    }, function(err) {
      if (err) {
        return res.send({ status: err });
      }
      return res.send(result);
    });
  });

  self._app.post(self._action + '/remove', function(req, res) {
    var group = self._apos.sanitizeString(req.body.group);
    var id = self._apos.sanitizeId(req.body.id);
    var slug = self._apos.sanitizeString(req.body.slug);
    return async.series({
      get: function(callback) {
        return self._apos.getPage(req, slug, {}, function(err, _page) {
          if (err) {
            console.log(err);
            return callback('error');
          }
          if (!_page) {
            return callback('notfound');
          }
          page = _page;
          return callback(null);
        });
      },
      remove: function(callback) {
        if (!page.blockGroups) {
          return callback('notfound');
        }
        if (!page.blockGroups[group]) {
          return callback('notfound');
        }
        // Keep only the blocks that DON'T match the id
        page.blockGroups[group].blocks = _.filter(page.blockGroups[group].blocks, function(block) {
          return (block.id !== id);
        });
        return self._apos.putPage(req, slug, page, callback);
      }
    }, function(err) {
      if (err) {
        return res.send({ status: err });
      }
      return res.send({ status: 'ok' });
    });
  });

  self._app.post(self._action + '/order', function(req, res) {
    var group = self._apos.sanitizeString(req.body.group);
    var ids = self._apos.sanitizeIds(req.body.ids);
    var slug = self._apos.sanitizeString(req.body.slug);
    return async.series({
      get: function(callback) {
        return self._apos.getPage(req, slug, {}, function(err, _page) {
          if (err) {
            console.log(err);
            return callback('error');
          }
          if (!_page) {
            return callback('notfound');
          }
          page = _page;
          return callback(null);
        });
      },
      update: function(callback) {
        if (!page.blockGroups) {
          return callback('notfound');
        }
        if (!page.blockGroups[group]) {
          return callback('notfound');
        }
        page.blockGroups[group].blocks = self._apos.orderById(ids, page.blockGroups[group].blocks, 'id');
        return self._apos.putPage(req, slug, page, callback);
      }
    }, function(err) {
      if (err) {
        return res.send({ status: err });
      }
      return res.send({ status: 'ok' });
    });
  });

  // Allows the "page versions" dialog to say something about
  // blocks coming and going
  self._apos.on('diff', function(page, lines) {
    _.each(page.blockGroups || {}, function(value, group) {
      var prefix = group + ' block: ';
      _.each(value.blocks, function(block) {
        lines.push(prefix + block.type);
      });
    });
  });

  return process.nextTick(function() {
    return callback(null);
  });
}

blocks.Blocks = Blocks;
