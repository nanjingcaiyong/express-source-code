/*!
 * express
 * Copyright(c) 2009-2013 TJ Holowaychuk
 * Copyright(c) 2013 Roman Shtylman
 * Copyright(c) 2014-2015 Douglas Christopher Wilson
 * MIT Licensed
 */

'use strict';

/**
 * https://lq782655835.github.io/blogs/node/node-code-express.html
 * app 上挂载的属性大部分来自application.js导出的proto对象
 * 每个 Layer 相当于洋葱的一层
 * 可以通过两种方式添加中间件：app.use添加非路由中间件，app[method]添加路由中间件
 * Route模块对应的是route.js，主要是来处理路由信息的，每条路由都会生成一个Route实例。
 * Router模块下可以定义多个路由，也就是说，一个Router模块会包含多个Route模块。
 * exress实例化了一个new Router()，实际上注册和执行路由都是通过调用Router实例的方法。类似于中介者模式
 * 路由流程总结：当客户端发送一个http请求后，会先进入express实例对象对应的router.handle函数中，router.handle函数会通过next()遍历stack中的每一个layer进行match，如果match返回true，则获取layer.route，执行route.dispatch函数，route.dispatch同样是通过next()遍历stack中的每一个layer，然后执行layer.handle_request，也就是调用中间件函数。直到所有的中间件函数被执行完毕，整个路由处理结束。
 * 每个Route 都会用 Layer 进行包装
 * 在整个 Router 路由系统中 stack 存放着一个个layer, 通过layer.route 指向 route路由对象，route的stack里存放的也是一个个layer, 每个layer中包含(method/handler)
 * 路由注册关系链 app[method] => router[method] => route[method] 最终在route[method]里完成路由注册
 * 路由处理 app.handle => router.handle => layer.handle_request
 *
 * view.js 封装了模板渲染引擎，通过res.render()调用引擎渲染网页
 * 静态资源使用'serve-static'处理
 * app.use 主要用来添加非路由中间件,底层调用router.use(), 作用于所有路由
 * app.use(args) = router.use(args)
 * router.use 将 layer实例压入stack
 * app.route = router.route
 * layer 匹配路径，找到对应的route,
 */

var bodyParser = require('body-parser')
var EventEmitter = require('events').EventEmitter;
var mixin = require('merge-descriptors');
var proto = require('./application');
var Route = require('./router/route');
var Router = require('./router');
var req = require('./request');
var res = require('./response');

/**
 * Expose `createApplication()`.
 */

exports = module.exports = createApplication;

/**
 * Create an express application.
 *
 * @return {Function}
 * @api public
 */

// TODO: Step1
function createApplication() {
  var app = function(req, res, next) {
    // 负责将每对[req,res]进行逐级分发,作用在每个定义好的路由及中间件上,直至最后完成分发
    app.handle(req, res, next);
  };

  mixin(app, EventEmitter.prototype, false); // 混入EventEmitter事件监听（.on）和事件触发（.emit）
  mixin(app, proto, false);                  // 在app上挂载init、listen、use、route、engine、render等

  // expose the prototype that will get set on requests
  app.request = Object.create(req, {
    app: { configurable: true, enumerable: true, writable: true, value: app }
  })

  // expose the prototype that will get set on responses
  app.response = Object.create(res, {
    app: { configurable: true, enumerable: true, writable: true, value: app }
  })
  // 初始化默认配置
  app.init();
  return app;
}

/**
 * Expose the prototypes.
 */

exports.application = proto;
exports.request = req;
exports.response = res;

/**
 * Expose constructors.
 */

exports.Route = Route;
exports.Router = Router;

/**
 * Expose middleware
 */

exports.json = bodyParser.json
exports.query = require('./middleware/query');
exports.raw = bodyParser.raw
exports.static = require('serve-static'); // 处理静态资源
exports.text = bodyParser.text
exports.urlencoded = bodyParser.urlencoded

/**
 * Replace removed middleware with an appropriate error message.
 */

var removedMiddlewares = [
  'bodyParser',
  'compress',
  'cookieSession',
  'session',
  'logger',
  'cookieParser',
  'favicon',
  'responseTime',
  'errorHandler',
  'timeout',
  'methodOverride',
  'vhost',
  'csrf',
  'directory',
  'limit',
  'multipart',
  'staticCache'
]

removedMiddlewares.forEach(function (name) {
  Object.defineProperty(exports, name, {
    get: function () {
      throw new Error('Most middleware (like ' + name + ') is no longer bundled with Express and must be installed separately. Please see https://github.com/senchalabs/connect#middleware.');
    },
    configurable: true
  });
});
