const functions = require('firebase-functions')
const request = require('request-promise')
const admin = require('firebase-admin')
const app = admin.initializeApp()

exports.purge = functions.storage.object().onFinalize(
  (object) => request(
    `https://cdn.quarter.studio/${object.name}`,
    {
      method: 'PURGE'
    }
  )
)

exports.request = functions.https.onRequest(
  (request, response) => {
    if (request.method.toLowerCase() !== 'get') {
      return response.status(404).send()
    }

    if (request.path === '/timestamp') {
      response.set({
        'Cache-Control': 'public, max-age=300, s-maxage=31536000'
      })

      return response.send(`${Date.now()}`)
    }

    const file = app.storage().bucket().file(request.path)

    const resolve = (metadata) => {
      response.set({
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=300, s-maxage=31536000',
        'Content-Type': metadata[0].contentType
      })

      file.createReadStream().pipe(response)
    }

    const reject = (error) => {
      response.status(404).send()
    }

    file.getMetadata().then(resolve).catch(reject)
  }
)