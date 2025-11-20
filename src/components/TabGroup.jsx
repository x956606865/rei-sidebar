import React from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import TabItem from './TabItem';

const TabGroup = ({ group, tabs, activeTabId, onTabClick, onClose, onToggleCollapse, onContextMenu }) => {
    const { id, title, color, collapsed } = group;

    // Map Chrome group colors to CSS colors (tailwind classes or hex)
    const colorMap = {
        grey: 'bg-gray-500',
        blue: 'bg-blue-500',
        red: 'bg-red-500',
        yellow: 'bg-yellow-500',
        green: 'bg-green-500',
        pink: 'bg-pink-500',
        purple: 'bg-purple-500',
        cyan: 'bg-cyan-500',
        orange: 'bg-orange-500',
    };

    const groupColorClass = colorMap[color] || 'bg-gray-500';

    return (
        <div className="mb-2">
            {/* Group Header */}
            <div
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/5 cursor-pointer select-none group transition-all duration-200"
                onClick={() => onToggleCollapse(id)}
            >
                <div className="text-arc-muted group-hover:text-white transition-colors opacity-70 group-hover:opacity-100">
                    {collapsed ? <ChevronRight size={10} strokeWidth={3} /> : <ChevronDown size={10} strokeWidth={3} />}
                </div>
                <div className={`w-2 h-2 rounded-full ${groupColorClass} shadow-sm`} />
                <span className="text-[11px] font-bold tracking-wide text-arc-muted group-hover:text-white transition-colors truncate flex-1 uppercase opacity-90">
                    {title || 'Untitled Group'}
                </span>
            </div>

            {/* Group Tabs */}
            {!collapsed && (
                <div className="mt-0.5 flex flex-col relative">
                    {/* Vertical line for group */}
                    <div className={`absolute left-[15px] top-0 bottom-2 w-[2px] rounded-full ${groupColorClass} opacity-20`} />

                    <div className="pl-6 space-y-0.5">
                        {tabs.map(tab => (
                            <div key={tab.id} onContextMenu={(e) => onContextMenu(e, tab)}>
                                <TabItem
                                    tab={tab}
                                    isActive={tab.id === activeTabId}
                                    onClick={() => onTabClick(tab)}
                                    onClose={onClose}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default TabGroup;
