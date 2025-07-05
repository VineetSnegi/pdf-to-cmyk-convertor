import axios from 'axios';
import { UploadResponse, ConversionResult, ApiError } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://pdf-cmyk-service-17999601924.us-central1.run.app';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// API response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const apiError: ApiError = {
      message: error.response?.data?.message || error.message || 'An error occurred',
      status: error.response?.status || 500,
    };
    return Promise.reject(apiError);
  }
);

export const apiService = {
  // Get signed upload URL
  async getUploadUrl(fileName: string): Promise<UploadResponse> {
    const response = await apiClient.post('/generate-upload-url', {
      file_name: fileName,
    });
    return response.data;
  },

  // Upload file to GCS
  async uploadFile(uploadUrl: string, file: File): Promise<void> {
    await axios.put(uploadUrl, file, {
      headers: {
        'Content-Type': 'application/pdf',
      },
    });
  },

  // Check conversion status
  async checkStatus(fileName: string): Promise<ConversionResult> {
    const response = await apiClient.get(`/check-status/${fileName}`);
    return response.data;
  },
};