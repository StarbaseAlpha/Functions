'use strict';

const {VM} = require('vm2');

function Functions() {

  let functions = {};

  functions.runCode = (code = null, env = {}, options = {}) => {
    return new Promise((resolve, reject) => {

      const vm = new VM({
        "sandbox": options.sandbox || {},
        "timeout": options.timeout || 1000
      });

      vm.freeze(resolve, 'resolve');
      vm.freeze(reject, 'reject');

      if (env && typeof env === 'object') {
        Object.keys(env).forEach(key => {
          vm.freeze(env[key], key);
        });
      }

      vm.run(`
        'use strict';
        let func = async () => {return (` + code + `)()};
        func().then(resolve).catch(reject);
      `);
    
    });
  };

  functions.express = (code = null, env = {}, options = {}) => {
    return (req, res) => {

      if (!options || typeof options !== 'object') {
        options = {};
      }

      if (!options.sandbox || typeof options.sandbox !== 'object') {
        options.sandbox = {};
      }

      options.sandbox.req = {
        "headers": req.headers || {},
        "ip": req.ip || null,
        "path": req.path || '/',
        "url": req.url || '/',
        "method":req.method,
        "query": req.query || {},
        "body": req.body || {},
        "params": req.params || {}
      };

      options.sandbox.res = {
        "type":"json",
        "disposition": null,
        "location": null,
        "status": null
      };

      functions.runCode(code, env, options).then(result=>{

        res.type(options.sandbox.res.type);
        let statusCode = parseInt(options.sandbox.res.status||0);

        if (statusCode && !isNaN(statusCode) && statusCode > 199 && statusCode < 500) {
          res.status(statusCode);
        } else {
          res.status(200);
        }

        if (options.sandbox.res.disposition && typeof options.sandbox.res.disposition === 'string') {
          res.setHeader('Content-Disposition', 'attachment;filename=' + options.sandbox.res.disposition);
        }

        if (options.sandbox.res.location && typeof options.sandbox.res.location === "string") {
          res.setHeader('location', options.sandbox.res.location);
        }

        res.send(result);

      }).catch(err=>{

        res.type(options.sandbox.res.type);
        let statusCode = parseInt(options.sandbox.res.status||0);

        if (statusCode && !isNaN(statusCode) && statusCode > 199 && statusCode < 500) {
          res.status(statusCode);
        } else {
          res.status(400);
        }

        if (options.sandbox.res.location && typeof options.sandbox.res.location === "string") {
          res.setHeader('location', options.sandbox.res.location);
        }

        res.send(err);

      });

    };
  };

  return functions;

}

module.exports = Functions;
