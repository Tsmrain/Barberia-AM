'use client';

import { Toaster } from "sonner";

export const ClientToaster = () => {
  return (
    <Toaster 
        position="top-center" 
        theme="dark"
        toastOptions={{
            style: {
                background: 'rgba(25, 25, 25, 0.9)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: 'white',
                borderRadius: '16px',
            },
            className: 'font-sans'
        }}
    />
  );
};