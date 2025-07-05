'use client';

import { useState } from 'react';
import { Upload, FileText, Download, AlertCircle, CheckCircle } from 'lucide-react';
import { useFileUpload } from '@/hooks/useFileUpload';

export default function FileUpload() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { isUploading, uploadProgress, downloadUrl, error, uploadFile, resetState } = useFileUpload();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      resetState();
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      alert('Please select a PDF file first.');
      return;
    }

    try {
      await uploadFile(selectedFile);
    } catch (error) {
      console.error('Upload failed:', error);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    resetState();
    // Reset file input
    const fileInput = document.getElementById('pdfInput') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">PDF to CMYK Converter</h1>
        <p className="text-gray-600">Upload your PDF and get a CMYK-converted version</p>
      </div>

      {/* File Selection */}
      <div className="mb-6">
        <div className="flex items-center justify-center w-full">
          <label 
            htmlFor="pdfInput" 
            className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors"
          >
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <Upload className="w-8 h-8 mb-4 text-gray-500" />
              <p className="mb-2 text-sm text-gray-500">
                <span className="font-semibold">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-gray-500">PDF files only</p>
            </div>
            <input 
              id="pdfInput" 
              type="file" 
              accept=".pdf" 
              onChange={handleFileSelect}
              className="hidden" 
            />
          </label>
        </div>
        
        {selectedFile && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg flex items-center">
            <FileText className="w-5 h-5 text-blue-600 mr-2" />
            <span className="text-sm text-blue-800">{selectedFile.name}</span>
          </div>
        )}
      </div>

      {/* Upload Button */}
      <div className="mb-6">
        <button
          onClick={handleUpload}
          disabled={!selectedFile || isUploading}
          className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {isUploading ? 'Processing...' : 'Convert to CMYK'}
        </button>
      </div>

      {/* Status Display */}
      {uploadProgress && !downloadUrl && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-3"></div>
            <span className="text-blue-800">{uploadProgress}</span>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 rounded-lg">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
            <span className="text-red-800">{error}</span>
          </div>
        </div>
      )}

      {/* Success and Download */}
      {downloadUrl && (
        <div className="mb-6 p-4 bg-green-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
              <span className="text-green-800 font-semibold">Conversion complete!</span>
            </div>
            <a
              href={downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              download
              className="flex items-center bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download className="w-4 h-4 mr-2" />
              Download CMYK PDF
            </a>
          </div>
        </div>
      )}

      {/* Reset Button */}
      {(selectedFile || downloadUrl || error) && (
        <div className="text-center">
          <button
            onClick={handleReset}
            className="text-gray-600 hover:text-gray-800 underline"
          >
            Upload another file
          </button>
        </div>
      )}
    </div>
  );
}