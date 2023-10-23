import process from 'process'

export const API_KEY = process.env['FORGE_API_KEY'] ?? ''

const API_VERSION = 'v1'
export const API_URL = `https://forge.sindri.app/api/${API_VERSION}`
export const HEADERS = {
  Accept: 'application/json',
  'Content-Type': 'application/x-www-form-urlencoded',
}
export const TWENTY_MINUTES = 60 * 20
