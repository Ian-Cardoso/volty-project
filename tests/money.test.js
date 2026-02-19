import test from 'node:test'
import assert from 'node:assert/strict'
import { formatCurrency } from '../scripts/utils/money.js'

test('formatCurrency converts cents to dollars with two decimals', () => {
  assert.strictEqual(formatCurrency(2095), '20.95')
  assert.strictEqual(formatCurrency(0), '0.00')
  assert.strictEqual(formatCurrency(2000.5), '20.01')
  assert.strictEqual(formatCurrency(2000.4), '20.00')
})
