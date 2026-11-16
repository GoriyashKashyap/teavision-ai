// Core TypeScript types for TeaVision AI

export const DISEASE_CLASSES = [
  'Tea algal leaf spot',
  'Brown Blight',
  'Gray Blight',
  'Helopeltis',
  'Red spider',
  'Green mirid bug',
  'Healthy leaf',
] as const;

export type DiseaseClass = typeof DISEASE_CLASSES[number];

export interface TopPrediction {
  class_name: DiseaseClass;
  class_index: number;
  confidence: number;
}

export interface QualityAssessment {
  quality_rating: 'excellent' | 'good' | 'fair';
  is_blurry: boolean;
  blur_score: number;
  brightness: number;
  contrast: number;
  lighting_condition: string;
  lighting_label: string;
  dimensions: [number, number];
  feedback_tips: string[];
}

export interface PredictionResult {
  prediction_id: string;
  predicted_class: DiseaseClass;
  class_index: number;
  confidence: number;
  top_predictions: TopPrediction[];
  probabilities: number[];
  inference_time_ms: number;
  model_version: string;
  created_at: string;
  image_url?: string;
  quality_assessment?: QualityAssessment;
  heatmap_overlay?: string;
  saliency_heatmap?: string;
  explanation_note?: string;
  diagnosis?: DiagnosticAssessment;
}

export interface ModelOption {
  id: string;
  name: string;
  display_name: string;
  architecture: string;
  family: string;
  parameters: number;
  format: string;
  is_default: boolean;
  badge: string;
  description: string;
  available: boolean;
  is_loaded?: boolean;
}

export interface ModelInfo {
  name: string;
  version: string;
  architecture: string;
  parameters: number;
  classes: string[];
  input_size: number[];
  status: 'ready' | 'loading' | 'error';
}

export interface HealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  model_loaded: boolean;
  version: string;
  timestamp: string;
}

export interface FeedbackPayload {
  prediction_id: string;
  user_assessment: 'correct' | 'incorrect' | 'unsure';
  comments?: string;
}

export interface FieldObservationPayload {
  prediction_id: string;
  plantation_name?: string;
  district?: string;
  latitude?: number;
  longitude?: number;
  lighting_condition?: 'direct_sunlight' | 'overcast' | 'shaded' | 'indoor_lab' | 'unknown';
  leaf_age?: 'tender_flush' | 'maintenance_mature' | 'old_coarse' | 'unknown';
  observation_notes?: string;
}

export interface PredictionsListResponse {
  total: number;
  items: PredictionResult[];
  limit: number;
  offset: number;
}

export interface AnalyticsSummary {
  total_predictions: number;
  healthy_count: number;
  disease_count: number;
  distribution: Record<string, number>;
  average_latency_ms: number;
  feedback_stats: Record<string, number>;
  field_observations_count: number;
}

export interface PredictionDetail extends PredictionResult {
  feedback?: Array<{
    id: string;
    user_assessment: string;
    comments?: string;
    created_at: string;
  }>;
  field_observation?: {
    id: string;
    plantation_name?: string;
    district?: string;
    lighting_condition?: string;
    leaf_age?: string;
    observation_notes?: string;
    created_at: string;
  };
}

export interface AssistantChatResponse {
  reply: string;
  suggested_followups: string[];
  references: string[];
  disclaimer: string;
  provider?: string;
}

export interface ApiError {
  detail: string;
  status_code?: number;
}

// ============================================================================
// Context-Aware Diagnostic Engine Types
// ============================================================================

export type EvidenceStrength = "insufficient" | "weak" | "moderate" | "strong";
export type CausalityType = "documented" | "contributing_factor" | "hypothesis" | "unverified";

export interface PossibleCause {
  agent: string;
  type: CausalityType;
  evidence: string[];
}

export interface ContributingFactor {
  factor: string;
  strength: "contributing" | "primary" | "secondary";
}

export interface ConfidenceEvidence {
  strength: EvidenceStrength;
  explanation: string;
  model_confidence: number;
  distinct_from_reasoning: string;
}

export interface Reference {
  title: string;
  year: string;
  url?: string;
}

export interface DiagnosticRecommendation {
  cultural: string[];
  sanitation: string[];
  drainage_canopy: string[];
  biological: string[];
  chemical: string[];
}

export interface DiagnosticAssessment {
  detected_category: string;
  possible_cause: PossibleCause;
  supporting_evidence: string[];
  contributing_factors: ContributingFactor[];
  missing_information: string[];
  confidence_evidence: ConfidenceEvidence;
  recommendations: DiagnosticRecommendation;
  references: Reference[];
  requires_expert_verification: boolean;
  last_reviewed_date: string;
}

export interface DiagnoseRequest {
  prediction_id: string;
  lighting_condition?: "direct_sunlight" | "overcast" | "shaded" | "indoor_lab" | "unknown";
  leaf_age?: "tender_flush" | "maintenance_mature" | "old_coarse" | "unknown";
  observation_notes?: string;
}

export interface DiagnoseResponse {
  diagnosis: DiagnosticAssessment;
  prediction_snapshot: {
    prediction_id: string;
    predicted_class: string;
    confidence: number;
    top_predictions: Array<{class_name: string; class_index: number; confidence: number}>;
    created_at: string;
  };
}

// Legacy enum exports for backward compatibility
export const lighting_condition_enum = {
  direct_sunlight: "direct_sunlight",
  overcast: "overcast",
  shaded: "shaded",
  indoor_lab: "indoor_lab",
  unknown: "unknown"
} as const;

export const leaf_age_enum = {
  tender_flush: "tender_flush",
  maintenance_mature: "maintenance_mature",
  old_coarse: "old_coarse",
  unknown: "unknown"
} as const;

export type UploadState =
  | { status: 'idle' }
  | { status: 'selected'; file: File; preview: string }
  | { status: 'uploading'; progress: number; preview?: string }
  | { status: 'success'; result: PredictionResult; preview?: string }
  | { status: 'error'; message: string };
