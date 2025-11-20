import React from 'react';
import { X } from 'lucide-react';

const TabItem = ({ tab, isActive, onClick, onClose }) => {
    return (
        <div
            className={`
        group flex items-center gap-3 px-3 py-1.5 rounded-lg cursor-pointer text-[13px] transition-all duration-200
        ${isActive ? 'bg-white/10 text-white shadow-sm' : 'text-arc-muted hover:bg-white/5 hover:text-white'}
        ${tab.isGhost ? 'opacity-40 hover:opacity-70 grayscale' : ''}
      `}
            onClick={onClick}
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
            <span className="flex-1 truncate select-none">
                {tab.title}
            </span>

            {/* Close Button (visible on hover) */}
            <button
                className={`
          opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-gray-600 transition-opacity
          ${isActive ? 'opacity-100' : ''}
        `}
                onClick={(e) => {
                    e.stopPropagation();
                    onClose(tab.id);
                }}
            >
                <X size={12} />
            </button>
        </div>
    );
};

export default TabItem;
