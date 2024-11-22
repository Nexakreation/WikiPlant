import React from 'react';

export default function About() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-8">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-5xl font-bold mb-12 text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-green-300 text-center">Discover the World of Plants</h1>
                
                <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-8 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.3)] mb-12 border border-emerald-500/20 hover:border-emerald-500/40 transition-all duration-300">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="p-3 rounded-full bg-emerald-500/10">
                            <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>
                        <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-green-300">Our Mission</h2>
                    </div>
                    <p className="text-lg mb-4 text-emerald-100/90 leading-relaxed">
                        We're on a mission to revolutionize how people connect with the botanical world. Our platform serves as a bridge between nature's wisdom and modern technology, helping everyone from curious beginners to experienced botanists explore the fascinating realm of plants.
                    </p>
                    <p className="text-lg text-emerald-100/90 leading-relaxed">
                        Through cutting-edge technology and passionate expertise, we're creating an immersive experience that brings the wonder of plants right to your fingertips. Every leaf, petal, and stem has a story to tell, and we're here to help you discover it.
                    </p>
                </div>

                <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-8 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.3)] mb-12 border border-emerald-500/20 hover:border-emerald-500/40 transition-all duration-300">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="p-3 rounded-full bg-emerald-500/10">
                            <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                            </svg>
                        </div>
                        <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-green-300">Features</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="backdrop-blur-sm bg-slate-800/50 p-4 rounded-xl">
                            <div className="flex items-center gap-3 mb-2">
                                <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span className="text-lg font-semibold text-emerald-300">Smart Plant Recognition</span>
                            </div>
                            <p className="text-emerald-100/80 pl-8">Advanced AI-powered plant identification system</p>
                        </div>
                        <div className="backdrop-blur-sm bg-slate-800/50 p-4 rounded-xl">
                            <div className="flex items-center gap-3 mb-2">
                                <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <span className="text-lg font-semibold text-emerald-300">Rich Visual Library</span>
                            </div>
                            <p className="text-emerald-100/80 pl-8">High-resolution images and interactive 3D models</p>
                        </div>
                        <div className="backdrop-blur-sm bg-slate-800/50 p-4 rounded-xl">
                            <div className="flex items-center gap-3 mb-2">
                                <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                </svg>
                                <span className="text-lg font-semibold text-emerald-300">Expert Knowledge</span>
                            </div>
                            <p className="text-emerald-100/80 pl-8">Comprehensive botanical information and care guides</p>
                        </div>
                        <div className="backdrop-blur-sm bg-slate-800/50 p-4 rounded-xl">
                            <div className="flex items-center gap-3 mb-2">
                                <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                </svg>
                                <span className="text-lg font-semibold text-emerald-300">Smart Reminders</span>
                            </div>
                            <p className="text-emerald-100/80 pl-8">Personalized care schedules and notifications</p>
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-8 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.3)] border border-emerald-500/20 hover:border-emerald-500/40 transition-all duration-300">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="p-3 rounded-full bg-emerald-500/10">
                            <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                        </div>
                        <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-green-300">Our Team</h2>
                    </div>
                    <p className="text-lg mb-6 text-emerald-100/90 leading-relaxed">
                        Behind every feature and insight is a diverse team of passionate experts - botanists, developers, designers, and plant enthusiasts - united by our love for nature and technology. We're constantly pushing the boundaries of what's possible in digital plant exploration.
                    </p>
                    <div className="flex justify-center mt-8">
                        {/* <Image
                            src="/team-photo.jpg"
                            alt="Our Team"
                            width={400}
                            height={300}
                            className="rounded-2xl shadow-[0_0_30px_rgba(16,185,129,0.2)]"
                        /> */}
                    </div>
                </div>
            </div>
        </div>
    );
}