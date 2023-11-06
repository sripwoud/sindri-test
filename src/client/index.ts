import { API_KEY, API_URL, TWENTY_MINUTES } from '../constants'
import {
  ClientArgs,
  ClientI,
  createCircuitReq,
  UploadCircuitFileReq,
} from './interface'

export * from './interface'

export class Client implements ClientI {
  baseUrl: string
  timeout: number

  constructor({ baseUrl, timeout }: ClientArgs) {
    this.baseUrl = baseUrl
    this.timeout = timeout
  }

  async request<R>(
    endpoint: string,
    validateStatus = 200,
    options?: RequestInit,
  ): Promise<R> {
    console.log(`${this.baseUrl}/${endpoint}`)
    const _options = {
      ...options,
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        ...options?.headers,
      },
    }
    console.log(_options)
    const response = await fetch(`${this.baseUrl}/${endpoint}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        ...options?.headers,
      },
    })

    await this.validateStatus(response, validateStatus).catch((error) => {
      console.log(error)
      throw error
    })
    console.log(`Request to ${endpoint} succeeded.`)
    return await response.json()
  }

  async pollForStatus(endpoint: string, timeout = this.timeout): Promise<any> {
    for (let i = 0; i < timeout; i++) {
      const response = await this.request(endpoint, 200)

      // @ts-expect-error
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
      throw new Error(
        `Request failed with status ${response.status}: ${response.statusText}`,
      )
    }
  }

  async createCircuit({
    circuitName,
    circuitType,
  }: createCircuitReq): Promise<string> {
    console.log('Creating circuit...')

    return this.request<{ circuit_id: string }>('circuit/create', 201, {
      body: JSON.stringify({
        circuit_name: circuitName,
        circuit_type: circuitType,
      }),
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
    }).then(({ circuit_id: circuitId }) => circuitId)
  }

  async uploadCircuitFile({
    circuitId,
    path,
  }: UploadCircuitFileReq): Promise<boolean> {
    console.log({ path })
    const body = new FormData()
    body.append('files', path)

    return await this.request<{ success: boolean }>(
      `circuit/${circuitId}/uploadfiles`,
      201,
      {
        body,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        method: 'POST',
      },
    ).then(({ success }) => success)
  }
}

export const client = new Client({
  baseUrl: API_URL,
  timeout: TWENTY_MINUTES,
})
