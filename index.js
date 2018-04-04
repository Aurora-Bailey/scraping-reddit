const rp = require('request-promise')
const auth = require('./auth')
const mongo = require('./mongodb')

var version = 1.01

class Main {
  constructor () {
    this.start = Date.now()
    this.last = 0
    this.speed = 3000
    this.loop = 0
    this.end = 1000000
  }

  execute (opt = {}) {
    mongo.getDB().then(db => {
      auth.getToken().then(token => {
        // console.log(db)
        // console.log(token)
        console.log('get: ', this.loop)
        scrapeReddit(token, opt.qs ? opt.qs : {}).then(obj => {
          let items = obj.data.children

          items.forEach((i) => {
            let update_subreddit = {}
            update_subreddit['$set'] = {}
            update_subreddit['$set']['subs.' + i.data.author] = true
            if (i.data.author !== i.data.link_author) update_subreddit['$set']['subs.' + i.data.link_author] = true
            db.collection('subreddits').updateOne({r: i.data.subreddit}, update_subreddit, { upsert: true }, (err, results) => {
              if (err) console.log(err)
            })

            let update_user = {}
            update_user['$set'] = {}
            update_user['$set']['r.' + i.data.subreddit] = true
            db.collection('users').updateOne({username: i.data.author}, update_user, { upsert: true }, (err, results) => {
              if (err) console.log(err)
            })

            if (i.data.author !== i.data.link_author) {
              let update_link_user = {}
              update_link_user['$set'] = {}
              update_link_user['$set']['r.' + i.data.subreddit] = true
              db.collection('users').updateOne({username: i.data.link_author}, update_link_user, { upsert: true }, (err, results) => {
                if (err) console.log(err)
              })
            }
          })

          let after = obj.data.after
          if (after === null) {
            console.log('end of list')
            return false
          }
          if (!opt.qs) opt.qs = {}
          // opt.qs.after = after
          this.nextLoop(opt)

        }).catch(err => {console.log('Scrape Error: ', err); setTimeout(() => {this.nextLoop(opt)}, 60000)})

      }).catch(err => {console.log('Token Error: ', err); setTimeout(() => {this.nextLoop(opt)}, 60000)/* Reddit OAuth Token ERROR */})
    }).catch((err) => {console.log('Mongo Error: ', err); setTimeout(() => {this.nextLoop(opt)}, 60000)/* MongoDB ERROR */})
  }

  nextLoop (opt) {
    this.loop++
    if (this.loop >= this.end) return false

    // delay next loop
    let milliseconds_since_last_loop = Date.now() - this.last
    let milliseconds_to_next_loop = this.speed - milliseconds_since_last_loop
    setTimeout(() => {
      this.last = Date.now()
      this.execute(opt)
    }, Math.max(0, milliseconds_to_next_loop))
  }
}
var main = new Main()
main.execute()

function scrapeReddit (token, qs) {
  qs.limit = 100
  const options = {
    uri: `https://oauth.reddit.com/r/all/comments`,
    qs,
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
