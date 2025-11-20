import React, { useEffect, useMemo, useRef, useState } from 'react';
import TabGroup from './TabGroup';
import PinnedSection from './PinnedSection';
import ContextMenu from './ContextMenu';
import ConfirmationModal from './ConfirmationModal';
import SettingsModal from './SettingsModal';
import SubgroupModal from './SubgroupModal';
import GroupSelectModal from './GroupSelectModal';
import { useTabs } from '../hooks/useTabs';
import { useTheme } from '../context/ThemeContext';
import { Plus, Settings, Trash2, Pin, PinOff, X, Sun, Moon, FolderPlus, LocateFixed, Folder, FolderOpen } from 'lucide-react';

const Sidebar = () => {
    const { tabs, groups, activeTabId, switchToTab, closeTab, removeTab, clearGhosts, togglePin, toggleGroupCollapse, getExportPayload, importData, setTabSubgroup, changeTabGroup } = useTabs();
    const { theme, toggleTheme } = useTheme();
    const [contextMenu, setContextMenu] = useState(null);
    const [tabToRemove, setTabToRemove] = useState(null);
    const [isInboxCollapsed, setIsInboxCollapsed] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isProcessingImport, setIsProcessingImport] = useState(false);
    const [settingsMessage, setSettingsMessage] = useState('');
    const [settingsError, setSettingsError] = useState('');
    const fileInputRef = useRef(null);
    const [subgroupTarget, setSubgroupTarget] = useState(null);
    const listRef = useRef(null);
    const [groupModal, setGroupModal] = useState(null);
    const [stickyGroup, setStickyGroup] = useState(null);
    const groupHeaderRefs = useRef(new Map());
    const groupMetaRef = useRef(new Map());

    const colorClassMap = {
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

    const handleOpenSubgroupModal = (tab) => {
        const tabGroup = groups.find(g => g.id === tab.groupId);
        if (!tabGroup) {
            return;
        }
        setSubgroupTarget({
            tabId: tab.id,
            groupId: tabGroup.id
        });
        setContextMenu(null);
    };

    const handleSubgroupConfirm = (name) => {
        if (subgroupTarget?.tabId) {
            setTabSubgroup(subgroupTarget.tabId, name || undefined);
        }
        setSubgroupTarget(null);
    };

    const handleOpenGroupModal = (tab, mode) => {
        setGroupModal({
            tabId: tab.id,
            currentGroupId: tab.groupId ?? -1,
            mode
        });
        setContextMenu(null);
    };

    const handleGroupConfirm = ({ targetGroupId, newGroupName }) => {
        if (groupModal?.tabId) {
            changeTabGroup(groupModal.tabId, targetGroupId, newGroupName);
        }
        setGroupModal(null);
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

    const handleScrollToActive = () => {
        if (!activeTabId) return;

        const container = listRef.current;
        const targetInList = container?.querySelector(`[data-tab-id="${activeTabId}"]`);
        const targetPinned = document.querySelector(`[data-pinned-tab-id="${activeTabId}"]`);
        const target = targetInList || targetPinned;

        if (target && container) {
            const rect = target.getBoundingClientRect();
            const containerRect = container.getBoundingClientRect();
            const isVisible = rect.top >= containerRect.top && rect.bottom <= containerRect.bottom;
            if (!isVisible) {
                target.scrollIntoView({ block: 'center', behavior: 'smooth', inline: 'nearest' });
            }
        } else if (targetPinned) {
            targetPinned.scrollIntoView({ block: 'center', behavior: 'smooth', inline: 'nearest' });
        }
    };

    const pinnedTabs = tabs.filter(t => t.isPinned);
    const unpinnedTabs = tabs.filter(t => !t.isPinned);

    const subgroupModalGroup = subgroupTarget ? groups.find(g => g.id === subgroupTarget.groupId) : null;
    const subgroupModalTab = subgroupTarget ? tabs.find(t => t.id === subgroupTarget.tabId) : null;
    const subgroupOptions = subgroupModalGroup
        ? tabs.filter(t => t.groupId === subgroupModalGroup.id && t.subgroup).map(t => t.subgroup)
        : [];

    const registerHeaderRef = (groupId, el) => {
        if (!groupHeaderRefs.current) return;
        if (el) {
            groupHeaderRefs.current.set(groupId, el);
        } else {
            groupHeaderRefs.current.delete(groupId);
        }
    };

    const itemsToRender = useMemo(() => {
        const groupedTabs = new Map();
        const inboxTabs = [];

        unpinnedTabs.forEach(tab => {
            if (tab.groupId && tab.groupId !== -1) {
                if (!groupedTabs.has(tab.groupId)) {
                    groupedTabs.set(tab.groupId, []);
                }
                groupedTabs.get(tab.groupId).push(tab);
            } else {
                inboxTabs.push(tab);
            }
        });

        const items = [];
        const processedGroupIds = new Set();

        if (inboxTabs.length > 0) {
            items.push({
                type: 'inbox',
                group: {
                    id: 'inbox',
                    title: 'Inbox',
                    color: 'grey',
                    collapsed: isInboxCollapsed
                },
                tabs: inboxTabs
            });
        }

        unpinnedTabs.forEach(tab => {
            if (tab.groupId && tab.groupId !== -1 && !processedGroupIds.has(tab.groupId)) {
                processedGroupIds.add(tab.groupId);
                const group = groups.find(g => g.id === tab.groupId);
                if (group) {
                    items.push({
                        type: 'group',
                        group,
                        tabs: groupedTabs.get(tab.groupId) || []
                    });
                }
            }
        });

        return items;
    }, [unpinnedTabs, groups, isInboxCollapsed]);

    useEffect(() => {
        const meta = new Map();
        itemsToRender.forEach(item => {
            meta.set(item.group.id, { ...item.group, type: item.type });
        });
        groupMetaRef.current = meta;
    }, [itemsToRender]);

    useEffect(() => {
        const container = listRef.current;
        if (!container) return;

        const updateStickyGroup = () => {
            const containerRect = container.getBoundingClientRect();
            const candidates = [];

            groupHeaderRefs.current.forEach((el, groupId) => {
                const meta = groupMetaRef.current.get(groupId);
                if (!el || !meta) return;
                if (meta.collapsed) return;

                const top = el.getBoundingClientRect().top - containerRect.top;
                candidates.push({ groupId, top, meta });
            });

            if (candidates.length === 0) {
                setStickyGroup(null);
                return;
            }

            const above = candidates.filter(c => c.top < 0).sort((a, b) => b.top - a.top);
            const target = above[0];

            if (!target) {
                setStickyGroup(null);
                return;
            }

            setStickyGroup({
                id: target.groupId,
                title: target.meta.title,
                color: target.meta.color,
                type: target.meta.type,
                collapsed: target.meta.collapsed
            });
        };

        container.addEventListener('scroll', updateStickyGroup, { passive: true });
        updateStickyGroup();

        return () => container.removeEventListener('scroll', updateStickyGroup);
    }, [itemsToRender]);

    const handleStickyToggle = () => {
        if (!stickyGroup) return;
        if (stickyGroup.type === 'inbox') {
            setIsInboxCollapsed(prev => !prev);
        } else {
            toggleGroupCollapse(stickyGroup.id);
        }
    };

    return (
        <div className="flex flex-col h-full bg-arc-bg text-arc-text select-none font-sans relative">
            {/* Pinned Tabs */}
            <PinnedSection
                tabs={pinnedTabs}
                activeTabId={activeTabId}
                onTabClick={switchToTab}
                onContextMenu={handleContextMenu}
            />

            {pinnedTabs.length > 0 && <div className="mx-3 my-1 border-b border-white/5" />}

            {/* Tab List */}
            <div className="flex-1 overflow-y-auto px-2 space-y-0.5 relative" ref={listRef}>
                {stickyGroup && (
                    <div
                        className="sticky top-0 z-20 -mx-2 px-4 py-2 flex items-center gap-2 bg-arc-bg border-b border-white/5 cursor-pointer"
                        onClick={handleStickyToggle}
                    >
                        <div className={`w-2 h-2 rounded-full ${colorClassMap[stickyGroup.color] || 'bg-gray-500'} shadow-sm`} />
                        <span className="text-xs font-semibold uppercase tracking-wide text-arc-text flex-1 truncate">
                            {stickyGroup.type === 'inbox' ? 'Inbox' : (stickyGroup.title || 'Untitled Group')}
                        </span>
                        <span className="text-arc-muted text-xs font-medium">{stickyGroup.type === 'inbox' ? (stickyGroup.collapsed ? '展开' : '收起') : '收起'}</span>
                    </div>
                )}

                {itemsToRender.map((item) => {
                    if (item.type === 'inbox') {
                        return (
                            <TabGroup
                                key="inbox-group"
                                group={item.group}
                                tabs={item.tabs}
                                activeTabId={activeTabId}
                                onTabClick={switchToTab}
                                onClose={removeTab}
                                onToggleCollapse={() => setIsInboxCollapsed(!isInboxCollapsed)}
                                onContextMenu={handleContextMenu}
                                groupByHost={true}
                                registerHeaderRef={registerHeaderRef}
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
                                onClose={closeTab}
                                onToggleCollapse={toggleGroupCollapse}
                                onContextMenu={handleContextMenu}
                                groupBySubgroup={true}
                                registerHeaderRef={registerHeaderRef}
                            />
                        );
                    }
                    return null;
                })}
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

            <button
                className="absolute right-4 bottom-16 p-2 rounded-full bg-arc-hover text-arc-muted hover:text-arc-text hover:bg-arc-active shadow-lg border border-black/5 dark:border-white/10 transition-colors"
                title="定位到当前标签"
                onClick={handleScrollToActive}
            >
                <LocateFixed size={14} />
            </button>

            {/* Context Menu */}
            {contextMenu && (
                <ContextMenu
                    x={contextMenu.x}
                    y={contextMenu.y}
                    onClose={() => setContextMenu(null)}
                    options={[
                        ...(contextMenu.tab && (!contextMenu.tab.groupId || contextMenu.tab.groupId === -1) ? [{
                            label: 'Add to Group',
                            icon: <FolderPlus size={14} />,
                            onClick: () => handleOpenGroupModal(contextMenu.tab, 'add')
                        }] : []),
                        ...(contextMenu.tab && contextMenu.tab.groupId && contextMenu.tab.groupId !== -1 ? [{
                            label: 'Move to Group',
                            icon: <FolderOpen size={14} />,
                            onClick: () => handleOpenGroupModal(contextMenu.tab, 'move')
                        }] : []),
                        ...(contextMenu.tab && groups.some(g => g.id === contextMenu.tab.groupId) ? [{
                            label: 'Add to Subgroup',
                            icon: <FolderPlus size={14} />,
                            onClick: () => handleOpenSubgroupModal(contextMenu.tab)
                        }] : []),
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

            <SubgroupModal
                isOpen={!!subgroupTarget}
                groupTitle={subgroupModalGroup?.title}
                existingSubgroups={subgroupOptions}
                initialValue={subgroupModalTab?.subgroup || ''}
                onConfirm={handleSubgroupConfirm}
                onClose={() => setSubgroupTarget(null)}
            />

            <GroupSelectModal
                isOpen={!!groupModal}
                mode={groupModal?.mode}
                groups={groups}
                currentGroupId={groupModal?.currentGroupId ?? -1}
                onConfirm={handleGroupConfirm}
                onClose={() => setGroupModal(null)}
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
