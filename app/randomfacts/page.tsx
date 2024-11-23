"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { fetchImageFromGoogle } from '../utils/googleImageSearch';

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GOOGLE_API_KEY as string);

interface Fact {
    id: number;
    fact: string;
    plantName: string;
    category?: string;
    source?: string;
}

export default function RandomFacts() {
    const [facts, setFacts] = useState<Fact[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [hasMore, setHasMore] = useState(true);
    const observer = useRef<IntersectionObserver | null>(null);
    const [error, setError] = useState<string | null>(null);

    const fetchWikipediaFact = async (): Promise<Fact> => {
        const response = await fetch('https://en.wikipedia.org/api/rest_v1/page/random/summary');
        const data = await response.json();
        return {
            id: 0,
            fact: `${data.title}: ${data.extract}`,
            plantName: data.thumbnail?.source || '/placeholder-image.jpg',
            category: 'Wikipedia',
            source: 'Wikipedia'
        };
    };

    const fetchFacts = useCallback(async (count: number): Promise<Fact[]> => {
        const fetchGeminiFacts = async (): Promise<Fact[]> => {
            if (!process.env.NEXT_PUBLIC_GOOGLE_API_KEY) {
                throw new Error("Google API key is not set");
            }

            const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
            try {
                const result = await model.generateContent([
                    `Generate ${count} unique plant facts. Include plant name and interesting feature. Focus on common plants. Output as JSON with 'plantName' and 'fact' keys.`
                ]);
                const response = await result.response;
                const factsData = JSON.parse(response.text());
                if (!Array.isArray(factsData)) {
                    throw new Error("Unexpected response format from AI");
                }
                return Promise.all(factsData.map(async (factData: { plantName: string; fact: string }) => {
                    const imageUrl = await fetchImageFromGoogle(factData.plantName);
                    return {
                        id: 0,
                        fact: `${factData.plantName}: ${factData.fact}`,
                        plantName: imageUrl,
                        category: 'Gemini',
                        source: 'Gemini' as const
                    };
                }));
            } catch (error) {
                console.error("Error fetching Gemini facts:", error);
                return [];
            }
        };

        const fetchWikipediaFacts = async (): Promise<Fact[]> => {
            try {
                return await Promise.all(Array(count).fill(null).map(fetchWikipediaFact));
            } catch (error) {
                console.error("Error fetching Wikipedia facts:", error);
                return [];
            }
        };

        const [geminiFacts, wikipediaFacts] = await Promise.all([
            fetchGeminiFacts(),
            fetchWikipediaFacts()
        ]);

        const allFacts = [...geminiFacts, ...wikipediaFacts];
        return allFacts.sort(() => Math.random() - 0.5).slice(0, count);
    }, []);

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

    useEffect(() => {
        fetchInitialFacts();
    }, [fetchInitialFacts]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-8">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-5xl font-bold mb-12 text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-green-300 text-center">
                    Fascinating Plant Facts
                </h1>
                
                {error && (
                    <div className="mb-6 p-4 bg-red-900/50 border-l-4 border-red-500 rounded-r-lg">
                        <p className="text-red-300">{error}</p>
                    </div>
                )}

                {isLoading && (
                    <div className="flex justify-center my-8">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
                    </div>
                )}
                
                <div className="grid gap-6">
                    {facts.map((fact, index) => (
                        <div 
                            key={fact.id} 
                            ref={index === facts.length - 1 ? lastFactElementRef : null}
                            className="bg-gradient-to-br from-slate-900 to-slate-800 p-6 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.3)] border border-emerald-500/20 hover:border-emerald-500/40 transition-all duration-300"
                        >
                            <div className="flex flex-col gap-4">
                                <div className="text-emerald-100/90 text-lg leading-relaxed">
                                    {fact.fact}
                                </div>
                                <div className="text-emerald-400/50 text-sm italic">
                                    {fact.plantName}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}