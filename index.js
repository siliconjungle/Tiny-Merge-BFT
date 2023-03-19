import { nanoid } from 'nanoid'

let grandparent = nanoid()
let parent = nanoid()
const seqs = {}
const values = {}

const sortFields = (value) => {
  if (Array.isArray(value)) {
    return value.map(sortFields)
  } else if (typeof value === 'object' && value !== null) {
    const sortedObj = {}
    const keys = Object.keys(value).sort()
    for (const key of keys) {
      sortedObj[key] = sortFields(value[key])
    }
    return sortedObj
  } else {
    return value
  }
}

const encode = (value) => {
  const sortedValue = sortFields(value)
  return JSON.stringify(sortedValue)
}

const shouldSetValue = (value, newValue) =>
  encode(newValue) > encode(value)

const innerSet = (seq, key, value) => {
  const currentSeq = seqs[key]
  if (currentSeq === undefined || shouldSet(currentSeq, seq, value, values[key])) {
    seqs[key] = version
    values[key] = value
  }
}

const shouldSet = (seq, seq2, value, value2) =>
  seq2 > seq || (seq2 === seq && shouldSetValue(value, value2))

const isPrototypePolluted = (key) =>
  ['__proto__', 'constructor', 'prototype'].includes(key)

export const get = (key) => values[key]

export const set = (newParent, seq, key, value) => {
  if (isPrototypePolluted(key)) {
    console.warn(`Attempted prototype pollution: ${key}=${value}`)
    return
  }

  if (parent === newParent) {
    innerSet(seq, key, value)
  } else if (newParent > parent) {
    grandparent = parent
    parent = newParent
    innerSet(seq, key, value)
  }
}
