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
     
      functions.runCode(code, env, options).then(result => {
        res.json(result);
      }).catch(err => {
        res.status(err.code||400).json({"code":err.code||400, "message":err.message||err.toString()||"ERROR!"});
      });
    };
  };

  return functions;

}

module.exports = Functions;
