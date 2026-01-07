import React from 'react';

export const Header: React.FC = () => {
  return (
    <header className="w-full bg-[#3E3832] text-[#F2E8D5] py-6 shadow-lg relative overflow-hidden">
      {/* Decorative background pattern simulation */}
      <div className="absolute inset-0 opacity-10" style={{
        backgroundImage: 'radial-gradient(circle at 50% 120%, #A84C32 0%, transparent 60%)'
      }}></div>
      
      <div className="container mx-auto px-4 relative z-10 flex flex-col items-center">
        <h1 className="text-3xl md:text-4xl font-bold tracking-widest serif mb-2 text-[#E5D5C0]">
          敦煌色彩 · Dunhuang Color
        </h1>
        <p className="text-sm md:text-base font-light opacity-80 max-w-lg text-center">
          Extract the soul of history. AI-powered color analysis for Dunhuang aesthetics.
        </p>
        <div className="h-1 w-24 bg-[#A84C32] mt-4 rounded-full"></div>
      </div>
    </header>
  );
};