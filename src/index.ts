import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import { client, createCircuitReq } from './client'

const circuitIdFile = join(__dirname, '..', 'circuit-id.txt')

const maybeCreateCircuit = async ({
  circuitName,
  circuitType,
}: createCircuitReq): Promise<string> => {
  try {
    return readFileSync(circuitIdFile, 'utf-8')
  } catch (error) {
    if (error.code === 'ENOENT') {
      const circuitId = await client.createCircuit({
        circuitName,
        circuitType,
      })
      writeFileSync(circuitIdFile, circuitId)
      return circuitId
    } else {
      throw error
    }
  }
}
async function main() {
  try {
    const circuitId = await maybeCreateCircuit({
      circuitName: 'cubic_example',
      circuitType: 'Gnark',
    })
    console.log({ circuitId })

    const success = await client.uploadCircuitFile({
      circuitId,
      path: join(__dirname, '..', 'circuits', 'cubic.tar.gz'),
    })
    console.log({ success })

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
