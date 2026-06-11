export type AgeBand = '0-12m' | '1-3y' | '0-3y' | 'adult' | 'family'
export type SkuStatus = 'current' | 'concept'
export type Format = 'tin' | 'soap-bar' | 'bottle' | 'tube' | 'cotton' | 'paper' | 'jar' | 'gift-box' | 'stick' | 'carton'
export type ScenarioId = 'all-branch' | 'velocity' | 'duration'
export type Replenishment = 'high' | 'medium' | 'low'

export interface Sku {
  id: string
  name: string
  status: SkuStatus
  scenario?: ScenarioId
  format: Format
  ageBand: AgeBand
  price: number | null
  waterBased?: boolean
  heroIngredients?: string[]
  uses?: string[]
  rationale?: string
  regulatory?: string
  replenishment?: Replenishment
  renderPrompt?: string
}

export interface GeneratedSpec {
  name: string
  tagline: string
  format: Format
  ageBand: AgeBand
  price: number
  heroIngredients: string[]
  uses: string[]
  waterBased: boolean
  scenario: ScenarioId
  rationale: string
  renderPrompt: string
}

export interface Bundle {
  id: string
  name: string
  contains: string[]
  scenario?: ScenarioId
}

export interface Scenario {
  id: ScenarioId
  name: string
  thesis: string
}

export interface DecisionInput {
  id: string
  name: string
  question: string
}

export interface SeedData {
  meta: { brand: string; source: string; note: string }
  skus: Sku[]
  bundles: Bundle[]
  scenarios: Scenario[]
  decisionInputs: DecisionInput[]
}
