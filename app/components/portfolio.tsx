import React from "react";
export default function Porfolio() {
    return (
        <nav className="w-full">
            <ul className="flex items-center justify-between h-12 px-4 bg-gradient-to-r from-black via-slate-900 to-teal-900 text-white shadow-lg border-b border-teal-500">
                <li className="flex items-center space-x-2">
                    <span className="text-2xl">🌿</span>
                    <a
                        href="https:/ashadeewanexports.com/portfolio"
                        target="_blank"
                        className="text-xl font-bold bg-gradient-to-r from-teal-400 to-green-500 text-transparent bg-clip-text hover:scale-105 transform transition-all duration-300"
                    >
                        Portfolio
                    </a>
                </li>
                <li className="flex items-center">
                    <a
                        href="https://ashadeewanexports.com/portfolio/web-dev.php"
                        target="_blank"
                        className="ml-4 text-base px-4 py-1 rounded-full bg-gradient-to-r from-teal-500 to-green-600 hover:from-teal-600 hover:to-green-700 transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-0.5 transform"
                    >
                        View All Projects
                    </a>
                </li>
            </ul>
        </nav>
    )

}