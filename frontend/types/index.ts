export interface UploadResponse {
  upload_url: string;
  file_name: string;
}

export interface ConversionStatus {
  status: 'pending' | 'processing' | 'completed' | 'failed';
  download_url?: string;
  error?: string;
}

export interface ConversionResult {
  download_url: string;
  file_name: string;
}

export interface ApiError {
  message: string;
  status: number;
}