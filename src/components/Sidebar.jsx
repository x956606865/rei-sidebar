import React, { useRef, useState } from 'react';
import TabGroup from './TabGroup';
import PinnedSection from './PinnedSection';
import ContextMenu from './ContextMenu';
import ConfirmationModal from './ConfirmationModal';
import SettingsModal from './SettingsModal';
import { useTabs } from '../hooks/useTabs';
import { useTheme } from '../context/ThemeContext';
import { Plus, Settings, Trash2, Pin, PinOff, X, Sun, Moon } from 'lucide-react';

const Sidebar = () => {
    const { tabs, groups, activeTabId, switchToTab, closeTab, removeTab, clearGhosts, togglePin, toggleGroupCollapse, getExportPayload, importData } = useTabs();
    const { theme, toggleTheme } = useTheme();
    const [contextMenu, setContextMenu] = useState(null);
    const [tabToRemove, setTabToRemove] = useState(null);
    const [isInboxCollapsed, setIsInboxCollapsed] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isProcessingImport, setIsProcessingImport] = useState(false);
    const [settingsMessage, setSettingsMessage] = useState('');
    const [settingsError, setSettingsError] = useState('');
    const fileInputRef = useRef(null);



    const handleNewTab = () => {
        if (typeof chrome !== 'undefined' && chrome.tabs) {
            chrome.tabs.create({});
        } else {
            console.log('New tab clicked');
        }
    };

    const handleContextMenu = (e, tab) => {
        e.preventDefault();
        setContextMenu({
            x: e.clientX,
            y: e.clientY,
            tab
        });
    };

    const handleRemoveClick = (tab) => {
        setTabToRemove(tab);
        setContextMenu(null);
    };

    const handleRemoveConfirm = () => {
        if (tabToRemove) {
            removeTab(tabToRemove.id);
            setTabToRemove(null);
        }
    };

    const handleExport = () => {
        try {
            const payload = getExportPayload();
            const fileName = `rei-sidebar-backup-${new Date().toISOString().replace(/[:.]/g, '-').replace('T', '_').replace('Z', '')}.json`;
            const json = JSON.stringify(payload, null, 2);
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);

            if (typeof chrome !== 'undefined' && chrome.downloads) {
                chrome.downloads.download({
                    url,
                    filename: fileName,
                    saveAs: true
                });
            } else {
                const link = document.createElement('a');
                link.href = url;
                link.download = fileName;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }

            setSettingsMessage(`已导出：${fileName}`);
            setSettingsError('');
            setTimeout(() => URL.revokeObjectURL(url), 5000);
        } catch (e) {
            console.error('导出失败', e);
            setSettingsError('导出失败，请稍后重试');
        }
    };

    const handleImportClick = () => {
        setSettingsError('');
        setSettingsMessage('');
        fileInputRef.current?.click();
    };

    const handleFileChange = async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsProcessingImport(true);
        setSettingsError('');
        setSettingsMessage('');

        try {
            const text = await file.text();
            const data = JSON.parse(text);
            const result = importData(data);
            setSettingsMessage(`导入完成：新增分组 ${result?.addedGroups || 0} 个，新增标签 ${result?.addedTabs || 0} 个，跳过分组 ${result?.skippedGroups || 0} 个，跳过标签 ${result?.skippedTabs || 0} 个。`);
        } catch (e) {
            console.error('导入失败', e);
            setSettingsError('导入失败，文件格式可能不正确');
        } finally {
            setIsProcessingImport(false);
            if (event.target) {
                event.target.value = '';
            }
        }
    };

    const pinnedTabs = tabs.filter(t => t.isPinned);
    const unpinnedTabs = tabs.filter(t => !t.isPinned);

    return (
        <div className="flex flex-col h-full bg-arc-bg text-arc-text select-none font-sans">
            {/* Header / Search Bar Placeholder */}
            <div className="p-3">
                <div className="bg-white/5 hover:bg-white/10 rounded-lg p-2 text-sm text-arc-muted flex items-center gap-2 cursor-text transition-colors border border-transparent hover:border-white/5 shadow-sm">
                    <span className="opacity-70">URL or search</span>
                </div>
            </div>

            {/* Pinned Tabs */}
            <PinnedSection
                tabs={pinnedTabs}
                activeTabId={activeTabId}
                onTabClick={switchToTab}
                onContextMenu={handleContextMenu}
            />

            {pinnedTabs.length > 0 && <div className="mx-3 my-1 border-b border-white/5" />}

            {/* Tab List */}
            <div className="flex-1 overflow-y-auto px-2 space-y-0.5">
                {/* Render groups and ungrouped tabs */}
                {(() => {
                    const groupedTabs = new Map();
                    const ungroupedTabs = [];

                    // Separate tabs into groups and ungrouped
                    unpinnedTabs.forEach(tab => {
                        if (tab.groupId && tab.groupId !== -1) {
                            if (!groupedTabs.has(tab.groupId)) {
                                groupedTabs.set(tab.groupId, []);
                            }
                            groupedTabs.get(tab.groupId).push(tab);
                        } else {
                            ungroupedTabs.push(tab);
                        }
                    });

                    // We need to render groups and ungrouped tabs in some order.
                    // Chrome usually mixes them based on index.
                    // For simplicity, let's render groups first (sorted by something? or just iterate groups)
                    // then ungrouped tabs? Or try to respect index?
                    //
                    // If we want to respect the visual order in Chrome, we should iterate through `tabs` 
                    // and if we encounter a tab that belongs to a group we haven't rendered yet, render the whole group.
                    // But `unpinnedTabs` is already filtered.

                    // Let's iterate through `groups` to render them, and then `ungroupedTabs`.
                    // But wait, what if a group is in the middle of ungrouped tabs?
                    // For a sidebar, it's often cleaner to have groups at top or mixed.
                    // Let's try to respect the order of the first tab in the group.

                    const itemsToRender = [];
                    const processedGroupIds = new Set();

                    // 1. Render Inbox (ungrouped tabs)
                    if (ungroupedTabs.length > 0) {
                        itemsToRender.push({
                            type: 'inbox',
                            group: {
                                id: 'inbox',
                                title: 'Inbox',
                                color: 'grey', // Default color
                                collapsed: isInboxCollapsed
                            },
                            tabs: ungroupedTabs
                        });
                    }

                    // 2. Render Groups
                    unpinnedTabs.forEach(tab => {
                        if (tab.groupId && tab.groupId !== -1) {
                            if (!processedGroupIds.has(tab.groupId)) {
                                processedGroupIds.add(tab.groupId);
                                const group = groups.find(g => g.id === tab.groupId);
                                if (group) {
                                    itemsToRender.push({
                                        type: 'group',
                                        group,
                                        tabs: groupedTabs.get(tab.groupId)
                                    });
                                }
                            }
                        }
                    });

                    return itemsToRender.map((item) => {
                        if (item.type === 'inbox') {
                            return (
                                <TabGroup
                                    key="inbox-group"
                                    group={item.group}
                                    tabs={item.tabs}
                                    activeTabId={activeTabId}
                                    onTabClick={switchToTab}
                                    onClose={removeTab} // Inbox tabs are removed directly
                                    onToggleCollapse={() => setIsInboxCollapsed(!isInboxCollapsed)}
                                    onContextMenu={handleContextMenu}
                                    groupByHost={true}
                                />
                            );
                        } else if (item.type === 'group') {
                            return (
                                <TabGroup
                                    key={`group-${item.group.id}`}
                                    group={item.group}
                                    tabs={item.tabs}
                                    activeTabId={activeTabId}
                                    onTabClick={switchToTab}
                                    onClose={closeTab} // Regular group tabs are ghosted
                                    onToggleCollapse={toggleGroupCollapse}
                                    onContextMenu={handleContextMenu}
                                />
                            );
                        }
                        return null;
                    });
                })()}
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
                        onClick={toggleTheme}
                        title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                    >
                        {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                    </button>
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
                        onClick={() => {
                            setSettingsError('');
                            setSettingsMessage('');
                            setIsSettingsOpen(true);
                        }}
                    >
                        <Settings size={20} />
                    </button>
                </div>
            </div>

            {/* Context Menu */}
            {contextMenu && (
                <ContextMenu
                    x={contextMenu.x}
                    y={contextMenu.y}
                    onClose={() => setContextMenu(null)}
                    options={[
                        {
                            label: contextMenu.tab.isPinned ? 'Unpin Tab' : 'Pin Tab',
                            icon: contextMenu.tab.isPinned ? <PinOff size={14} /> : <Pin size={14} />,
                            onClick: () => togglePin(contextMenu.tab.id)
                        },
                        {
                            label: 'Remove Tab',
                            icon: <Trash2 size={14} />,
                            onClick: () => handleRemoveClick(contextMenu.tab)
                        }
                    ]}
                />
            )}

            {/* Confirmation Modal */}
            <ConfirmationModal
                isOpen={!!tabToRemove}
                title="Remove Tab"
                message={`Are you sure you want to remove "${tabToRemove?.title}"? This action cannot be undone.`}
                confirmLabel="Remove"
                onConfirm={handleRemoveConfirm}
                onCancel={() => setTabToRemove(null)}
            />

            <SettingsModal
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                onImportClick={handleImportClick}
                onExportClick={handleExport}
                isBusy={isProcessingImport}
                message={settingsMessage}
                error={settingsError}
            />

            <input
                ref={fileInputRef}
                type="file"
                accept="application/json"
                className="hidden"
                onChange={handleFileChange}
            />
        </div>
    );
};

export default Sidebar;
