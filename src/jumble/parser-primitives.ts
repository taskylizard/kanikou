import { unique } from 'radashi'
import { z } from 'zod'

export const unknownArraySchema = z.array(z.unknown()).catch([])

export function optionalTextSchema(maxLength?: number) {
  return z.unknown().transform((value): string | undefined => {
    if (typeof value !== 'string') return undefined
    const trimmed = value.trim()
    if (trimmed.length === 0) return undefined
    return maxLength === undefined ? trimmed : trimmed.slice(0, maxLength)
  })
}

export function coercedNumberSchema() {
  return z.unknown().transform((value): number => {
    if (typeof value === 'number' && Number.isFinite(value)) return value
    if (typeof value !== 'string' || value.trim() === '') return 0

    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : 0
  })
}

export function envelopeArraySchema<T extends z.ZodType>(entry: T) {
  return z.array(entry).catch([])
}

export function mergeNormalizedValues(
  first: readonly string[] | undefined,
  second: readonly string[] | undefined,
  normalize: (value: string) => string,
  limit = 8
): string[] | undefined {
  const merged = unique([...(first ?? []), ...(second ?? [])], normalize)
  return merged.length === 0 ? undefined : merged.slice(0, limit)
}

export function foldEquals(actual: string, expected: string): boolean {
  return actual.trim().localeCompare(expected.trim(), undefined, { sensitivity: 'base' }) === 0
}
