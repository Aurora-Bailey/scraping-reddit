const rp = require('request-promise')
const credentials = require('./credentials.json')

class Auth {
  constructor() {
    this.username = credentials.username
    this.app_name = credentials.app_name
    this._in_progress = false
    this._now = 0
    this._token = {
      access_token: 'NONE',
      token_type: 'bearer',
      expires_in: 3600,
      scope: '*'
    }
    this._request_options = {
      method: 'POST',
      uri: 'https://www.reddit.com/api/v1/access_token',
      auth: {
        user: credentials.app_id,
        pass: credentials.app_secret
      },
      form: {
        grant_type: 'password',
        username: credentials.username,
        password: credentials.password
      },
      transform: function (body) {
        return JSON.parse(body)
      }
    }
  }

  _valid () {
    return (Date.now() - this._now) / 1000 < this._token.expires_in
  }

  _authenticate () {
    return new Promise((resolve, reject) => {
      if (this._in_progress) reject('in progress')
      this._in_progress = true

      rp(this._request_options).then((obj) => {
        this._now = Date.now()
        this._token = obj
        this._in_progress = false
        resolve()
      }).catch((err) => {
        this._in_progress = false
        reject(err)
      })
    })
  }

  getToken () {
    return new Promise((resolve, reject) => {
      if (this._valid()) {
        resolve(this._token)
      } else {
        this._authenticate().then(() => {
          resolve(this._token)
        }).catch((err) => {
          reject(err)
        })
      }
    })
  }
}

module.exports = new Auth()
