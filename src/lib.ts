import { dirname } from 'path'
import { fileURLToPath } from 'url'

export const getDirname = (metaUrl: string) => dirname(fileURLToPath(metaUrl))
