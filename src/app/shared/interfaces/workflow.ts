// After changing this file, run
// `npx ts-interface-builder src/app/shared/interfaces/workflow.ts`
// to regenerate the interface for runtime type checking

export interface Workflow {
  template_version: string
  workflow_name: string
  workflow_description: string
  steps: [Step, ...Step[]];
}

export interface Step {
  chain_id: string
  to: string
  value: string
  data: string
  description: string
}
