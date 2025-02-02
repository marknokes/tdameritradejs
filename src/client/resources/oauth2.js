'use strict'

const url = require('url')
const https = require('https')
const fs = require('fs')
const path = require('path')

/**
 * Bootstrap a local web server for oauth2 authorization. Will request
 * access token and update config if authorization is successful.
 *
 * **(Available for Nodejs only)**
 *
 * @instance
 * @memberof TDAmeritrade
 * @returns {Promise<any>} Success
 *
 * @example
 * td.authorize().then(token => {
 *     console.log(token)
 * }).catch(err => {
 *     console.log(err)
 * })
 */
function authorize() {
    return new Promise((resolve, reject) => {
        const serverOptions = {
            key: fs.readFileSync(path.resolve(this.config.sslKey)),
            cert: fs.readFileSync(path.resolve(this.config.sslCert)),
        }
        const urlObj = url.parse(this.config.redirectUri)
        const server = https.createServer(serverOptions, (req, res) => {
            const _url = url.parse(req.url, true)

            if (! _url.query.code) {
                res.writeHead(422, {'Content-Type': 'text/html'})
                res.write('Authorization code is required.')
                return res.end()
            }

            this.getAccessToken(decodeURIComponent(_url.query.code.toString()))
                .then(data => {
                    res.writeHead(200, { 'Content-Type': 'text/html' })
                    res.write('Money, money, money! Happy trading!')
                    res.end()
                    server.close()
                    resolve(data)
                })
                .catch(err => {
                    res.writeHead(500, { 'Content-Type': 'text/html' })
                    res.write('Failed to get access token.')
                    res.end()
                    server.close()
                    reject(err)
                })
        })
        server.listen(Number(urlObj.port) || 8443, urlObj.hostname, () => {
            this._emitter.emit(
                'login',
                `https://auth.tdameritrade.com/auth?response_type=code&redirect_uri=${this.config.redirectUri}&client_id=${this.config.apiKey}`
            )
        })
    }) // Promise()
} // authorize()

/**
 * Authorize or refresh the access token depending on whether
 * the access and/or refresh token exist and are not expired.
 *
 * **(Available for Nodejs only)**
 *
 * @instance
 * @memberof TDAmeritrade
 * @returns {Promise<any>} Success
 *
 * @example
 * td.login().then(token => {
 *     console.log(token)
 * }).catch(err => {
 *     console.log(err)
 * })
 */
async function login(auth) {

	var createNewRefreshToken,
        token

    if(true === auth) {
        token = this.authorize()
    } else if (await this.isRefreshTokenExpired()) {
        token = await this.refreshAccessToken(null, createNewRefreshToken = true)
    } else if (await this.isAccessTokenExpired()) {
        token = await this.refreshAccessToken(null, createNewRefreshToken = false)
    } else {
        token = this.config.accessToken
    }

    return Promise.resolve(token)

} // login()

module.exports = {
    authorize,
    login,
}
