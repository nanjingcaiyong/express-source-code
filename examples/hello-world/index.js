'use strict'

var express = require('../../');

var app = module.exports = express()

// app.get('/', function(req, res){
//   console.log('start', new Date())
//   setTimeout(function () {
//     console.log('end', new Date())
//     res.send('Hello World');
//   }, 10000);
// });

app.route('/')
  .get(function (req, res) {
    
    res.send('hello world')
  })

/* istanbul ignore next */
if (!module.parent) {
  app.listen(3001);
  console.log('Express started on port 3000');
}
