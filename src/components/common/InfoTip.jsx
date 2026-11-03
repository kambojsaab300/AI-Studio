import React, { useState, useRef, useEffect } from 'react';
import { Info } from 'lucide-react';

export function InfoTip({ text, className = "" }) {
    const [open, setOpen] = useState(false);
    const tipRef = useRef(null);

    useEffect(() => {
        if (!open) return;
        const handleOutside = (e) => {
            if (tipRef.current && !tipRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener('pointerdown', handleOutside);
        return () => document.removeEventListener('pointerdown', handleOutside);
    }, [open]);

    if (!text) return null;

    return (
        <span 
            ref={tipRef} 
            className={`relative inline-flex items-center align-middle ${className}`}
            onMouseEnter={() => setOpen(true)}
            onMouseLeave={() => setOpen(false)}
        >
            <button
                type="button"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(v => !v); }}
                className="w-4 h-4 rounded-full flex items-center justify-center text-slate-400 hover:text-amber-400 focus:outline-none transition-colors"
                aria-label="Info details"
            >
                <Info className="w-3.5 h-3.5" />
            </button>
            {open && (
                <div 
                    role="tooltip"
                    className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 sm:w-64 p-2.5 bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-xl shadow-2xl text-[11px] leading-relaxed text-slate-200 pointer-events-none animate-fadeIn"
                >
                    <div className="font-sans font-normal text-left">{text}</div>
                    <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-slate-900" />
                </div>
            )}
        </span>
    );
}

export default InfoTip;
