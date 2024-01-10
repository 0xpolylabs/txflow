export interface GetListQuery {
  creatorAddress: string
}

export type WorkflowID = string

export interface AddWorkflowData {
  creatorAddress: string
  workflowID: string
}
