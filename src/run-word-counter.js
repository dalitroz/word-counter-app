import path from 'path'
import pino from 'pino'
import pretty from 'pino-pretty'
import {makeWebApp} from './word-counter.js'

const WORD_STATISTICS_FILE_PATH = path.resolve('./src/wordStatisticsFile.json')

const stream = pretty({
  colorize: true,
})

const logger = pino(stream)

const {app} = await makeWebApp({logger, wordStatisticsFilePath: WORD_STATISTICS_FILE_PATH})

try {
  await app.listen({port: 3000})
  logger.info('Word Counter listening...')
} catch (err) {
  logger.error(err)

  process.exit(1)
}
