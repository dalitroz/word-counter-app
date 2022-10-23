import {countWordsRequestSchema} from './models.js'
import fetch from 'node-fetch'
import {writeFile, readFile} from 'fs/promises'
import {createReadStream, existsSync} from 'fs'

/**
 * @param {import('fastify').FastifyInstance} app
 * @param {{wordStatisticsFilePath: string; logger: import('pino').Logger}} options
 */
export async function makeWordCounterController(app, {wordStatisticsFilePath, logger}) {
  app.post('/word-counter', wordCounter)
  app.get('/word-statistics', getWordStatistics)

  /** @param {import('fastify').FastifyRequest} req */
  async function wordCounter(req) {
    const {inputType, input} = countWordsRequestSchema.parse(req.body)

    switch (inputType) {
      case 'string':
        await countWordsAndUpdateStatisticsFile(input)
        break

      case 'url':
        await countWordsFromUrlAndUpdateStatisticsFile(input)
        break

      case 'file':
        if (!existsSync(input)) {
          throw new Error(`Bad Input, file does not exist ${input}`)
        } else {
          await countWordsFromFileAndUpdateStatisticsFile(input)
        }

        break

      default:
        throw new Error(`Wrong input type ${inputType}`)
    }
  }

  /**
   * @param {import('fastify').FastifyRequest<{
   *   Querystring: {
   *     word: string
   *   }
   * }>} req
   */
  async function getWordStatistics(req) {
    const word = req.query.word

    if (!word) {
      throw new Error(`Missing 'word' query parameter`)
    }

    return (
      (await getWordStatisticsMap(wordStatisticsFilePath)).get(
        word.toLowerCase().replace(/[0-9\-\,]/g, ''),
      ) ?? 0
    )
  }

  /** @param {string} url */
  async function countWordsFromUrlAndUpdateStatisticsFile(url) {
    try {
      const response = await fetch(url)

      const wordsCountMap = new Map()

      let lastWordInChunk = ''

      if (response.body) {
        for await (const chunk of response.body) {
          const input = lastWordInChunk + chunk.toString()

          if (input.endsWith(' ')) {
            countWords(input, wordsCountMap)

            lastWordInChunk = ''
          } else {
            const splitChunk = input.split(' ')

            const wordsFromChunk = splitChunk.slice(0, -1).join(' ')

            lastWordInChunk = splitChunk[splitChunk.length - 1]

            countWords(wordsFromChunk, wordsCountMap)
          }
        }

        countWords(lastWordInChunk, wordsCountMap)

        const wordsStatisticsMap = await getWordStatisticsMap(wordStatisticsFilePath)

        wordsCountMap.forEach((count, word) =>
          wordsStatisticsMap.set(word, count + (wordsStatisticsMap.get(word) ?? 0)),
        )

        await updateWordStatisticsFile(wordsStatisticsMap)
      }
    } catch (err) {
      logger.error(
        new Error(`Could not complete counting words from url '${url}', got an error: ${err}`),
      )
    }
  }

  /** @param {string} filePath */
  async function countWordsFromFileAndUpdateStatisticsFile(filePath) {
    try {
      const wordsCountMap = new Map()

      let lastWordInChunk = ''

      const readStream = createReadStream(filePath, {
        encoding: 'utf8',
        highWaterMark: 10 * 1024 * 1024,
      })

      for await (const chunk of readStream) {
        const input = lastWordInChunk + chunk

        if (input.endsWith(' ')) {
          countWords(input, wordsCountMap)

          lastWordInChunk = ''
        } else {
          const splitChunk = input.split(' ')

          const wordsFromChunk = splitChunk.slice(0, -1).join(' ')

          lastWordInChunk = splitChunk[splitChunk.length - 1]

          countWords(wordsFromChunk, wordsCountMap)
        }
      }
      countWords(lastWordInChunk, wordsCountMap)

      const wordsStatisticsMap = await getWordStatisticsMap(wordStatisticsFilePath)

      wordsCountMap.forEach((count, word) =>
        wordsStatisticsMap.set(word, count + (wordsStatisticsMap.get(word) ?? 0)),
      )

      await updateWordStatisticsFile(wordsStatisticsMap)
    } catch (err) {
      logger.error(
        new Error(
          `Could not complete counting words from file '${filePath}', got an error: ${err}`,
        ),
      )
    }
  }

  /** @param {string} line */
  async function countWordsAndUpdateStatisticsFile(line) {
    const wordsStatisticsMap = await getWordStatisticsMap(wordStatisticsFilePath)

    countWords(line, wordsStatisticsMap)

    await updateWordStatisticsFile(wordsStatisticsMap)
  }

  /** @param {Map<string, number>} wordsStatistics */
  async function updateWordStatisticsFile(wordsStatistics) {
    const wordsStatisticsObject = Object.fromEntries(wordsStatistics)
    writeFile(wordStatisticsFilePath, JSON.stringify(wordsStatisticsObject))
  }

  /**
   * @param {string} wordStatisticsFilePath
   * @returns {Promise<Map<string, number>>}
   */
  async function getWordStatisticsMap(wordStatisticsFilePath) {
    /** @type {Record<string, number>} */
    const wordStatisticsObject = JSON.parse(await readFile(wordStatisticsFilePath, 'utf8'))

    return new Map(Object.entries(wordStatisticsObject))
  }
}

/**
 * @param {string} wordsString
 * @param {Map<string, number>} wordsStatistics
 */
export function countWords(wordsString, wordsStatistics) {
  wordsString
    .toLowerCase()
    .replace(/[\n]/g, ' ')
    .split(' ')
    .forEach((currentWord) => {
      const word = currentWord.replace(/[0-9\-\,]/g, '')
      if (word !== '') {
        wordsStatistics.set(word, (wordsStatistics.get(word) ?? 0) + 1)
      }
    })
}
