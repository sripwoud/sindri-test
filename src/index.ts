import { openAsBlob, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import { client } from './client'
import { CreatedOk } from './client/interface'

async function createCircuit(): Promise<string> {
  console.log('Creating circuit...')
  const createResponse = await client.request<CreatedOk>(
    'circuit/create',
    201,
    {
      body: JSON.stringify({
        circuit_name: 'cubic_example',
        circuit_type: 'Circom C Groth16 bn254',
      }),
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
    },
  )
  console.log('Circuit created!')
  console.log({ createResponse })

  const { circuit_id: circuitId } = createResponse
  writeFileSync(join(__dirname, '..', 'circuit-id.txt'), circuitId)
  return circuitId
}

async function maybeCreateCircuit(): Promise<string> {
  try {
    return readFileSync(join(__dirname, '..', 'circuit-id.txt'), 'utf-8')
  } catch (error) {
    if (error.code === 'ENOENT') {
      return await createCircuit()
    } else {
      throw error
    }
  }
}

async function main() {
  try {
    const circuitId = await maybeCreateCircuit()

    const circuitFilePath = join(__dirname, '..', 'circuits', 'cubic.tar.gz')
    const circuitFileBuffer = await openAsBlob(circuitFilePath)

    const uploadFormData = new FormData()
    uploadFormData.set('files', circuitFileBuffer, 'cubic.tar.gz')
    console.log(uploadFormData)

    await client.request(`circuit/${circuitId}/uploadfiles`, 201, {
      body: uploadFormData,
      method: 'POST',
    })

    console.log('Circuit files uploaded!')

    await client.request(`circuit/${circuitId}/compile`, 201, {
      method: 'POST',
    })

    const pollResponse = await client.pollForStatus(
      `circuit/${circuitId}/detail`,
    )
    const {
      data: { status: compileStatus },
    } = pollResponse

    const jsonResponse = JSON.stringify(pollResponse['data'], null, 2)
    console.log('Polling Response:', jsonResponse)

    // Check for compilation issues.
    if (compileStatus === 'Failed')
      throw new Error('Circuit compilation failed.')

    console.log('Circuit compilation succeeded!')
  } catch (error) {
    if (error instanceof Error) {
      console.error(error.message)
    } else {
      console.error('An unknown error occurred.')
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
