import fastify from 'fastify'
import {makeWordCounterController} from './word-counter-controller.js'

/** @param {{wordStatisticsFilePath: string; logger: import('pino').Logger}} options */
export async function makeWebApp({logger, wordStatisticsFilePath}) {
  const app = fastify({clientErrorHandler})

  // just an healthz url, so we know the server is up and smiling
  app.get('/healthz', async (_request, _reply) => {
    return {hello: 'world'}
  })

  app.register(makeWordCounterController, {
    wordStatisticsFilePath,
    logger,
  })

  app.addHook('onClose', async () => logger.info('Server is closing, bye :) '))

  app.addHook('onRequest', (request, _reply, done) => {
    try {
      logger.info({
        event: 'request-received',
        url: request.url
      })
      done()
    } catch (/** @type {any} */ error) {
      done(error)
    }
  })

  app.addHook('onResponse', (request, response) => {
    logger.info({
      event: 'request-handled',
      url: request.url,
      statusCode: response.statusCode,
      body: request.body,
      query: request.params,
    })
  })

  /**
   * @param {Error & {code: string}} error
   * @param {import('net').Socket} socket
   */
  function clientErrorHandler(error, socket) {
    const formattedError = JSON.stringify({
      error: {
        message: 'Client error',
        code: '400',
      },
    })

    logger.error({event: 'client-error', error: formattedError})

    if (error.code === 'ECONNRESET' || !socket.writable) {
      return
    }

    const body = JSON.stringify({type: 'client-error', error: formattedError})

    socket.end(
      `HTTP/1.1 400 Bad Request\r\nContent-Length: ${body.length}\r\nContent-Type: application/json\r\n\r\n${body}`,
    )
  }

  return {app}
}
