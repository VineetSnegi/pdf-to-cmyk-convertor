import { useState, useCallback } from 'react';
import { apiService } from '@/services/apiService';
import { ApiError } from '@/types';

export interface UploadState {
  isUploading: boolean;
  uploadProgress: string;
  downloadUrl: string | null;
  error: string | null;
}

export const useFileUpload = () => {
  const [state, setState] = useState<UploadState>({
    isUploading: false,
    uploadProgress: '',
    downloadUrl: null,
    error: null,
  });

  const resetState = useCallback(() => {
    setState({
      isUploading: false,
      uploadProgress: '',
      downloadUrl: null,
      error: null,
    });
  }, []);

  const uploadFile = useCallback(async (file: File) => {
    resetState();
    setState(prev => ({ ...prev, isUploading: true, uploadProgress: 'Starting upload...' }));

    try {
      // Step 1: Get signed upload URL
      setState(prev => ({ ...prev, uploadProgress: 'Requesting upload URL...' }));
      const uploadData = await apiService.getUploadUrl(file.name);

      // Step 2: Upload to GCS
      setState(prev => ({ ...prev, uploadProgress: 'Uploading file to Cloud Storage...' }));
      await apiService.uploadFile(uploadData.upload_url, file);

      // Step 3: Poll for conversion completion
      setState(prev => ({ ...prev, uploadProgress: 'Processing conversion...' }));
      let retries = 0;
      const maxRetries = 20;
      const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

      while (retries < maxRetries) {
        await wait(5000); // Wait 5 seconds
        setState(prev => ({ 
          ...prev, 
          uploadProgress: `Checking status... (${retries + 1}/${maxRetries})` 
        }));

        try {
          const result = await apiService.checkStatus(uploadData.file_name);
          setState(prev => ({
            ...prev,
            isUploading: false,
            uploadProgress: 'Conversion complete!',
            downloadUrl: result.download_url,
          }));
          return result;
        } catch (error) {
          // Continue polling if status check fails
          retries++;
        }
      }

      throw new Error('Timed out waiting for conversion');
    } catch (error) {
      const apiError = error as ApiError;
      setState(prev => ({
        ...prev,
        isUploading: false,
        uploadProgress: '',
        error: apiError.message || 'Upload failed. Please try again.',
      }));
      throw error;
    }
  }, [resetState]);

  return {
    ...state,
    uploadFile,
    resetState,
  };
};