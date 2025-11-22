import React, { useRef, useState } from 'react';
import { X, Snowflake } from 'lucide-react';

const TabItem = ({ tab, isActive, onClick, onClose }) => {
    const [showUrl, setShowUrl] = useState(false);
    const timerRef = useRef(null);

    const handleMouseEnter = () => {
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => setShowUrl(true), 1000);
    };

    const handleMouseLeave = () => {
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = null;
        setShowUrl(false);
    };

    const isDiscarded = !!tab.discarded;

    return (
        <div
            className={`
        group flex items-center gap-3 px-3 py-1.5 rounded-lg cursor-pointer text-[13px] transition-all duration-200
        ${isActive ? 'bg-arc-active text-arc-text shadow-sm' : 'text-arc-muted hover:bg-arc-hover hover:text-arc-text'}
        ${tab.isGhost ? 'opacity-40 hover:opacity-70 grayscale' : ''}
      `}
            onClick={onClick}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onMouseDown={() => {
                if (timerRef.current) clearTimeout(timerRef.current);
                setShowUrl(false);
            }}
            data-tab-id={tab.id}
            style={{ position: 'relative' }}
        >
            {/* Favicon */}
            <div className="w-4 h-4 flex-shrink-0">
                {tab.favIconUrl ? (
                    <img src={tab.favIconUrl} alt="" className="w-full h-full object-contain" />
                ) : (
                    <div className="w-full h-full bg-gray-500 rounded-full opacity-50" />
                )}
            </div>

            {/* Title */}
            <span className="flex-1 truncate select-none flex items-center gap-1">
                <span className="truncate">{tab.title}</span>
            </span>

            {/* State badges */}
            {isDiscarded && (
                <Snowflake
                    size={12}
                    className="text-sky-300 shrink-0"
                    title="已冻结 / 已挂起"
                    aria-label="discarded-tab"
                />
            )}

            {/* Close Button (visible on hover) */}
            <button
                className={`
          opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-arc-text/10 transition-opacity
          ${isActive ? 'opacity-100' : ''}
        `}
                onClick={(e) => {
                    e.stopPropagation();
                onClose(tab.id);
            }}
            >
                <X size={12} />
            </button>

            {showUrl && tab.url && (
                <div className="absolute left-0 right-0 top-full mt-1 z-20 px-3 py-2 rounded-md bg-arc-hover text-xs text-arc-text shadow-lg border border-black/5 dark:border-white/10">
                    <span className="break-all">{tab.url}</span>
                </div>
            )}
        </div>
    );
};

export default TabItem;
