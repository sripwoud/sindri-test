import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import process from 'process'
import { client, createCircuitReq } from './client/index.js'
import { getDirname } from './lib.js'

const circuitsDir = join(getDirname(import.meta.url), '..', 'circuits')
const circuitIdFile = join(circuitsDir, 'circuit-id.txt')

console.log({ circuitIdFile })

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
      console.log('writing circuit id to file')
      writeFileSync(circuitIdFile, circuitId)
      return circuitId
    } else {
      throw error
    }
  }
}
async function main() {
  const circuitId = await maybeCreateCircuit({
    circuitName: 'cubic_example',
    circuitType: 'Gnark',
  })
  console.log({ circuitId })

  const success = await client.uploadCircuitFile({
    circuitId,
    path: join(circuitsDir, 'cubic.tar.gz'),
  })

  console.log({ success })

  await client.compileCircuit(circuitId)

  console.log('Circuit compilation succeeded!')

  const input = readFileSync(join(circuitsDir, 'cubic_input.json'), 'utf-8')
  const proof = await client.prove(circuitId, input)
  console.log({ proof })
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    if (err instanceof Error) {
      console.error(err.message)
    } else {
      console.error('An unknown error occurred.')
      console.error(err)
    }
    process.exit(1)
  })
