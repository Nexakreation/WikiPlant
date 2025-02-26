"use client";

import { useState, useRef } from 'react';
import ImageUpload from './components/ImageUpload';
import PlantInfo from './components/PlantInfo';
import SearchBar from './components/SearchBar';
import ExtendedMainPage from './components/extended-mainpage'
import BookLoader from './components/BookLoader';
import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import Image from 'next/image';

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GOOGLE_API_KEY as string);

interface SpeciesData {
  commonName: string;
  scientificName: string;
  description: string;
  imageUrl: string;
}

export default function Home() {
  const [plantInfo, setPlantInfo] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [multiSpeciesData, setMultiSpeciesData] = useState<SpeciesData[] | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<number | null>(null);

  // Create refs for the results and loader sections
  const resultsRef = useRef<HTMLDivElement | null>(null);
  const loaderRef = useRef<HTMLDivElement | null>(null);

  const handleSearch = async () => {
    setIsLoading(true);
    setError(null);
    setPlantInfo(null);
    setImageUrl(null);
    setMultiSpeciesData(null);

    try {
      // First, ask Gemini AI if the plant has multiple species
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
      const checkSpeciesPrompt = `Does the plant "${searchTerm}" have multiple species? If yes, list all species with their common names, scientific names, and a brief description in a structured format
          Common name:
          Scientific name (by which they are available on wikipedia):
          Description:
          . If no, just say "No multiple species".`;
      
      const speciesResult = await model.generateContent(checkSpeciesPrompt);
      const speciesResponse = speciesResult.response.text();

      if (speciesResponse.toLowerCase().includes("no multiple species")) {
        // For single species, use the retry logic
        const plantInfo = await retryFetchPlantInfo(searchTerm, model);
        if (plantInfo) {
          setPlantInfo(plantInfo);
          const parsedInfo = parsePlantInfo(plantInfo);
          
          if (parsedInfo['Scientific name']) {
            const imageUrl = await fetchImageFromWikipedia(parsedInfo['Scientific name']);
            setImageUrl(imageUrl || "https://example.com/default-plant-image.jpg");
          }
        } else {
          setError(`Unable to fetch plant information. Please try again later or search with the scientific name.`);
        }
      } else {
        try {
          console.log("Raw AI response:", speciesResponse);
          const speciesData = await parseAIResponse(speciesResponse);
          console.log("Parsed species data:", speciesData);
          setMultiSpeciesData(speciesData);
        } catch (parseError) {
          console.error('Error parsing AI response:', parseError);
          setError(`Error parsing AI response: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
        }
      }
    } catch (error) {
      setError(`An error occurred while searching for the plant: ${error instanceof Error ? error.message : String(error)}`);
      console.error('Search error:', error);
    } finally {
      setIsLoading(false);
      // Scroll to the results section after search is complete
      if (resultsRef.current) {
        resultsRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const handleSpeciesSelection = async (species: SpeciesData) => {
    setIsLoading(true);
    setError(null);
    setPlantInfo(null);
    setImageUrl(null);
    setMultiSpeciesData(null);

    // Scroll to the loader section when starting to fetch details
    if (loaderRef.current) {
      loaderRef.current.scrollIntoView({ behavior: 'smooth' });
    }

    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
      const detailPrompt = `Provide the following additional information for the plant "${species.commonName}" (${species.scientificName}) in a structured format with labels:
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

      const result = await model.generateContent(detailPrompt);
      const additionalInfo = result.response.text();

      // Combine the existing information with the additional details
      const combinedInfo = `Common name: ${species.commonName}
Scientific name: ${species.scientificName}
Description: ${species.description}
${additionalInfo}`;

      setPlantInfo(combinedInfo);
      const parsedInfo = parsePlantInfo(combinedInfo);

      // Use the existing image URL if available, otherwise fetch a new one
      if (species.imageUrl && !species.imageUrl.includes('via.placeholder.com')) {
        setImageUrl(species.imageUrl);
      } else if (parsedInfo['Scientific name']) {
        const newImageUrl = await fetchImageFromWikipedia(parsedInfo['Scientific name']);
        setImageUrl(newImageUrl);
      }
    } catch (error) {
      setError('An error occurred while fetching plant details.');
      console.error('Species selection error:', error);
    } finally {
      setIsLoading(false);
      // Scroll to the results section after details are fetched
      if (resultsRef.current) {
        resultsRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const retryFetchPlantInfo = async (searchTerm: string, model: GenerativeModel, maxRetries = 5): Promise<string | null> => {
    for (let i = 0; i < maxRetries; i++) {
      const detailPrompt = `Identify this plant "${searchTerm}" and provide the following information in a structured format with labels:
        Common name:
        Scientific name:
        Family:
        Description:
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

      const result = await model.generateContent(detailPrompt);
      const plantInfo = result.response.text();
      
      const parsedInfo = parsePlantInfo(plantInfo);
      if (parsedInfo['Common name'] && parsedInfo['Scientific name'] && parsedInfo['Description']) {
        return plantInfo;
      }
      
      // Wait for a short time before retrying
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    return null;
  };

  const fetchImageFromWikipedia = async (query: string): Promise<string> => {
    try {
      let url = `https://en.wikipedia.org/w/api.php?action=parse&format=json&page=${encodeURIComponent(query)}&prop=text&redirects&origin=*`;
      
      // If the query is already a Wikipedia URL, extract the page name
      if (query.startsWith('https://en.wikipedia.org/wiki/')) {
        const pageName = query.split('/').pop();
        url = `https://en.wikipedia.org/w/api.php?action=parse&format=json&page=${pageName}&prop=text&redirects&origin=*`;
      }

      const response = await fetch(url);
      const data = await response.json();
      
      if (data.parse && data.parse.text) {
        const htmlContent = data.parse.text['*'];
        
        // Extract all image URLs
        const imgRegex = /<img[^>]+src="((?:https?:)?\/\/upload\.wikimedia\.org\/wikipedia\/commons\/[^"]+)"[^>]*>/gi;
        const matches = [...htmlContent.matchAll(imgRegex)];
        
        // Filter and find the first suitable image
        for (const match of matches) {
          let imgUrl = match[1];
          if (!imgUrl.startsWith('http')) {
            imgUrl = `https:${imgUrl}`;
          }
          if (isValidPlantImage(imgUrl)) {
            return imgUrl;
          }
        }
      }
      
      // If no suitable image found, return the Wikipedia page URL
      return query.startsWith('https://en.wikipedia.org/wiki/') ? query : `https://en.wikipedia.org/wiki/${encodeURIComponent(query)}`;
    } catch (error) {
      console.error("Error fetching Wikipedia image:", error);
      // In case of error, return the Wikipedia search URL
      return `https://en.wikipedia.org/w/index.php?search=${encodeURIComponent(query)}`;
    }
  };

  const isValidPlantImage = (url: string): boolean => {
    // Exclude small images, icons, and SVGs
    if (url.includes('.svg') || url.includes('icon') || url.includes('Icon')) {
      return false;
    }
    
    // Exclude images with dimensions in the URL that are too small
    const dimensions = url.match(/\/(\d+)px-/);
    if (dimensions && parseInt(dimensions[1]) < 100) {
      return false;
    }
    
    return true;
  };

  const parseAIResponse = async (response: string): Promise<SpeciesData[]> => {
    const species = response.split('\n\n').filter(s => s.trim() !== '');
    const parsedSpecies = await Promise.all(species.map(async s => {
      const lines = s.split('\n');
      const commonName = lines.find(l => l.toLowerCase().includes('common name'))?.split(':')[1]?.replace(/\*+/g, '').trim();
      const scientificName = lines.find(l => l.toLowerCase().includes('scientific name'))?.split(':')[1]?.replace(/\*+/g, '').trim();
      const description = lines.find(l => l.toLowerCase().includes('description'))?.split(':')[1]?.replace(/\*+/g, '').trim();
      if (commonName && scientificName && description) {
        const imageUrl = await fetchSpeciesImage(scientificName, commonName);
        return {
          commonName,
          scientificName,
          description,
          imageUrl
        };
      }
      return null;
    }));

    return parsedSpecies.filter((species): species is NonNullable<typeof species> => species !== null);
  };

  const fetchSpeciesImage = async (scientificName: string, commonName: string): Promise<string> => {
    try {
      // First, try to fetch image using common name
      let imageUrl = await fetchImageFromWikipedia(commonName);
      
      // If no specific image found with common name, try scientific name
      if (imageUrl.includes('wikipedia.org/wiki/') || imageUrl.includes('wikipedia.org/w/index.php?search=')) {
        const scientificNameUrl = await fetchImageFromWikipedia(scientificName);
        if (!scientificNameUrl.includes('wikipedia.org/w/index.php?search=')) {
          imageUrl = scientificNameUrl;
        }
      }
      
      // If still no image found, try the Wikipedia page for the common name
      if (imageUrl.includes('wikipedia.org/wiki/') || imageUrl.includes('wikipedia.org/w/index.php?search=')) {
        const encodedCommonName = encodeURIComponent(commonName.replace(/ /g, '_'));
        const commonNameUrl = await fetchImageFromWikipedia(`https://en.wikipedia.org/wiki/${encodedCommonName}`);
        if (!commonNameUrl.includes('wikipedia.org/w/index.php?search=')) {
          imageUrl = commonNameUrl;
        }
      }
      
      // If still no image found, try the Wikipedia page for the scientific name
      if (imageUrl.includes('wikipedia.org/wiki/') || imageUrl.includes('wikipedia.org/w/index.php?search=')) {
        const encodedScientificName = encodeURIComponent(scientificName.replace(/ /g, '_'));
        const scientificNameUrl = await fetchImageFromWikipedia(`https://en.wikipedia.org/wiki/${encodedScientificName}`);
        if (!scientificNameUrl.includes('wikipedia.org/w/index.php?search=')) {
          imageUrl = scientificNameUrl;
        }
      }
      
      // If we still have a Wikipedia page URL, try to extract an image from it
      if (imageUrl.includes('wikipedia.org/wiki/')) {
        const extractedImage = await fetchImageFromWikipedia(imageUrl);
        if (!extractedImage.includes('wikipedia.org/wiki/') && !extractedImage.includes('wikipedia.org/w/index.php?search=')) {
          imageUrl = extractedImage;
        }
      }
      
      // If we still don't have an image, use a local placeholder
      if (imageUrl.includes('wikipedia.org/wiki/') || imageUrl.includes('wikipedia.org/w/index.php?search=')) {
        imageUrl = '/placeholder-plant.jpg'; // Make sure to add this image to your public folder
      }
      
      return imageUrl;
    } catch (error) {
      console.error(`Error fetching image for ${commonName} (${scientificName}):`, error);
      return '/placeholder-plant.jpg'; // Use local placeholder image
    }
  };

  const parsePlantInfo = (info: string): Record<string, string> => {
    const lines = info.split('\n');
    const result: Record<string, string> = {};
    let currentKey = '';

    for (const line of lines) {
      const [key, ...valueParts] = line.split(':');
      if (valueParts.length > 0) {
        currentKey = key.trim();
        result[currentKey] = valueParts.join(':').replace(/\*+/g, '').trim();
      } else if (currentKey) {
        result[currentKey] += ' ' + line.replace(/\*+/g, '').trim();
      }
    }

    return result;
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-900 via-slate-900 to-emerald-900 overflow-x-hidden">
      <div className="flex flex-col items-center justify-between p-4 sm:p-6 md:p-8 max-w-7xl mx-auto w-full">
        <div className="text-center space-y-4 sm:space-y-6 mb-12 sm:mb-16 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-emerald-500/10 blur-3xl -z-10 animate-pulse"></div>
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold">
            <span className="bg-gradient-to-r from-emerald-300 via-teal-200 to-green-300 bg-clip-text text-transparent animate-gradient">Plant</span>
            <span className="bg-gradient-to-l from-emerald-300 via-teal-200 to-green-300 bg-clip-text text-transparent animate-gradient"> Identifier</span>
          </h1>
          <p className="text-sm sm:text-lg md:text-xl font-medium bg-gradient-to-r from-emerald-200/90 to-teal-200/90 bg-clip-text text-transparent max-w-3xl mx-auto leading-relaxed px-4 sm:px-0">
            <span className="animate-float-slow inline-block">🌿</span> Unlock the secrets of nature with AI-powered plant recognition. Upload an image or search by name to discover detailed information about any plant species in our vast botanical database. Let&apos;s explore the wonderful world of flora together! <span className="animate-float inline-block">🌱</span>
          </p>
          <div className="absolute -inset-x-40 top-0 h-[500px] bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-green-500/20 blur-3xl opacity-20 -z-20"></div>
        </div>

        <SearchBar onSearch={handleSearch} searchTerm={searchTerm} setSearchTerm={setSearchTerm} />

        {!isLoading && (
          <div className="w-full max-w-2xl mx-auto px-4 sm:px-0 backdrop-blur-sm bg-slate-800/50 p-6 rounded-2xl shadow-xl border border-emerald-800/30 hover:border-emerald-700/50 transition-all duration-300">
            <ImageUpload setPlantInfo={setPlantInfo} setImageUrl={setImageUrl} setConfidence={setConfidence} />
          </div>
        )}

        {isLoading && <div ref={loaderRef}><BookLoader /></div>}

        <div ref={resultsRef}>
          {error && (
            <div className="mt-6 px-4 py-3 bg-red-900/50 border-l-4 border-red-500 rounded-r-lg">
              <p className="text-red-300 font-medium">{error}</p>
            </div>
          )}

          {imageUrl && (
            <div className="mt-8 mb-8">
              <div className="relative w-32 h-32 sm:w-48 sm:h-48 group">
                <Image 
                  src={imageUrl} 
                  alt="Plant" 
                  layout="fill"
                  objectFit="cover"
                  className="rounded-2xl shadow-2xl transform transition-transform duration-300 group-hover:scale-105"
                />
                {confidence !== null && (
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent text-emerald-200 text-center py-2 px-3 rounded-b-2xl backdrop-blur-sm">
                    <span className="font-medium">Confidence: </span>
                    <span className="font-bold">{(confidence * 100).toFixed(2)}%</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {plantInfo && <PlantInfo info={plantInfo} />}

          {multiSpeciesData && multiSpeciesData.length > 0 && (
            <div className="mt-12 w-full max-w-4xl">
              <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-emerald-300">Discovered Species</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                {multiSpeciesData.map((species, index) => (
                  <div key={index} className="flex flex-col sm:flex-row gap-4 p-4 sm:p-6">
                    <div className="w-full sm:w-1/3">
                      <div className="relative w-full aspect-square">
                        <Image 
                          src={species.imageUrl} 
                          alt={species.commonName} 
                          layout="fill"
                          objectFit="cover"
                          className="rounded-xl shadow-lg"
                        />
                      </div>
                    </div>
                    <div className="w-full sm:w-2/3">
                      <h3 className="text-xl sm:text-2xl font-bold text-emerald-300">{species.commonName}</h3>
                      <p className="text-emerald-400 italic">{species.scientificName}</p>
                      <p className="text-gray-300 leading-relaxed">{species.description}</p>
                      <button
                        onClick={() => handleSpeciesSelection(species)}
                        className="mt-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-6 py-2.5 rounded-lg font-medium hover:from-emerald-700 hover:to-teal-700 transform hover:scale-105 transition-all duration-300 shadow-md hover:shadow-lg flex items-center gap-2 group"
                      >
                        Explore Details
                        <svg className="w-5 h-5 transform transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <ExtendedMainPage />
      </div>
    </main>
  );
}
