"use client";

import React from 'react';

interface SearchBarProps {
  onSearch: () => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch, searchTerm, setSearchTerm }) => {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSearch();
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md mb-4 sm:mb-8 px-4 sm:px-0">
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-emerald-600 to-green-600 rounded-lg blur opacity-25 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
        <div className="relative flex items-center bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-2 ring-1 ring-emerald-500/50">
            <svg className="pl-2 w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          <input
            className="flex-1 bg-transparent text-emerald-100 placeholder-emerald-400/50 border-none py-2 px-4 focus:outline-none focus:ring-0"
            type="text"
            placeholder="Search for any plant...🌿"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button
            className="group relative inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-br from-emerald-500 to-green-500 px-4 py-2 text-sm font-semibold text-white transition-all hover:from-emerald-600 hover:to-green-600 hover:shadow-[0_0_20px_rgba(16,185,129,0.3)] focus:outline-none focus:ring-2 focus:ring-emerald-500/70"
            type="submit"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Search
          </button>
        </div>
      </div>
    </form>
  );
};

export default SearchBar;