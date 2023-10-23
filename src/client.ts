import { ClientArgs, ClientI } from './client/interface'
import { API_KEY, API_URL, HEADERS, TWENTY_MINUTES } from './constants'

export class Client implements ClientI {
  baseUrl: string
  timeout: number
  headers: Record<string, string>

  constructor({ baseUrl, headers, timeout }: ClientArgs) {
    this.baseUrl = baseUrl
    this.timeout = timeout
    this.headers = headers
  }

  async request<R>(
    endpoint: string,
    validateStatus = 200,
    options?: RequestInit,
  ): Promise<R> {
    const response = await fetch(
      `${this.baseUrl}/${endpoint}?api_key=${API_KEY}`,
      {
        headers: this.headers,
        ...options,
      },
    )

    await this.validateStatus(response, validateStatus)
    return await response.json()
  }

  async pollForStatus(endpoint: string, timeout = this.timeout) {
    for (let i = 0; i < timeout; i++) {
      const response = await this.request(endpoint, 200)

      const status: string = response?.['data']?.status
      if (['Ready', 'Failed'].includes(status)) {
        console.log(`Poll exited after ${i} seconds with status: ${status}`)
        return response
      }

      await new Promise((resolve) => setTimeout(resolve, 1000))
    }

    throw new Error(`Polling timed out after ${timeout} seconds.`)
  }

  async validateStatus(response: Response, status: number) {
    if (response.status !== status) {
      const res = await response.json()
      throw new Error(
        `Request failed with status ${response.status}. ${JSON.stringify(
          res,
        )})}`,
      )
    }
  }
}

export const client = new Client({
  baseUrl: API_URL,
  headers: HEADERS,
  timeout: TWENTY_MINUTES,
})
