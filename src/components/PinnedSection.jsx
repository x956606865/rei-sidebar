import React from 'react';

const PinnedSection = ({ tabs, activeTabId, onTabClick, onContextMenu }) => {
    if (tabs.length === 0) return null;

    return (
        <div className="grid grid-cols-6 gap-1.5 px-3 py-2">
            {tabs.map(tab => (
                <div
                    key={tab.id}
                    data-pinned-tab-id={tab.id}
                    className={`
            aspect-square rounded-lg flex items-center justify-center cursor-pointer transition-all duration-200
            ${tab.id === activeTabId ? 'bg-arc-active text-arc-text shadow-sm' : 'bg-arc-hover text-arc-muted hover:bg-arc-active hover:text-arc-text'}
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
