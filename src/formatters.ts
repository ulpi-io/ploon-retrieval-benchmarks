/**
 * Format converters - JSON to various formats
 */

import { stringify as stringifyYAML } from 'yaml'
import { Parser as Json2CsvParser } from 'json2csv'
import { XMLBuilder } from 'fast-xml-parser'
import { stringify as stringifyPloon } from 'ploon'
import { encode as encodeToon } from '@toon-format/toon'
import type { FormatName } from './types'

/**
 * Convert JSON data to CSV format
 * Properly handles nested arrays by denormalizing (duplicating parent data)
 */
function toCSV(data: unknown): string {
  if (!Array.isArray(data) || data.length === 0) {
    return ''
  }

  // Check if data has nested arrays (like products with colors/sizes)
  const firstRecord = data[0]
  const hasNestedArrays = firstRecord && typeof firstRecord === 'object' &&
    Object.values(firstRecord).some(val => Array.isArray(val) && val.length > 0 && typeof val[0] === 'object')

  if (hasNestedArrays) {
    // Denormalize: expand nested arrays into separate rows
    return denormalizeToCSV(data)
  }

  // Simple case: use json2csv with unwind for simple nested objects
  try {
    const parser = new Json2CsvParser({
      flatten: true,
      unwind: [],
    })
    return parser.parse(data)
  } catch (error) {
    // Fallback: just flatten objects
    return flattenToCSV(data)
  }
}

/**
 * Denormalize nested arrays for CSV (e.g., products → colors → sizes)
 * Each row represents the deepest level with parent data duplicated
 */
function denormalizeToCSV(data: any[]): string {
  const rows: any[] = []

  for (const record of data) {
    // Find nested array fields
    const arrayFields = Object.entries(record)
      .filter(([_, value]) => Array.isArray(value) && value.length > 0 && typeof value[0] === 'object')

    if (arrayFields.length === 0) {
      // No nested arrays, add as-is
      rows.push(flattenObject(record))
      continue
    }

    // Get first level nested array (e.g., colors)
    const [firstArrayKey, firstArrayValue] = arrayFields[0] as [string, any[]]

    for (const nestedItem of firstArrayValue) {
      // Check if this nested item has its own arrays (e.g., sizes)
      const deeperArrays = Object.entries(nestedItem)
        .filter(([_, value]) => Array.isArray(value) && value.length > 0 && typeof value[0] === 'object')

      if (deeperArrays.length > 0) {
        // Two levels deep: expand both
        const [secondArrayKey, secondArrayValue] = deeperArrays[0] as [string, any[]]

        for (const deepItem of secondArrayValue) {
          // Combine parent + nested + deep into one row
          const flatRow = {
            ...flattenObject(record, [firstArrayKey]),  // Parent data (excluding nested array)
            ...flattenObject(nestedItem, [secondArrayKey], `${firstArrayKey}.`),  // First nested level
            ...flattenObject(deepItem, [], `${firstArrayKey}.${secondArrayKey}.`),  // Second nested level
          }
          rows.push(flatRow)
        }
      } else {
        // Only one level deep
        const flatRow = {
          ...flattenObject(record, [firstArrayKey]),
          ...flattenObject(nestedItem, [], `${firstArrayKey}.`),
        }
        rows.push(flatRow)
      }
    }
  }

  // Convert to CSV
  if (rows.length === 0) return ''

  const parser = new Json2CsvParser({
    fields: Object.keys(rows[0]),
  })
  return parser.parse(rows)
}

/**
 * Flatten object to dot notation, excluding specified fields
 */
function flattenObject(obj: any, excludeFields: string[] = [], prefix = ''): Record<string, any> {
  const flat: Record<string, any> = {}

  for (const [key, value] of Object.entries(obj)) {
    if (excludeFields.includes(key)) continue

    const fullKey = prefix + key

    if (value === null || value === undefined) {
      flat[fullKey] = value
    } else if (Array.isArray(value)) {
      // Simple arrays: join as comma-separated
      flat[fullKey] = value.map(v => typeof v === 'object' ? JSON.stringify(v) : v).join(',')
    } else if (typeof value === 'object') {
      // Nested object: flatten with dot notation
      const nested = flattenObject(value, [], fullKey + '.')
      Object.assign(flat, nested)
    } else {
      flat[fullKey] = value
    }
  }

  return flat
}

/**
 * Fallback CSV conversion with simple flattening
 */
function flattenToCSV(data: any[]): string {
  const flattened = data.map(record => flattenObject(record))
  const parser = new Json2CsvParser({
    fields: Object.keys(flattened[0] || {}),
  })
  return parser.parse(flattened)
}

/**
 * Convert JSON data to XML format
 */
function toXML(data: unknown): string {
  const builder = new XMLBuilder({
    format: true,
    indentBy: '  ',
    suppressEmptyNode: true,
  })

  return builder.build({ data })
}

/**
 * Format converters registry
 */
export const formatters: Record<FormatName, (data: unknown) => string> = {
  'json': (data) => JSON.stringify(data, null, 2),
  'yaml': (data) => stringifyYAML(data),
  'csv': (data) => toCSV(data),
  'xml': (data) => toXML(data),
  'toon': (data) => encodeToon(data),
  'ploon': (data) => stringifyPloon(data),
}

/**
 * Get file extension for a format
 */
export function getFileExtension(format: FormatName): string {
  const extensions: Record<FormatName, string> = {
    'json': 'json',
    'yaml': 'yaml',
    'csv': 'csv',
    'xml': 'xml',
    'toon': 'toon',
    'ploon': 'ploon',
  }

  return extensions[format]
}
