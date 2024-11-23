"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Loader from '../components/loader';
import Image from 'next/image';

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GOOGLE_API_KEY as string);

interface Fact {
    text: string;
    imageUrl: string;
    source: 'Gemini' | 'Wikipedia';
    plantName: string;
}

export default function RandomFacts() {
    const [facts, setFacts] = useState<Fact[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [hasMore, setHasMore] = useState(true);
    const observer = useRef<IntersectionObserver | null>(null);
    const [error, setError] = useState<string | null>(null);

    const fetchRandomPlantFromWikipedia = useCallback(async (): Promise<string> => {
        const plantCategories = [
            'Flowering_plants', 'Trees', 'Shrubs', 'Herbs', 'Vegetables', 'Fruits',
            'Grasses', 'Ferns', 'Mosses', 'Succulents', 'Vines', 'Aquatic_plants',
            'Conifers', 'Palms', 'Orchids', 'Cacti', 'Bamboos', 'Bromeliads',
            'Carnivorous_plants', 'Epiphytes', 'Medicinal_plants', 'Poisonous_plants',
            'Edible_plants', 'Ornamental_plants', 'Tropical_plants', 'Desert_plants',
            'Alpine_plants', 'Rainforest_plants', 'Mangroves', 'Seagrasses'
        ];
        const randomCategory = plantCategories[Math.floor(Math.random() * plantCategories.length)];
        
        const response = await fetch(`https://en.wikipedia.org/w/api.php?action=query&list=categorymembers&cmtitle=Category:${randomCategory}&cmtype=page&cmlimit=500&format=json&origin=*`);
        const data = await response.json();
        
        const plants = data.query.categorymembers
            .map((member: { title: string }) => member.title)
            .filter((title: string) => !title.includes(':') && !title.includes('List of'));
        
        if (plants.length === 0) {
            throw new Error("No suitable plants found in the selected category");
        }
        
        return plants[Math.floor(Math.random() * plants.length)];
    }, []);

    const fetchWikipediaPlantFact = useCallback(async (): Promise<Fact> => {
        let attempts = 0;
        const maxAttempts = 3;

        while (attempts < maxAttempts) {
            try {
                const randomPlant = await fetchRandomPlantFromWikipedia();
                const response = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(randomPlant)}`);
                const data = await response.json();
                
                if (data.type === 'disambiguation') {
                    throw new Error("Disambiguation page");
                }
                
                const snippet = data.extract 
                    ? (data.extract.split('. ').slice(0, 2).join('. ') + '.')
                    : 'No description available.';
                
                return {
                    text: `${data.title}: ${snippet}`,
                    imageUrl: data.thumbnail?.source || '/placeholder-image.jpg',
                    source: 'Wikipedia',
                    plantName: data.title
                };
            } catch (error) {
                console.error("Error fetching Wikipedia plant fact:", error);
                attempts++;
            }
        }
        
        throw new Error("Failed to fetch a valid Wikipedia plant fact after multiple attempts");
    }, [fetchRandomPlantFromWikipedia]);

    const fetchWikipediaImage = useCallback(async (plantName: string): Promise<string> => {
        const cleanPlantName = (name: string): string => {
            // Remove text in single quotes (cultivar names)
            name = name.replace(/'[^']*'/g, '');
            
            // Remove text in parentheses
            name = name.replace(/\s*\([^)]*\)/g, '');
            
            // Remove "spp.", "var.", "subsp.", and similar taxonomic rank indicators
            name = name.replace(/\s*(spp\.|var\.|subsp\.|f\.|cv\.).*$/i, '');
            
            // Remove any remaining special characters and extra spaces
            name = name.replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim();
            
            // If it's more than two words, keep only the first two (genus and species)
            const words = name.split(' ');
            return words.length > 2 ? words.slice(0, 2).join(' ') : name;
        };

        const tryFetchImage = async (name: string): Promise<string | null> => {
            try {
                const response = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(name)}`);
                const data = await response.json();
                return data.thumbnail?.source || null;
            } catch (error) {
                console.error(`Error fetching Wikipedia image for ${name}:`, error);
                return null;
            }
        };

        const cleanedName = cleanPlantName(plantName);
        let imageUrl = await tryFetchImage(cleanedName);

        if (!imageUrl && cleanedName.includes(' ')) {
            // If no image found and it's a binomial name, try with just the genus
            const genus = cleanedName.split(' ')[0];
            imageUrl = await tryFetchImage(genus);
        }

        if (!imageUrl) {
            // If still no image, try with the original plant name
            imageUrl = await tryFetchImage(plantName);
        }

        return imageUrl || '/placeholder-image.jpg';
    }, []);

    const fetchFacts = useCallback(async (count: number): Promise<Fact[]> => {
        const fetchGeminiFacts = async (): Promise<Fact[]> => {
            if (!process.env.NEXT_PUBLIC_GOOGLE_API_KEY) {
                throw new Error("Google API key is not set");
            }

            const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
            try {
                const result = await model.generateContent([
                    `Generate ${count * 2} unique plant facts. Each fact should be about a specific plant species (not a category or family) that hasn't been mentioned before. Include the plant's scientific name if possible. Focus on interesting features, uses, or characteristics of the plant. Output as JSON with 'plantName' and 'fact' keys.`
                ]);
                const response = await result.response;
                const factsData = JSON.parse(response.text());
                if (!Array.isArray(factsData)) {
                    throw new Error("Unexpected response format from AI");
                }
                return Promise.all(factsData.map(async (factData: { plantName: string; fact: string }) => {
                    const imageUrl = await fetchWikipediaImage(factData.plantName);
                    return {
                        text: `${factData.plantName}: ${factData.fact}`,
                        imageUrl,
                        source: 'Gemini' as const,
                        plantName: factData.plantName
                    };
                }));
            } catch (error) {
                console.error("Error fetching Gemini facts:", error);
                return [];
            }
        };

        const fetchWikipediaFacts = async (): Promise<Fact[]> => {
            try {
                return await Promise.all(Array(count).fill(null).map(fetchWikipediaPlantFact));
            } catch (error) {
                console.error("Error fetching Wikipedia plant facts:", error);
                return [];
            }
        };

        const [geminiFacts, wikipediaFacts] = await Promise.all([
            fetchGeminiFacts(),
            fetchWikipediaFacts()
        ]);

        const allFacts = [...geminiFacts, ...wikipediaFacts];
        return allFacts.sort(() => Math.random() - 0.5).slice(0, count);
    }, [fetchWikipediaPlantFact, fetchWikipediaImage]);

    const fetchMoreFacts = useCallback(async () => {
        setIsLoading(true);
        try {
            const newFacts = await fetchFacts(3);
            if (newFacts.length > 0) {
                setFacts(prevFacts => [...prevFacts, ...newFacts]);
                setHasMore(true);
            } else {
                setHasMore(false);
            }
        } catch (error) {
            console.error("Error fetching more facts:", error);
            setHasMore(false);
        } finally {
            setIsLoading(false);
        }
    }, [fetchFacts]);

    const lastFactElementRef = useCallback((node: HTMLDivElement | null) => {
        if (isLoading) return;
        if (observer.current) observer.current.disconnect();
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                fetchMoreFacts();
            }
        });
        if (node) observer.current.observe(node);
    }, [isLoading, hasMore, fetchMoreFacts]);

    const fetchInitialFacts = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const newFacts = await fetchFacts(5);
            if (newFacts.length === 0) {
                setError("Unable to fetch facts. Please try again later.");
            } else {
                setFacts(newFacts);
            }
        } catch (error: unknown) {
            console.error("Error fetching initial facts:", error);
            setError(`Failed to load facts: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setIsLoading(false);
        }
    }, [fetchFacts]);

    useEffect(() => {
        fetchInitialFacts();
    }, [fetchInitialFacts]);

    const openGoogleSearch = (plantName: string) => {
        window.open(`https://www.google.com/search?q=${encodeURIComponent(plantName)}`, '_blank');
    };

    const openWikipediaPage = (plantName: string) => {
        window.open(`https://en.wikipedia.org/wiki/${encodeURIComponent(plantName)}`, '_blank');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-4 sm:p-6 md:p-8">
            <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-8 md:mb-10 lg:mb-12 text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-green-300 text-center">
                Fascinating Plant Facts
            </h1>
            <div className="max-w-[320px] sm:max-w-xl md:max-w-2xl lg:max-w-4xl mx-auto">
                {error && (
                    <div className="bg-red-900/50 border border-red-500 text-red-200 px-3 sm:px-4 py-2 sm:py-3 rounded-lg relative mb-4 sm:mb-6 backdrop-blur-sm" role="alert">
                        <strong className="font-bold">Error: </strong>
                        <span className="block sm:inline text-sm sm:text-base">{error}</span>
                    </div>
                )}
                {facts.map((fact, index) => (
                    <div
                        key={index}
                        ref={index === facts.length - 1 ? lastFactElementRef : null}
                        className="bg-gradient-to-br from-slate-800 to-slate-900 p-4 sm:p-6 md:p-8 rounded-2xl shadow-[0_0_30px_rgba(0,0,0,0.3)] mb-4 sm:mb-6 md:mb-8 border border-emerald-500/20 hover:border-emerald-500/40 transition-all duration-300"
                    >
                        <div className="relative w-full h-32 sm:h-48 md:h-64 lg:h-80 mb-4 sm:mb-6 rounded-xl overflow-hidden group">
                            <Image 
                                src={fact.imageUrl} 
                                alt="Fact Image" 
                                layout="fill"
                                objectFit="cover"
                                className="group-hover:scale-105 transition-transform duration-500"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent"></div>
                        </div>
                        <p className="text-base sm:text-lg md:text-xl text-emerald-100/90 mb-4 sm:mb-6 leading-relaxed">{fact.text}</p>
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0">
                            <div className="flex items-center space-x-2">
                                <span className="text-emerald-400 text-sm sm:text-base">Source:</span>
                                <span className="text-emerald-100/70 text-sm sm:text-base">{fact.source}</span>
                            </div>
                            <div className="flex flex-wrap gap-2 sm:gap-3">
                                <button
                                    onClick={() => openGoogleSearch(fact.plantName)}
                                    className="bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white font-semibold py-1.5 sm:py-2 px-4 sm:px-6 rounded-lg transition-all duration-300 shadow-lg hover:shadow-emerald-500/25 flex items-center space-x-1.5 sm:space-x-2 text-sm sm:text-base"
                                >
                                    <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                    <span>Google Search</span>
                                </button>
                                <button
                                    onClick={() => openWikipediaPage(fact.plantName)}
                                    className="bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white font-semibold py-1.5 sm:py-2 px-4 sm:px-6 rounded-lg transition-all duration-300 shadow-lg hover:shadow-slate-500/25 flex items-center space-x-1.5 sm:space-x-2 text-sm sm:text-base"
                                >
                                    <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                    </svg>
                                    <span>Wikipedia</span>
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex justify-center py-4 sm:py-6 md:py-8">
                        <Loader />
                    </div>
                )}
                {!isLoading && facts.length === 0 && !error && (
                    <p className="text-center text-emerald-100/70 text-sm sm:text-base md:text-lg">No facts available. Try refreshing the page.</p>
                )}
            </div>
        </div>
    );
}