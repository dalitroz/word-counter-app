import {describe, it} from 'mocha'
import {expect} from 'chai'
import {countWords} from '../src/word-counter-controller.js'

describe('Unit test', () => {
  it('function countWords should count words from simple string into Map object', () => {
    const wordStatsMap = new Map()
    countWords('I am a simple test string, and I have three3 tim-es i', wordStatsMap)

    expect(wordStatsMap.get('i')).to.equal(3)
    expect(wordStatsMap.get('am')).to.equal(1)
    expect(wordStatsMap.get('string')).to.equal(1)
    expect(wordStatsMap.get('three')).to.equal(1)
    expect(wordStatsMap.get('times')).to.equal(1)
    expect(wordStatsMap.size).to.equal(10)
  })
})
