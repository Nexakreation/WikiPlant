"use client";

import React from 'react';
import { useState, useRef, useCallback } from 'react';
import BookLoader from './BookLoader';
import { useDropzone } from 'react-dropzone';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Add this near the top of your component, after the imports
if (!process.env.NEXT_PUBLIC_GOOGLE_API_KEY) {
  console.error('NEXT_PUBLIC_GOOGLE_API_KEY is not set');
}

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GOOGLE_API_KEY as string);

interface ImageUploadProps {
  setPlantInfo: (info: string) => void;
  setImageUrl: (url: string) => void;
  setConfidence: (confidence: number | null) => void; // Add this line
}

interface PlantIdentification {
  commonName: string;
  scientificName: string;
  confidence: number;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ setPlantInfo, setImageUrl, setConfidence }) => {
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const identifyPlantWithPlantId = async (file: File): Promise<PlantIdentification> => {
    const formData = new FormData();
    formData.append('images', file);

    console.log('Sending request to Plant.id API...');
    const response = await fetch('/api/identify-plant', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      console.error('Plant.id API response not OK:', response.status, response.statusText);
      throw new Error('Failed to identify plant with Plant.id');
    }

    const data = await response.json();
    console.log('Plant.id API response:', JSON.stringify(data, null, 2));

    if (data.suggestions && data.suggestions.length > 0) {
      const plantData = {
        commonName: data.suggestions[0].plant_name,
        scientificName: data.suggestions[0].plant_details.scientific_name,
        confidence: data.suggestions[0].probability
      };
      console.log('Extracted plant data:', plantData);
      return plantData;
    } else {
      console.error('No plant suggestions found in Plant.id response');
      throw new Error('No plant identification found');
    }
  };

  const getAdditionalInfoFromGemini = async (plantName: string): Promise<string> => {
    try {
      console.log('Initializing Gemini model...');
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
      
      const prompt = `Provide detailed information about the plant "${plantName}" in a structured format with the following labels:
      Common name:
      Scientific name:
      Description of ${plantName}:
      Family:
      Flower characteristics:
      Leaf characteristics:
      Plant height:
      Blooming season:
      Sunlight requirements:
      Water needs:
      Soil type:
      Growth rate:
      Hardiness zones:
      Native region:
      Potential uses:
      Care tips:
      Interesting facts:`;

      console.log('Sending request to Gemini API with prompt:', prompt);
      const result = await model.generateContent(prompt);
      console.log('Received result from Gemini API:', result);
      
      const response = await result.response;
      console.log('Extracted response from result:', response);
      
      const text = response.text();
      console.log('Extracted text from response:', text);
      
      if (!text || text.trim() === '') {
        throw new Error('Received empty response from Gemini API');
      }
      
      return text;
    } catch (error) {
      console.error('Error in getAdditionalInfoFromGemini:', error);
      if (error instanceof Error) {
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
      return `Error getting additional information: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  };

  const handleImage = useCallback(async (file: File) => {
    if (file) {
      setIsLoading(true);
      setPlantInfo('');
      setImageUrl('');
      setConfidence(null); // Reset confidence
      try {
        setImageUrl(URL.createObjectURL(file));
        
        // Identify the plant using Plant.id
        const plantData = await identifyPlantWithPlantId(file);
        console.log('Plant.id identification:', plantData);
        
        // Set confidence for display in the card
        setConfidence(plantData.confidence);
        
        // Get additional information from Gemini
        const additionalInfo = await getAdditionalInfoFromGemini(plantData.commonName);
        console.log('Gemini additional info:', additionalInfo);
        
        if (additionalInfo.startsWith('Error getting additional information')) {
          throw new Error(additionalInfo);
        }
        
        setPlantInfo(`Plant identified as: ${plantData.commonName}
Scientific name: ${plantData.scientificName}
Confidence: ${(plantData.confidence * 100).toFixed(2)}%

Additional Information:
${additionalInfo}`);
      } catch (error) {
        console.error("Error processing plant:", error);
        setPlantInfo(`Error processing plant: ${error instanceof Error ? error.message : 'Unknown error'}`);
        setConfidence(null); // Reset confidence on error
      } finally {
        setIsLoading(false);
      }
    }
  }, [setPlantInfo, setImageUrl, setConfidence]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    handleImage(acceptedFiles[0]);
  }, [handleImage]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImage(file);
    }
  };

  const handleCameraCapture = () => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ video: true })
        .then((stream) => {
          const video = document.createElement('video');
          video.srcObject = stream;
          video.play();

          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;

          setTimeout(() => {
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
              const stream = video.srcObject as MediaStream;
              stream.getTracks().forEach(track => track.stop());
              canvas.toBlob((blob) => {
                if (blob) {
                  handleImage(new File([blob], "camera_capture.jpg", { type: "image/jpeg" }));
                }
              });
            }
          }, 200);
        })
        .catch((error) => {
          console.error("Error accessing camera:", error);
          alert("Unable to access camera. Please make sure you've granted the necessary permissions.");
        });
    } else {
      alert("Your device doesn't support camera access through the browser.");
    }
  };

  return (
    <div className="w-4/5 mx-auto">
      <div 
        className={`p-4 sm:p-0 rounded-2xl backdrop-blur-sm transition-all duration-300 ${
          isDragActive 
            ? 'bg-emerald-900/30 border-2 border-emerald-400 shadow-lg shadow-emerald-500/20' 
            : 'bg-slate-800/30 border-2 border-dashed border-emerald-600/50 hover:border-emerald-400/70'
        }`}
        {...getRootProps()}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center space-y-4 py-8 sm:py-12 ">
          <div className={`p-4 rounded-full ${isDragActive ? 'bg-emerald-500/20' : 'bg-emerald-800/20'}`}>
            <svg className="w-12 h-12 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          {isDragActive ? (
            <p className="text-emerald-300 text-lg font-medium animate-pulse">Release to unleash the magic ✨</p>
          ) : (
            <p className="text-emerald-300/90 text-center">
              <span className="font-medium">Drop your image here</span>
              <br />
              <span className="text-sm text-emerald-400/70">or click to browse</span>
            </p>
          )}
        </div>
      </div>

      <div className="mt-6 flex flex-col sm:flex-row justify-center gap-4">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="group relative px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl font-medium text-white shadow-lg shadow-emerald-900/30 hover:shadow-emerald-900/50 transition-all duration-300 hover:scale-105"
        >
          <span className="absolute inset-0 bg-gradient-to-r from-emerald-400/20 to-teal-400/20 rounded-xl blur-lg group-hover:blur-xl transition-all duration-300"></span>
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            <span>Upload Image</span>
          </div>
        </button>

        <button
          onClick={handleCameraCapture}
          className="group relative px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl font-medium text-white shadow-lg shadow-blue-900/30 hover:shadow-blue-900/50 transition-all duration-300 hover:scale-105"
        >
          <span className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-indigo-400/20 rounded-xl blur-lg group-hover:blur-xl transition-all duration-300"></span>
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>Take Photo</span>
          </div>
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />
      {isLoading && <BookLoader />}
    </div>
  );
};

export default ImageUpload;
