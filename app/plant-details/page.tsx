'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';

interface PlantData {
  [key: string]: string;
}

export default function PlantDetails() {
    const [plantData, setPlantData] = useState<PlantData | null>(null);
    const [wikipediaExtract, setWikipediaExtract] = useState<string>('');
    const [wikipediaImageUrl, setWikipediaImageUrl] = useState<string>('');
    const [additionalImages, setAdditionalImages] = useState<string[]>([]);
    const [imageError, setImageError] = useState<boolean>(false);

    const fetchWikipediaInfo = useCallback(async (scientificName: string, commonName: string) => {
        try {
            const cleanedScientificName = cleanScientificName(scientificName);
            const response = await fetch(`https://en.wikipedia.org/w/api.php?action=parse&format=json&page=${encodeURIComponent(cleanedScientificName)}&prop=text&origin=*`);
            const data = await response.json();
            
            if (data.parse && data.parse.text) {
                const htmlContent = data.parse.text['*'];
                
                // Extract main image URL
                const imgRegex = new RegExp(`<img[^>]+src="(//upload\\.wikimedia\\.org/wikipedia/commons/[^"]+(?:${cleanedScientificName.replace(/\s+/g, '_')}|${commonName.replace(/\s+/g, '_')}).[^"]+)"`, 'i');
                const match = htmlContent.match(imgRegex);
                if (match && match[1] && !match[1].includes('OOjs_UI_icon')) {
                    setWikipediaImageUrl(`https:${match[1]}`);
                }

                // Extract additional images
                const additionalImgRegex = /<img[^>]+src="(\/\/upload\.wikimedia\.org\/wikipedia\/commons\/[^"]+)"[^>]*>/g;
                const additionalMatches = [...htmlContent.matchAll(additionalImgRegex)];
                const uniqueAdditionalImages = Array.from(new Set(additionalMatches.map(m => `https:${m[1]}`)))
                    .filter(url => !url.includes('OOjs_UI_icon') && !url.includes('edit-ltr.svg'));
                setAdditionalImages(uniqueAdditionalImages.slice(0, 10));

                // Extract paragraphs
                const parser = new DOMParser();
                const doc = parser.parseFromString(htmlContent, 'text/html');
                const paragraphs = Array.from(doc.querySelectorAll('p')).map(p => p.textContent);
                const selectedParagraphs = paragraphs.filter((p): p is string => p !== null && p.trim() !== '').slice(0, 10);
                
                const cleanedParagraphs = selectedParagraphs.map(p => 
                    p.replace(/\.mw-parser-output [^{]+\{[^}]+\}/g, '')
                     .replace(/\.sr-only[^{]+\{[^}]+\}/g, '')
                     .trim()
                );
                
                setWikipediaExtract(cleanedParagraphs.join('\n\n'));
            }
        } catch (error) {
            console.error('Error fetching Wikipedia information:', error);
        }
    }, []);

    useEffect(() => {
        const storedData = sessionStorage.getItem('currentPlantData');
        if (storedData) {
            const parsedData = JSON.parse(storedData);
            setPlantData(parsedData);
            if (parsedData['Scientific name']) {
                const cleanedScientificName = cleanScientificName(parsedData['Scientific name']);
                fetchWikipediaInfo(cleanedScientificName, parsedData['Common name']);
            }
        }
    }, [fetchWikipediaInfo]);

    const cleanScientificName = (name: string): string => {
        // Remove italics markers
        name = name.replace(/[_*]/g, '');
        
        // Remove text in single quotes (cultivar names)
        name = name.replace(/'[^']*'/g, '');
        
        // Remove text in parentheses
        name = name.replace(/\s*\([^)]*\)/g, '');
        
        // Remove "spp.", "var.", "subsp.", and similar taxonomic rank indicators
        name = name.replace(/\s*(spp\.|var\.|subsp\.|f\.|cv\.).*$/i, '');
        
        // Remove any remaining special characters and extra spaces
        name = name.replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim();
        
        // If it's a genus, just return the genus name
        if (name.split(' ').length === 1) {
            return name;
        }
        
        // Return only the genus and species (first two words)
        return name.split(' ').slice(0, 2).join(' ');
    };

    if (!plantData) {
        return <div>No plant data available.</div>;
    }

    const handleImageError = () => {
        setImageError(true);
    };

    const imageUrl = wikipediaImageUrl || plantData.imageUrl || '/placeholder-plant-image.jpg';

    // Add this function to get a subset of plant info
    const getPlantInfoSubset = (index: number): JSX.Element => {
        if (!plantData) return <></>;
        const keys = Object.keys(plantData);
        const startIndex = (index * 3) % keys.length;
        const infoSubset = keys.slice(startIndex, startIndex + 3);
        
        return (
            <>
                {infoSubset.map(key => (
                    key !== 'Common name' && key !== 'Scientific name' && key !== 'Description' && key !== 'imageUrl' && (
                        <p key={key} className="text-sm text-gray-600">
                            <span className="font-semibold">{key}:</span> {plantData[key]}
                        </p>
                    )
                ))}
            </>
        );
    };

    const ContentBlock = ({ title, content, image, index }: { title: string, content: string, image?: string, index: number }) => (
        <div className="mb-4 transform hover:scale-[1.02] transition-all duration-300">
            {title && (
                <div className="relative group mb-3">
                    <div className="absolute -inset-1 bg-gradient-to-r from-emerald-600 to-green-600 rounded-lg blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
                    <h3 className="relative text-xl sm:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-green-300">{title}</h3>
                </div>
            )}
            <div className="bg-slate-800/40 backdrop-blur-sm rounded-xl p-4 shadow-[0_0_15px_rgba(16,185,129,0.1)] border border-emerald-500/20 hover:border-emerald-500/40 transition-colors duration-300">
                <div className="text-base sm:text-lg md:text-xl whitespace-pre-wrap text-emerald-100/90 leading-relaxed mb-3">{content}</div>
                {image && (
                    <div className="lg:hidden space-y-3">
                        <div className="relative group overflow-hidden rounded-lg">
                            <Image
                                src={image}
                                alt={`Additional plant image ${index + 1}`}
                                width={400}
                                height={300}
                                objectFit="cover"
                                className="w-full h-auto transform group-hover:scale-110 transition-transform duration-700 rounded-lg shadow-[0_0_20px_rgba(0,0,0,0.3)]"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent"></div>
                        </div>
                        <div className="bg-slate-800/60 backdrop-blur-sm rounded-lg p-3 border border-emerald-500/10">
                            {getPlantInfoSubset(index)}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 px-4 py-6 overflow-x-hidden">
            <div className="flex flex-col lg:flex-row gap-6 max-w-8xl mx-auto">
                <div className='w-full lg:w-1/5 order-2 lg:order-1 hidden lg:block'>
                    <h3 className="text-xl font-semibold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-green-300">Gallery</h3>
                    <div className="grid grid-cols-1 gap-3">
                        {additionalImages.slice(0, 5).map((img, index) => (
                            <div key={index} className="group relative mb-3 transform hover:scale-105 transition-all duration-300">
                                <div className="absolute -inset-1 bg-gradient-to-r from-emerald-600 to-green-600 rounded-lg blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
                                <div className="relative">
                                    <div className="relative w-[200px] h-[200px]">
                                        <Image
                                            src={img}
                                            alt={`Additional plant image ${index + 1}`}
                                            fill
                                            className="rounded-lg shadow-xl object-cover ring-1 ring-emerald-500/20"
                                        />
                                    </div>
                                    <div className="mt-2 p-2 bg-slate-800/80 backdrop-blur-sm rounded-lg">
                                        {getPlantInfoSubset(index)}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className='w-full lg:w-3/5 order-1 lg:order-2'>
                    <div className="relative w-full h-48 sm:h-64 md:h-80 lg:h-96 mb-4 group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-emerald-600 to-green-600 rounded-lg blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
                        <div className="relative h-full">
                            {!imageError ? (
                                <Image
                                    src={imageUrl}
                                    alt={plantData['Common name']}
                                    fill
                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                    priority
                                    style={{objectFit: 'cover'}}
                                    className="rounded-lg shadow-xl group-hover:scale-105 transition-transform duration-500"
                                    onError={handleImageError}
                                />
                            ) : (
                                <div className="w-full h-full bg-slate-800/80 backdrop-blur-sm flex flex-col items-center justify-center rounded-lg shadow-xl">
                                    <p className="text-emerald-400 mb-2">Image not available</p>
                                    <p className="text-xs text-emerald-200/50 break-all px-4">{imageUrl}</p>
                                </div>
                            )}
                        </div>
                    </div>
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-green-300">{plantData['Common name']}</h1>
                    <h2 className="text-2xl sm:text-3xl font-semibold mb-4 text-emerald-400/80 italic">{plantData['Scientific name']}</h2>
                    
                    <div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-xl mb-6 shadow-lg ring-1 ring-emerald-500/20">
                        <ContentBlock title="Description" content={plantData['Description']} index={-1} />
                    </div>
                    
                    <p className="mb-4 mt-2 text-emerald-400/30 text-sm">
                        <span className="font-semibold">CC BY-SA 3.0 : </span> 
                        <a href={`https://en.wikipedia.org/wiki/${encodeURIComponent(cleanScientificName(plantData['Scientific name']))}`} 
                           target="_blank" 
                           className="hover:text-emerald-300 transition-colors duration-200">
                            https://en.wikipedia.org/wiki/{cleanScientificName(plantData['Scientific name'])}
                        </a>
                    </p>

                    {wikipediaExtract && (
                        <div className="space-y-6">
                            {wikipediaExtract.split('\n\n').map((paragraph, index) => (
                                <div key={index} className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-xl shadow-lg ring-1 ring-emerald-500/20">
                                    <ContentBlock 
                                        title={index === 0 ? "Information" : ""}
                                        content={paragraph}
                                        image={additionalImages[index]}
                                        index={index}
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                    
                    <div className="mt-8 bg-slate-800/50 backdrop-blur-sm p-6 rounded-xl shadow-lg ring-1 ring-emerald-500/20">
                        <h3 className="text-2xl font-semibold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-green-300">Additional Details</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                                <tbody>
                                    {Object.entries(plantData).map(([key, value]) => (
                                        key !== 'Common name' && key !== 'Scientific name' && key !== 'Description' && key !== 'imageUrl' && (
                                            <tr key={key} className="border-b border-emerald-500/10 hover:bg-slate-700/30 transition-colors duration-200">
                                                <td className="py-2 px-3 font-semibold text-emerald-400">{key}</td>
                                                <td className="py-2 px-3 text-emerald-100/80">{value}</td>
                                            </tr>
                                        )
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
                <div className='w-full lg:w-1/5 order-3 hidden lg:block'>
                    <h3 className="text-xl font-semibold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-green-300">More Views</h3>
                    <div className="grid grid-cols-1 gap-3">
                        {additionalImages.slice(5, 10).map((img, index) => (
                            <div key={index} className="group relative mb-3 transform hover:scale-105 transition-all duration-300">
                                <div className="absolute -inset-1 bg-gradient-to-r from-emerald-600 to-green-600 rounded-lg blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
                                <div className="relative">
                                    <Image
                                        src={img}
                                        alt={`More plant image ${index + 1}`}
                                        width={200}
                                        height={200}
                                        objectFit="cover"
                                        className="rounded-lg shadow-xl w-full h-auto ring-1 ring-emerald-500/20"
                                    />
                                    <div className="mt-2 p-2 bg-slate-800/80 backdrop-blur-sm rounded-lg">
                                        {getPlantInfoSubset(index + 5)}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}