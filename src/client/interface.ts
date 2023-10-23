export interface ClientI {
  baseUrl: string
  timeout: number
  headers: Record<string, string>

  pollForStatus: (endpoint: string, timeout: number) => Promise<any>
  request: (
    endpoint: string,
    validateStatus: number,
    options?: RequestInit,
  ) => Promise<Record<string, any>>
  validateStatus: (response: Response, status: number) => void
}

export interface ClientArgs {
  baseUrl: string
  timeout: number
  headers: Record<string, string>
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
