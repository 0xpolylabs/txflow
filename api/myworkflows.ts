import type { VercelRequest, VercelResponse } from '@vercel/node'
import { kv } from '@vercel/kv'
import { AddWorkflowData, GetListQuery, WorkflowID } from '../types/my-workflows.api'

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  if (request.method === 'GET') {
    let {creatorAddress} = request.query as unknown as GetListQuery
    if (!creatorAddress) {
      return response.status(400).json({error: 'Missing creatorAddress'})
    }
    creatorAddress = (creatorAddress as string).toLowerCase()

    const workflows = await kv.lrange<WorkflowID>(`creators:${creatorAddress}:workflows`, 0, -1)

    return response.status(200).json(workflows as WorkflowID[])
  } else if (request.method === 'POST') {
    let {creatorAddress, workflowID} = request.body as unknown as AddWorkflowData
    if (!creatorAddress) {
      return response.status(400).json({error: 'Missing creatorAddress'})
    }
    if (!workflowID) {
      return response.status(400).json({error: 'Missing workflowID'})
    }

    creatorAddress = (creatorAddress as string).toLowerCase()

    const res = await kv.lpos<WorkflowID>(`creators:${creatorAddress}:workflows`, workflowID)
    if (res !== null) {
      return response.status(200).json({workflowID})
    }

    await kv.lpush<WorkflowID>(`creators:${creatorAddress}:workflows`, workflowID)

    return response.status(201).json({workflowID})
  } else {
    return response
  }
}
