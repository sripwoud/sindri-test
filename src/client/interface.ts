export interface ClientI {
  baseUrl: string
  timeout: number

  pollForStatus: (endpoint: string, timeout: number) => Promise<any>
  request: <R>(
    endpoint: string,
    validateStatus: number,
    options?: RequestInit,
  ) => Promise<R>
  validateStatus: (response: Response, status: number) => void
  createCircuit: ({
    circuitName,
    circuitType,
  }: createCircuitReq) => Promise<string>
  uploadCircuitFile: ({
    circuitId,
    path,
  }: UploadCircuitFileReq) => Promise<boolean>
}

export interface ClientArgs {
  baseUrl: string
  timeout: number
}

export interface CreatedOk {
  circuit_id: string
  circuit_name: string
  circuit_type: string
  date_created: string
  status: string
  version: string
  compute_time: unknown | null
  compute_times: unknown | null
  curve: unknown | null
  degree: unknown | null
  num_constraints: unknown | null
  trusted_setup_file: unknown | null
  verification_key: unknown | null
  error: unknown | null
}

export interface createCircuitReq {
  circuitName: string
  circuitType: string
}

export interface UploadCircuitFileReq {
  circuitId: string
  path: string
}
