import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect, useMemo, useCallback } from 'react';

interface PlantInfoProps {
  info: string;
}

interface PlantData {
  [key: string]: string;
}

export default function PlantInfo({ info }: PlantInfoProps) {
    const [imageUrl, setImageUrl] = useState<string | null>(null);

    // Function to clean up the text
    const cleanText = (text: string): string => {
        return text.replace(/\*\*/g, '').replace(/\*/g, '').trim();
    };

    // Use useMemo to memoize the plantData object
    const plantData = useMemo(() => {
        const lines = info.split('\n').filter(line => line.trim() !== '');
        const data: PlantData = {};

        lines.forEach(line => {
            const [key, ...valueParts] = line.split(':');
            const cleanKey = cleanText(key);
            const cleanValue = cleanText(valueParts.join(':'));
            if (cleanKey && cleanValue) {
                data[cleanKey] = cleanValue;
            }
        });

        return data;
    }, [info]);

    // Use useCallback to memoize the fetchImageFromWikipedia function
    const fetchImageFromWikipedia = useCallback(async (query: string): Promise<string> => {
        try {
            const searchVariations = [
                query,
                query.split("'")[0].trim(),
                query.split(/[([{/'"]/, 1)[0].trim()
            ];

            for (const searchQuery of searchVariations) {
                let url = `https://en.wikipedia.org/w/api.php?action=parse&format=json&page=${encodeURIComponent(searchQuery)}&prop=text&redirects&origin=*`;
                
                if (searchQuery.startsWith('https://en.wikipedia.org/wiki/')) {
                    const pageName = searchQuery.split('/').pop();
                    url = `https://en.wikipedia.org/w/api.php?action=parse&format=json&page=${pageName}&prop=text&redirects&origin=*`;
                }

                const response = await fetch(url);
                const data = await response.json();
                
                if (data.parse && data.parse.text) {
                    const htmlContent = data.parse.text['*'];
                    const imgRegex = /<img[^>]+src="((?:https?:)?\/\/upload\.wikimedia\.org\/wikipedia\/commons\/[^"]+)"[^>]*>/gi;
                    const matches = [...htmlContent.matchAll(imgRegex)];
                    
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
                
                // If no valid image found, continue to the next search variation
            }
            
            // If no image found after trying all variations, return a search URL
            return `https://en.wikipedia.org/w/index.php?search=${encodeURIComponent(query)}`;
        } catch (error) {
            console.error("Error fetching Wikipedia image:", error);
            return `https://en.wikipedia.org/w/index.php?search=${encodeURIComponent(query)}`;
        }
    }, []);

    const isValidPlantImage = (url: string): boolean => {
        if (url.includes('.svg') || url.includes('icon') || url.includes('Icon')) {
            return false;
        }
        
        const dimensions = url.match(/\/(\d+)px-/);
        if (dimensions && parseInt(dimensions[1]) < 100) {
            return false;
        }
        
        return true;
    };

    useEffect(() => {
        const fetchImage = async () => {
            if (plantData && plantData['Scientific name']) {
                const imageUrl = await fetchImageFromWikipedia(plantData['Scientific name']);
                setImageUrl(imageUrl);
            }
        };

        fetchImage();
    }, [plantData, fetchImageFromWikipedia]);

    const handleDetailsClick = () => {
        // Store the plant data and image URL in sessionStorage
        sessionStorage.setItem('currentPlantData', JSON.stringify({
            ...plantData,
            imageUrl: imageUrl
        }));
    };

    return (
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-4 sm:p-6 md:p-8 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.3)] w-full max-w-2xl mx-auto">
            {imageUrl && (
                <div className="group relative w-full h-56 sm:h-64 md:h-72 mb-6 overflow-hidden rounded-xl items-center justify-center">
                    <div className="absolute inset-0 bg-gradient-to-t from-emerald-900/80 to-transparent z-10"></div>
                    <Image 
                        src={imageUrl} 
                        alt={plantData['Common name'] || 'Plant'} 
                        layout="fill"
                        objectFit="cover"
                        className="transform group-hover:scale-110 transition-transform duration-700 rounded-xl items-center justify-center"
                    />
                    <div className="absolute bottom-0 left-0 right-0 p-4 z-20 bg-gradient-to-t from-black/80 to-transparent">
                        <div className="transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-green-300">{plantData['Common name'] || 'Unknown Plant'}</h2>
                            <h3 className="text-lg sm:text-xl font-medium text-emerald-400/80 italic">{plantData['Scientific name'] || 'Species unknown'}</h3>
                        </div>
                    </div>
                </div>
            )}
            {!imageUrl && (
                <div className="mb-6">
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-green-300 mb-2">{plantData['Common name'] || 'Unknown Plant'}</h2>
                    <h3 className="text-lg sm:text-xl font-medium text-emerald-400/80 italic">{plantData['Scientific name'] || 'Species unknown'}</h3>
                </div>
            )}
            <div className="backdrop-blur-sm bg-slate-800/50 rounded-xl p-4 mb-6">
                <p className="text-sm sm:text-base text-emerald-100/90 leading-relaxed">{plantData['Description'] || 'No description available.'}</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
                <a 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="group relative px-6 py-3 bg-gradient-to-r from-red-600 to-rose-600 rounded-xl font-medium text-white shadow-lg shadow-red-900/30 hover:shadow-red-900/50 transition-all duration-300 hover:scale-105 text-center"
                    href={`https://google.com/search?q=${encodeURIComponent(plantData['Scientific name'] || '')}`}
                >
                    <span className="absolute inset-0 bg-gradient-to-r from-red-400/20 to-rose-400/20 rounded-xl blur-lg group-hover:blur-xl transition-all duration-300"></span>
                    <div className="relative flex items-center justify-center gap-2">
                        <i className="fas fa-search"></i>
                        <span>Search on Google</span>
                    </div>
                </a>
                <Link 
                    href="/plant-details" 
                    onClick={handleDetailsClick} 
                    className="group relative px-6 py-3 bg-gradient-to-r from-emerald-600 to-green-600 rounded-xl font-medium text-white shadow-lg shadow-emerald-900/30 hover:shadow-emerald-900/50 transition-all duration-300 hover:scale-105 text-center"
                >
                    <span className="absolute inset-0 bg-gradient-to-r from-emerald-400/20 to-green-400/20 rounded-xl blur-lg group-hover:blur-xl transition-all duration-300"></span>
                    <div className="relative flex items-center justify-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>View Details</span>
                    </div>
                </Link>
            </div>
        </div>
    );
}