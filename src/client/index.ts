import FormData from 'form-data'
import { $ } from 'zx'
import { API_KEY, API_URL, TWENTY_MINUTES } from '../constants.js'
import {
  ClientArgs,
  ClientI,
  createCircuitReq,
  Item,
  PollCircuitStatusRes,
  PollProofStatusRes,
  UploadCircuitFileReq,
} from './interface.js'

export * from './interface.js'

export * from './interface.js'

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

  private async pollForStatus<
    T extends {
      status: 'Created' | 'Queued' | 'In Progress' | 'Ready' | 'Failed'
    },
  >({ id, type }: { id: string; type: Item }): Promise<T> {
    for (let i = 0; i < TWENTY_MINUTES; i++) {
      const response = await this.request<T>(`${type}/${id}/detail`, 200)

      console.log(response)
      if (['Ready', 'Failed'].includes(response.status)) {
        console.log(
          `Poll exited after ${i} seconds with status: ${response.status}`,
        )
        return response
      }

      await new Promise((resolve) => setTimeout(resolve, 1000))
    }

    throw new Error(`Polling timed out after ${TWENTY_MINUTES} seconds.`)
  }

  private async pollForCircuitStatus(
    id: string,
  ): Promise<PollCircuitStatusRes> {
    return this.pollForStatus<PollCircuitStatusRes>({ id, type: Item.Circuit })
  }

  private async pollForProofStatus(id: string): Promise<PollProofStatusRes> {
    return this.pollForStatus<PollProofStatusRes>({ id, type: Item.Proof })
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
    const body = new FormData()
    body.append('files', `@${path}`)

    // hack, could not make it work with node form data and native fetch
    const r = await $`curl --request POST \
     --url ${this.baseUrl}/circuit/${circuitId}/uploadfiles \
      --header "Authorization: Bearer ${API_KEY}" \
       --header "Content-Type: multipart/form-data" \
       --form files=@${path}`

    const { success } = JSON.parse(r.stdout)
    return success
  }

  async compileCircuit(circuitId: string): Promise<void> {
    const { success } = await this.request<{ success: boolean }>(
      `circuit/${circuitId}/compile`,
      201,
      {
        method: 'POST',
      },
    )

    if (!success) throw new Error('Circuit compilation failed.')
    const { status } = await this.pollForCircuitStatus(circuitId)
    if (status === 'Failed') throw new Error('Circuit compilation failed.')
  }

  private async _prove(circuitId: string, input: any): Promise<string> {
    return this.request<{ proof_id: string }>(
      `circuit/${circuitId}/prove`,
      201,
      {
        body: JSON.stringify({ proof_input: input }),
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      },
    ).then(({ proof_id: proofId }) => proofId)
  }

  async prove(circuitId: string, inputs: any): Promise<PollProofStatusRes> {
    const proofId = await this._prove(circuitId, inputs)
    return await this.pollForProofStatus(proofId)
  }
}

export const client = new Client({
  baseUrl: API_URL,
  timeout: TWENTY_MINUTES,
})
