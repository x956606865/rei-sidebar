import React from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import TabItem from './TabItem';

const TabGroup = ({ group, tabs, activeTabId, onTabClick, onClose, onToggleCollapse, onContextMenu, groupByHost = false, groupBySubgroup = false }) => {
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
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-arc-hover cursor-pointer select-none group transition-all duration-200"
                onClick={() => onToggleCollapse(id)}
            >
                <div className="text-arc-muted group-hover:text-arc-text transition-colors opacity-70 group-hover:opacity-100">
                    {collapsed ? <ChevronRight size={10} strokeWidth={3} /> : <ChevronDown size={10} strokeWidth={3} />}
                </div>
                <div className={`w-2 h-2 rounded-full ${groupColorClass} shadow-sm`} />
                <span className="text-sm font-bold tracking-wide text-arc-muted group-hover:text-arc-text transition-colors truncate flex-1 uppercase opacity-90">
                    {title || 'Untitled Group'}
                </span>
            </div>

            {/* Group Tabs */}
            {!collapsed && (
                <div className="mt-0.5 flex flex-col relative">
                    {/* Vertical line for group */}
                    <div className={`absolute left-[15px] top-0 bottom-2 w-[2px] rounded-full ${groupColorClass} opacity-20`} />

                    <div className="pl-6 space-y-0.5">
                        {groupByHost ? (
                            (() => {
                                const tabsByHost = new Map();
                                tabs.forEach(tab => {
                                    let host = 'Other';
                                    try {
                                        if (tab.url) {
                                            const url = new URL(tab.url);
                                            if (url.protocol.startsWith('http')) {
                                                host = url.hostname.replace(/^www\./, '');
                                            }
                                        }
                                    } catch (e) {
                                        // Invalid URL, keep as Other
                                    }
                                    if (!tabsByHost.has(host)) {
                                        tabsByHost.set(host, []);
                                    }
                                    tabsByHost.get(host).push(tab);
                                });

                                return Array.from(tabsByHost.entries()).map(([host, hostTabs]) => (
                                    <div key={host} className="mb-2 last:mb-0">
                                        {host !== 'Other' && (
                                            <div className="px-2 py-1 text-xs font-bold text-arc-muted uppercase tracking-wider opacity-50">
                                                {host}
                                            </div>
                                        )}
                                        <div className="space-y-0.5">
                                            {hostTabs.map(tab => (
                                                <div key={tab.id} data-tab-id={tab.id} onContextMenu={(e) => onContextMenu(e, tab)}>
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
                                ));
                            })()
                        ) : groupBySubgroup ? (
                            (() => {
                                const tabsBySubgroup = new Map();
                                tabs.forEach(tab => {
                                    const subgroupKey = tab.subgroup && tab.subgroup.trim() ? tab.subgroup.trim() : '__ungrouped';
                                    if (!tabsBySubgroup.has(subgroupKey)) {
                                        tabsBySubgroup.set(subgroupKey, []);
                                    }
                                    tabsBySubgroup.get(subgroupKey).push(tab);
                                });

                                const sortedEntries = Array.from(tabsBySubgroup.entries()).sort(([a], [b]) => {
                                    if (a === '__ungrouped') return 1;
                                    if (b === '__ungrouped') return -1;
                                    return a.localeCompare(b, 'zh-Hans');
                                });

                                return sortedEntries.map(([subgroup, subgroupTabs]) => {
                                    const isUngrouped = subgroup === '__ungrouped';
                                    const displayName = isUngrouped ? '未分组' : subgroup;
                                    return (
                                        <div key={subgroup} className="mb-2 last:mb-0">
                                            <div className="px-2 py-1 text-xs font-bold text-arc-muted uppercase tracking-wider opacity-70">
                                                {displayName}
                                            </div>
                                            <div className="space-y-0.5">
                                                {subgroupTabs.map(tab => (
                                                    <div key={tab.id} data-tab-id={tab.id} onContextMenu={(e) => onContextMenu(e, tab)}>
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
                                    );
                                });
                            })()
                        ) : (
                            tabs.map(tab => (
                                <div key={tab.id} data-tab-id={tab.id} onContextMenu={(e) => onContextMenu(e, tab)}>
                                    <TabItem
                                        tab={tab}
                                        isActive={tab.id === activeTabId}
                                        onClick={() => onTabClick(tab)}
                                        onClose={onClose}
                                    />
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default TabGroup;
