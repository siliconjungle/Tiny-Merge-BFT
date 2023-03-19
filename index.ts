import { nanoid } from 'nanoid'

let grandparent: string = nanoid()
let parent: string = nanoid()
let latestSeq: number = -1
const seqs: { [key: string]: number } = {}
const values: { [key: string]: unknown } = {}

const sortFields = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map(sortFields)
  } else if (typeof value === 'object' && value !== null) {
    const sortedObj: { [key: string]: unknown } = {}
    const keys = Object.keys(value).sort()
    for (const key of keys) {
      sortedObj[key] = sortFields((value as Record<string, unknown>)[key])
    }
    return sortedObj
  } else {
    return value
  }
}

const encode = (value: unknown): string => {
  const sortedValue = sortFields(value)
  return JSON.stringify(sortedValue)
}

const shouldSetValue = (value: unknown, newValue: unknown): boolean =>
  encode(newValue) > encode(value)

const shouldSet = (seq: number, seq2: number, value: unknown, value2: unknown): boolean =>
  seq2 > seq || (seq2 === seq && shouldSetValue(value, value2))

const isPrototypePolluted = (key: string): boolean =>
  ['__proto__', 'constructor', 'prototype'].includes(key)

export const get = (key: string): unknown => values[key]

export const getNextVersion = (): { seq: number; parent: string } => {
  if (latestSeq === Number.MAX_SAFE_INTEGER) {
    latestSeq = -1
    grandparent = parent
    parent = nanoid()
  }
  latestSeq += 1

  return {
    seq: latestSeq,
    parent,
  }
}

export const set = (oldParent: string, newParent: string, seq: number, key: string, value: unknown): void => {
  if (isPrototypePolluted(key)) {
    console.warn(`Attempted prototype pollution: ${key}=${value}`)
    return
  }

  if (parent === newParent) {
    const currentSeq = seqs[key]
    if (currentSeq === undefined || shouldSet(currentSeq, seq, value, values[key])) {
      seqs[key] = seq
      values[key] = value
      latestSeq = Math.max(latestSeq, seq)
    }
  } else if (oldParent === parent && (newParent !== grandparent || newParent > parent)) {
    grandparent = parent
    parent = newParent
    seqs[key] = seq
    values[key] = value
    latestSeq = Math.max(latestSeq, seq)
  }
}
