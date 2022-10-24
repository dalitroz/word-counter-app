import {describe, it} from 'mocha'
import {expect, use} from 'chai'
import {mkdtemp, readFile, writeFile} from 'fs/promises'
import {tmpdir} from 'os'
import {makeWebApp} from '../src/word-counter.js'
import pino from 'pino'
import chaiSubset from 'chai-subset'
import path from 'path'

use(chaiSubset)

async function createApp() {
  const logger = pino()

  const statsFileDirectory = await mkdtemp(tmpdir() + '/')

  const wordStatisticsFilePath = statsFileDirectory + '/wordCountStatsFile.json'

  await writeFile(wordStatisticsFilePath, '{}')

  const {app} = await makeWebApp({logger, wordStatisticsFilePath})

  return {app, wordStatisticsFilePath}
}

describe('Integ test', () => {
  it('api test: should respond to healthz route', async () => {
    const {app} = await createApp()
    const response = await app.inject({
      method: 'GET',
      url: '/healthz',
    })

    expect(response.statusCode).to.equal(200)

    expect(response.body).to.equal('{"hello":"world"}')
  })

  it('should return 0 for any /word-statistics request when no /word-counter requests done before ', async () => {
    const {app, wordStatisticsFilePath} = await createApp()

    const response1 = await app.inject({
      method: 'GET',
      url: '/word-statistics',
      query: {word: 'some'},
    })

    expect(Number(response1.body)).to.equal(0)

    const wordStatisticsObject = JSON.parse(await readFile(wordStatisticsFilePath, 'utf8'))

    expect(wordStatisticsObject).to.be.empty
  })

  it('should count words for input string', async () => {
    const {app, wordStatisticsFilePath} = await createApp()
    const response = await app.inject({
      method: 'POST',
      url: '/word-counter',
      payload: {
        inputType: 'string',
        input: 'I Am Robot with3 or more I i',
      },
    })

    expect(response.statusCode).to.equal(200)

    const responseStatistics1 = await app.inject({
      method: 'GET',
      url: '/word-statistics',
      query: {word: 'a-word-not-sent'},
    })

    expect(Number(responseStatistics1.body)).to.equal(0)

    const responseStatistics2 = await app.inject({
      method: 'GET',
      url: '/word-statistics',
      query: {word: 'i'},
    })

    expect(Number(responseStatistics2.body)).to.equal(3)

    const wordStatisticsObject = JSON.parse(await readFile(wordStatisticsFilePath, 'utf8'))

    expect(wordStatisticsObject).to.containSubset({i: 3, am: 1, robot: 1, with: 1, or: 1, more: 1})
    expect(Object.entries(wordStatisticsObject).length).to.equal(6)
  })

  it('should consistently count words between api calls ', async () => {
    const {app, wordStatisticsFilePath} = await createApp()
    await app.inject({
      method: 'POST',
      url: '/word-counter',
      payload: {
        inputType: 'string',
        input: 'I Am Robot with3 or more I i',
      },
    })

    const responseStatistics2 = await app.inject({
      method: 'GET',
      url: '/word-statistics',
      query: {word: 'i'},
    })

    expect(Number(responseStatistics2.body)).to.equal(3)

    const wordStatisticsObject = JSON.parse(await readFile(wordStatisticsFilePath, 'utf8'))

    expect(wordStatisticsObject).to.eql({i: 3, am: 1, robot: 1, with: 1, or: 1, more: 1})

    await app.inject({
      method: 'POST',
      url: '/word-counter',
      payload: {
        inputType: 'string',
        input: 'I have some more i-s to give, and i will',
      },
    })

    const wordStatisticsObject2 = JSON.parse(await readFile(wordStatisticsFilePath, 'utf8'))

    expect(wordStatisticsObject2).to.eql({
      i: 5,
      am: 1,
      robot: 1,
      with: 1,
      or: 1,
      more: 2,
      have: 1,
      some: 1,
      is: 1,
      to: 1,
      give: 1,
      and: 1,
      will: 1,
    })

    expect(Object.entries(wordStatisticsObject2).length).to.equal(13)
  })

  it('should count words for small input file', async () => {
    const {app, wordStatisticsFilePath} = await createApp()

    const inputFilePath = path.resolve('test/test-utils/small-input-file.txt')

    const response = await app.inject({
      method: 'POST',
      url: '/word-counter',
      payload: {
        inputType: 'file',
        input: inputFilePath,
      },
    })

    expect(response.statusCode).to.equal(200)

    const responseStatistics1 = await app.inject({
      method: 'GET',
      url: '/word-statistics',
      query: {word: 'a-word-not-sent'},
    })

    expect(Number(responseStatistics1.body)).to.equal(0)

    const responseStatistics2 = await app.inject({
      method: 'GET',
      url: '/word-statistics',
      query: {word: 'do'},
    })

    const wordStatisticsObject = JSON.parse(await readFile(wordStatisticsFilePath, 'utf8'))

    expect(Number(responseStatistics2.body)).to.equal(2)

    expect(wordStatisticsObject).to.eql({
      lorem: 1,
      ipsum: 1,
      dolor: 1,
      sit: 1,
      amet: 1,
      do: 2,
      consectetur: 1,
      adipiscing: 1,
      elit: 1,
      sed: 1,
      eiusmod: 1,
    })
    expect(Object.entries(wordStatisticsObject).length).to.equal(11)
  })

  it.skip('should count words for  large input file', async () => {
    const {app, wordStatisticsFilePath} = await createApp()

    const inputFilePath = path.resolve('test/test-utils/really-large-input.txt')

    const response = await app.inject({
      method: 'POST',
      url: '/word-counter',
      payload: {
        inputType: 'file',
        input: inputFilePath,
      },
    })

    expect(response.statusCode).to.equal(200)

    const wordStatisticsObject = JSON.parse(await readFile(wordStatisticsFilePath, 'utf8'))

    expect(wordStatisticsObject).to.eql({
      i: 83333334,
      am: 83333334,
      sasha: 83333333,
      fierce: 83333333,
      beyonce: 1,
    })

    expect(Object.entries(wordStatisticsObject).length).to.equal(5)
  })

  it('should count words for  small input url', async () => {
    const {app, wordStatisticsFilePath} = await createApp()

    const response = await app.inject({
      method: 'POST',
      url: '/word-counter',
      payload: {
        inputType: 'url',
        input: 'https://filesamples.com/samples/document/txt/sample3.txt',
      },
    })

    expect(response.statusCode).to.equal(200)

    const wordStatisticsObject = JSON.parse(await readFile(wordStatisticsFilePath, 'utf8'))

    expect(Object.entries(wordStatisticsObject).length).to.equal(380)
  })
})
