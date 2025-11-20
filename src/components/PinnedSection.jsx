import React from 'react';

const PinnedSection = ({ tabs, activeTabId, onTabClick, onContextMenu }) => {
    if (tabs.length === 0) return null;

    return (
        <div className="grid grid-cols-6 gap-1.5 px-3 py-2">
            {tabs.map(tab => (
                <div
                    key={tab.id}
                    className={`
            aspect-square rounded-lg flex items-center justify-center cursor-pointer transition-all duration-200
            ${tab.id === activeTabId ? 'bg-white/10 text-white shadow-sm' : 'bg-white/5 text-arc-muted hover:bg-white/10 hover:text-white'}
            ${tab.isGhost ? 'opacity-40 grayscale' : ''}
          `}
                    onClick={() => onTabClick(tab)}
                    onContextMenu={(e) => onContextMenu(e, tab)}
                    title={tab.title}
                >
                    {tab.favIconUrl ? (
                        <img src={tab.favIconUrl} alt="" className="w-5 h-5 object-contain" />
                    ) : (
                        <div className="w-5 h-5 bg-gray-500 rounded-full opacity-50" />
                    )}
                </div>
            ))}
        </div>
    );
};

export default PinnedSection;
