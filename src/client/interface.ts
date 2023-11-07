export enum Item {
  Circuit = 'circuit',
  Proof = 'proof',
}

export interface ClientI {
  baseUrl: string
  timeout: number

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
  compileCircuit: (circuitId: string) => Promise<void>
  prove: (circuitId: string, inputs: any) => Promise<PollProofStatusRes>
}

export interface ClientArgs {
  baseUrl: string
  timeout: number
}

export interface createCircuitReq {
  circuitName: string
  circuitType: string
}

export interface UploadCircuitFileReq {
  circuitId: string
  path: string
}

export interface PollCircuitStatusRes {
  circuit_id: string
  circuit_name: string
  circuit_type: string
  curve: string
  date_created: string
  status: 'Created' | 'Queued' | 'In Progress' | 'Ready' | 'Failed'
  compute_time: string | null
  compute_times: Record<string, number> | null
  file_sizes: { total: number; total_mb: number; total_gb: number }
  metadata: { api_version: string; prover_backend_version: string }
  system_info: any
  verification_key: { verifying_key: string }
  error: Error | null
}

export interface PollProofStatusRes {
  circuit_id: string
  circuit_name: string
  date_created: string
  status: 'Created' | 'Queued' | 'In Progress' | 'Ready' | 'Failed'
  version: string
  error: Error | null
  num_constraints: number
  num_outputs: number
  curve: string
  num_private_inputs: number
  num_public_inputs: number
}
