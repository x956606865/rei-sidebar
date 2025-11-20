import React from 'react';
import TabItem from './TabItem';
import { useTabs } from '../hooks/useTabs';
import { Plus, Settings, Trash2 } from 'lucide-react';

const Sidebar = () => {
    const { tabs, activeTabId, switchToTab, closeTab, clearGhosts } = useTabs();

    const handleNewTab = () => {
        if (typeof chrome !== 'undefined' && chrome.tabs) {
            chrome.tabs.create({});
        } else {
            console.log('New tab clicked');
        }
    };

    return (
        <div className="flex flex-col h-full bg-arc-bg text-arc-text select-none font-sans">
            {/* Header / Search Bar Placeholder */}
            <div className="p-3">
                <div className="bg-white/5 hover:bg-white/10 rounded-lg p-2 text-sm text-arc-muted flex items-center gap-2 cursor-text transition-colors border border-transparent hover:border-white/5 shadow-sm">
                    <span className="opacity-70">URL or search</span>
                </div>
            </div>

            {/* Tab List */}
            <div className="flex-1 overflow-y-auto px-2 space-y-0.5">
                {tabs.map(tab => (
                    <TabItem
                        key={tab.id}
                        tab={tab}
                        isActive={tab.id === activeTabId}
                        onClick={() => switchToTab(tab)}
                        onClose={closeTab}
                    />
                ))}
            </div>

            {/* Footer Controls */}
            <div className="p-3 mt-auto flex items-center justify-between bg-arc-bg/95 backdrop-blur-sm">
                <button
                    className="p-2 rounded-md hover:bg-arc-hover text-arc-muted hover:text-white transition-colors"
                    onClick={handleNewTab}
                    title="New Tab"
                >
                    <Plus size={20} />
                </button>

                <div className="flex gap-1">
                    <button
                        className="p-2 rounded-md hover:bg-arc-hover text-arc-muted hover:text-white transition-colors"
                        onClick={clearGhosts}
                        title="Clear Closed Tabs"
                    >
                        <Trash2 size={18} />
                    </button>
                    <button
                        className="p-2 rounded-md hover:bg-arc-hover text-arc-muted hover:text-white transition-colors"
                        title="Settings"
                    >
                        <Settings size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Sidebar;
