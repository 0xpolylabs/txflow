import type { VercelRequest, VercelResponse } from '@vercel/node'
import { kv } from '@vercel/kv'
import * as crypto from 'crypto'
import {
  AddLogRequest,
  CreateWorkflowRequest,
  CreatorListRequest,
  GetAction,
  GetSingleRequest,
  GetSingleRequestLogsRequest,
  ListForCreatorRequest,
  PostAction,
  WorkflowRequest,
  WorkflowRequestLog,
} from 'types/requests.api'

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  if (request.method === 'GET') {
    const action = request.query['action'] as GetAction | undefined
    if (!action) {
      return response.status(400).json({error: 'Missing action'})
    }

    if (action === 'getRequestsForCreator') {
      let {creatorAddress} = request.query as unknown as ListForCreatorRequest
      if (!creatorAddress) {
        return response.status(400).json({error: 'Missing creatorAddress'})
      }
      creatorAddress = (creatorAddress as string).toLowerCase()

      const requests = await kv.lrange<CreatorListRequest>(`creators:${creatorAddress}:requests`, 0, -1)

      return response.status(200).json(requests as CreatorListRequest[])
    }
    if (action === 'getRequest') {
      const {requestID} = request.query as unknown as GetSingleRequest
      if (!requestID) {
        return response.status(400).json({error: 'Missing requestID'})
      }

      const req = await kv.get<WorkflowRequest>(`requests:${requestID}`)
      if (!req) {
        return response.status(404).json({error: 'Request not found'})
      }

      return response.status(200).json(req as WorkflowRequest)
    } else if (action === 'getRequestLogs') {
      const {requestID} = request.query as unknown as GetSingleRequestLogsRequest
      if (!requestID) {
        return response.status(400).json({error: 'Missing requestID'})
      }

      const logs = await kv.lrange<WorkflowRequestLog>(`requests:${requestID}:logs`, 0, -1)

      return response.status(200).json(logs)
    } else {
      return response.status(400).json({error: 'Invalid action'})
    }
  } else if (request.method === 'POST') {
    const action = request.body['action'] as PostAction | undefined
    if (!action) {
      return response.status(400).json({error: 'Missing action'})
    }

    if (action === 'createWorkflowRequest') {
      let {name, creatorAddress, workflowID} = request.body as unknown as CreateWorkflowRequest
      if (!name) {
        return response.status(400).json({error: 'Missing name'})
      }
      if (!creatorAddress) {
        return response.status(400).json({error: 'Missing creatorAddress'})
      }
      if (!workflowID) {
        return response.status(400).json({error: 'Missing workflowID'})
      }

      creatorAddress = (creatorAddress as string).toLowerCase()

      const requestID = crypto.randomUUID()
      await kv.set<WorkflowRequest>(`requests:${requestID}`, {
        name,
        creatorAddress,
        requestID,
        workflowID,
      })
      await kv.lpush<CreatorListRequest>(`creators:${creatorAddress}:requests`, {
        name,
        requestID,
        workflowID,
      })

      return response.status(201).json({requestID, workflowID} as CreatorListRequest)
    } else if (action === 'addLog') {
      const {requestID, message, logAction, payload}: AddLogRequest = request.body

      const workflowRequestLog: WorkflowRequestLog = {
        message,
        action: logAction,
        payload,
        timestamp: Date.now(),
      }
      await kv.lpush<WorkflowRequestLog>(`requests:${requestID}:logs`, workflowRequestLog)

      return response.status(201).json(workflowRequestLog)
    } else {
      return response.status(400).json({error: 'Invalid action'})
    }
  } else {
    return response
  }
}
