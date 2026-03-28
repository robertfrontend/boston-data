'use client';

import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="max-w-lg mx-auto px-5 py-12 text-center space-y-4">
      <div className="flex items-center justify-center gap-2 text-[#8E8E93] dark:text-[#98989D] font-medium text-sm">
        <span>Created by Robert Frontend</span>
        <span className="opacity-30">•</span>
        <a 
          href="https://github.com/robertfrontend/boston-street-cleaning" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 hover:text-[#007AFF] transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 33.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
          </svg>
          <span>GitHub</span>
        </a>
      </div>
      <p className="text-[#AEAEB2] dark:text-[#636366] text-[10px] font-bold uppercase tracking-widest">
        Boston Municipal Data © 2026
      </p>
    </footer>
  );
};
