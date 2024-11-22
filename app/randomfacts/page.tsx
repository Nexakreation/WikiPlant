"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { fetchImageFromGoogle } from '../utils/googleImageSearch';
import Loader from '../components/loader';
import Image from 'next/image';

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GOOGLE_API_KEY as string);

interface Fact {
    text: string;
    imageUrl: string;
    source: 'Gemini' | 'Wikipedia';
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
            text: `${data.title}: ${data.extract}`,
            imageUrl: data.thumbnail?.source || '/placeholder-image.jpg',
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
                        text: `${factData.plantName}: ${factData.fact}`,
                        imageUrl,
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
        <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-4 sm:p-6 md:p-8">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-8 sm:mb-10 md:mb-12 text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-green-300 text-center">
                Fascinating Plant Facts
            </h1>
            <div className="max-w-xl sm:max-w-2xl md:max-w-3xl lg:max-w-4xl mx-auto">
                {error && (
                    <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded-lg relative mb-6 backdrop-blur-sm" role="alert">
                        <strong className="font-bold">Error: </strong>
                        <span className="block sm:inline">{error}</span>
                    </div>
                )}
                {facts.map((fact, index) => (
                    <div
                        key={index}
                        ref={index === facts.length - 1 ? lastFactElementRef : null}
                        className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 sm:p-8 rounded-2xl shadow-[0_0_30px_rgba(0,0,0,0.3)] mb-6 sm:mb-8 border border-emerald-500/20 hover:border-emerald-500/40 transition-all duration-300"
                    >
                        <div className="relative w-full h-48 sm:h-64 md:h-80 mb-6 rounded-xl overflow-hidden group">
                            <Image 
                                src={fact.imageUrl} 
                                alt="Fact Image" 
                                layout="fill"
                                objectFit="cover"
                                className="group-hover:scale-105 transition-transform duration-500"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent"></div>
                        </div>
                        <p className="text-lg sm:text-xl text-emerald-100/90 mb-4 leading-relaxed">{fact.text}</p>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                                <span className="text-emerald-400">Source:</span>
                                <span className="text-emerald-100/70">{fact.source}</span>
                            </div>
                            <div className="text-emerald-400/50 text-sm italic">
                                {fact.plantName}
                            </div>
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex justify-center p-8">
                        <Loader />
                    </div>
                )}
                {!isLoading && facts.length === 0 && !error && (
                    <div className="text-center text-emerald-100/70 backdrop-blur-sm bg-slate-800/50 p-6 rounded-xl">
                        No facts available. Try refreshing the page.
                    </div>
                )}
            </div>
        </div>
    );
}