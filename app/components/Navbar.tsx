"use client";

import Link from 'next/link';
import { useState } from 'react';

export default function Navbar() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    return (
        <nav className="bg-gradient-to-r from-emerald-700 via-teal-600 to-green-700 p-1 shadow-lg">
            <div className="container mx-auto">
                <div className="flex justify-between items-center">
                    <Link href="/" className="text-white text-3xl font-bold tracking-tight hover:scale-105 transition-transform duration-200 flex items-center gap-2">
                     <span>🍃</span>
                        WikiPlant
                    </Link>
                    <div className="lg:hidden">
                        <button onClick={toggleMenu} className="text-white focus:outline-none hover:bg-emerald-600 p-2 rounded-lg transition-colors duration-200">
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                {isMenuOpen ? (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                ) : (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                )}
                            </svg>
                        </button>
                    </div>
                    <div className="hidden lg:flex space-x-6">
                        <Link href="/" className="text-white hover:text-emerald-100 px-4 py-2 rounded-lg hover:bg-emerald-600 transition-all duration-200 flex items-center gap-2">
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
                            </svg>
                            Home
                        </Link>
                        <Link href="/random-facts" className="text-white hover:text-emerald-100 px-4 py-2 rounded-lg hover:bg-emerald-600 transition-all duration-200 flex items-center gap-2">
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 4v16M8 4v16M4 4h16"/>
                            </svg>
                            Plant Facts
                        </Link>
                        <Link href="/about" className="text-white hover:text-emerald-100 px-4 py-2 rounded-lg hover:bg-emerald-600 transition-all duration-200 flex items-center gap-2">
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                            </svg>
                            About
                        </Link>
                    </div>
                </div>
                {isMenuOpen && (
                    <div className="lg:hidden mt-4 bg-emerald-600 rounded-lg p-2 shadow-xl animate-fadeIn">
                        <Link href="/" className="block text-white hover:text-emerald-100 py-3 px-4 rounded hover:bg-emerald-700 transition-colors duration-200 flex items-center gap-2">
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
                            </svg>
                            Home
                        </Link>
                        <Link href="/random-facts" className="block text-white hover:text-emerald-100 py-3 px-4 rounded hover:bg-emerald-700 transition-colors duration-200 flex items-center gap-2">
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 4v16M8 4v16M4 4h16"/>
                            </svg>
                            Plant Facts
                        </Link>
                        <Link href="/about" className="block text-white hover:text-emerald-100 py-3 px-4 rounded hover:bg-emerald-700 transition-colors duration-200 flex items-center gap-2">
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                            </svg>
                            About
                        </Link>
                    </div>
                )}
            </div>
            <div id="google_translate_element" className="hidden"></div>
        </nav>
    );
}