import axios, { AxiosError } from 'axios';
import type {
  PredictionResult,
  ModelInfo,
  HealthResponse,
  FeedbackPayload,
  FieldObservationPayload,
  PredictionsListResponse,
  PredictionDetail,
  AnalyticsSummary,
  AssistantChatResponse,
  ApiError,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60_000,
});

// ---- Health ----------------------------------------------------------------

export async function checkHealth(): Promise<HealthResponse> {
  const { data } = await apiClient.get<HealthResponse>('/health');
  return data;
}

// ---- Model info ------------------------------------------------------------

export async function getModelInfo(): Promise<ModelInfo> {
  const { data } = await apiClient.get<ModelInfo>('/api/v1/model/info');
  return data;
}

// ---- Predict ---------------------------------------------------------------

export async function predict(
  imageFile: File,
  onUploadProgress?: (pct: number) => void,
): Promise<PredictionResult> {
  const form = new FormData();
  form.append('file', imageFile);

  const { data } = await apiClient.post<PredictionResult>(
    '/api/v1/predict',
    form,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (evt) => {
        if (evt.total && onUploadProgress) {
          onUploadProgress(Math.round((evt.loaded / evt.total) * 100));
        }
      },
    },
  );
  return data;
}

// ---- Feedback --------------------------------------------------------------

export async function submitFeedback(payload: FeedbackPayload): Promise<void> {
  await apiClient.post('/api/v1/feedback', payload);
}

// ---- History & Predictions -------------------------------------------------

export async function getPredictions(params?: {
  limit?: number;
  offset?: number;
  disease?: string;
  search?: string;
}): Promise<PredictionsListResponse> {
  const { data } = await apiClient.get<PredictionsListResponse>('/api/v1/predictions', {
    params,
  });
  return data;
}

export async function getPrediction(id: string): Promise<PredictionDetail> {
  const { data } = await apiClient.get<PredictionDetail>(`/api/v1/predictions/${id}`);
  return data;
}

// ---- Field Observations (Module 7) -----------------------------------------

export async function submitFieldObservation(payload: FieldObservationPayload): Promise<{ id: string }> {
  const { data } = await apiClient.post<{ id: string }>('/api/v1/field-observations', payload);
  return data;
}

// ---- Analytics (Module 5) --------------------------------------------------

export async function getAnalyticsSummary(): Promise<AnalyticsSummary> {
  const { data } = await apiClient.get<AnalyticsSummary>('/api/v1/analytics/summary');
  return data;
}

// ---- AI Agricultural Assistant (Phase 6) -----------------------------------

export async function askAssistant(
  message: string,
  contextDisease?: string,
): Promise<AssistantChatResponse> {
  const { data } = await apiClient.post<AssistantChatResponse>('/api/v1/assistant/chat', {
    message,
    context_disease: contextDisease,
  });
  return data;
}

// ---- Error helper ----------------------------------------------------------

export function extractApiError(err: unknown): string {
  if (err instanceof AxiosError) {
    const data = err.response?.data as ApiError | undefined;
    if (data?.detail) return data.detail;
    if (err.response?.status === 413) return 'Image file is too large. Please use an image under 10 MB.';
    if (err.response?.status === 422) return 'Invalid image file. Please upload a JPEG, PNG, or WebP image.';
    if (err.code === 'ECONNABORTED') return 'Request timed out. Please try again.';
    if (!err.response) return 'Cannot reach the server. Check your connection.';
  }
  return 'An unexpected error occurred. Please try again.';
}
