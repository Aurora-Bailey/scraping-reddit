const rp = require('request-promise')
const auth = require('./auth')
const mongo = require('./mongodb')

var version = 1.01
var start = Date.now()
var loop = 0

mongo.getDB().then(db => {
  auth.getToken().then(token => {
    // console.log(db)
    // console.log(token)
    
    scrapeSubreddits(token).then(obj => {
      console.log(obj)
      let items = obj.data.children
      items.forEach((i) => {
        console.log(i.data.display_name_prefixed)
      })
    }).catch(err => {
      console.log(err)
    })
  }).catch(err => {console.log(err)/* Reddit OAuth Token ERROR */})
}).catch((err) => {console.log(err)/* MongoDB ERROR */})

function scrapeSubreddits (token) {
  const options = {
    uri: `https://oauth.reddit.com/subreddits/popular`,
    headers: {
      'User-Agent': (`node:${auth.app_name}:${version} (by /u/${auth.username})`).toLowerCase(),
      'Authorization': token.token_type + ' ' + token.access_token
    },
    transform: function (body) {
      return JSON.parse(body)
    }
  }

  return rp(options)
}

// function countObjects (obj) {
//   var count = 0
//   for (var k in obj) {
//       if (obj.hasOwnProperty(k)) {
//          ++count
//       }
//   }
//   return count
// }

// var http = require('http')
// http.createServer(function (req, res) {
//     res.writeHead(200, {'Content-Type': 'text/html'})
//     res.write(req.url)
//     res.end()
// }).listen(8080)
