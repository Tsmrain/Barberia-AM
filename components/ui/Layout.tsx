import React from 'react';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <main className="min-h-screen w-full bg-[#0a0a0a] text-white/90 font-sans selection:bg-amber-500/30 overflow-x-hidden">
      {/* Background Gradient Mesh */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-900/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-amber-900/10 rounded-full blur-[120px]" />
      </div>
      
      {/* Content */}
      <div className="relative z-10 max-w-md mx-auto min-h-screen flex flex-col">
        {children}
      </div>
    </main>
  );
};
