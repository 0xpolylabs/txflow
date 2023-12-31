export type GetAction = 'getRequestsForCreator' | 'getRequest' | 'getRequestLogs'
export type PostAction = 'createWorkflowRequest' | 'addLog'

export interface ListForCreatorRequest {
  action: 'getRequestsForCreator'
  creatorAddress: string
}

export interface GetSingleRequest {
  action: 'getRequest'
  requestID: string
}

export interface GetSingleRequestLogsRequest {
  action: 'getRequestLogs'
  requestID: string
}

export interface CreateWorkflowRequest {
  action: 'createWorkflowRequest'
  name: string
  creatorAddress: string
  workflowID: string
}

export interface WorkflowRequest {
  name: string
  creatorAddress: string
  requestID: string
  workflowID: string
}

export interface CreatorListRequest {
  name: string
  requestID: string
  workflowID: string
}


export interface AddLogRequest {
  action: 'addLog'
  requestID: string
  message: string
}

export interface WorkflowRequestLog {
  message: string,
  timestamp: number,
}
