import { useState, useEffect, useRef } from 'react';

// Chrome 集成开关：初始化后不再与 Chrome tabGroups 同步
const USE_CHROME_GROUP_SYNC = false;

const normalizeTitle = (title = '') => title.trim().toLowerCase();
const generateLocalId = (prefix) => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
};

export const useTabs = () => {
  const [tabs, setTabs] = useState([]);
  const [groups, setGroups] = useState([]);
  const [activeTabId, setActiveTabId] = useState(null);
  const [spaces, setSpaces] = useState([{ id: 'default', title: 'Default', color: 'blue' }]);
  const [activeSpaceId, setActiveSpaceId] = useState('default');
  const isInternalUpdate = useRef(false);

  // Load tabs from storage or sync with current window
  useEffect(() => {
    const initTabs = async () => {
      if (typeof chrome === 'undefined' || !chrome.tabs) {
        // Mock data
        setTabs([
          { id: 'mock-1', title: 'Google', url: 'https://google.com', favIconUrl: 'https://www.google.com/favicon.ico', active: true },
          { id: 'mock-2', title: 'GitHub', url: 'https://github.com', favIconUrl: 'https://github.com/favicon.ico', active: false },
          { id: 'mock-3', title: 'YouTube', url: 'https://youtube.com', favIconUrl: 'https://www.youtube.com/favicon.ico', active: false, isGhost: true },
        ]);
        setActiveTabId('mock-1');
        return;
      }

      // Load persisted tabs and groups
      const storage = await chrome.storage.local.get(['savedTabs', 'savedGroups', 'savedSpaces', 'activeSpaceId']);
      let savedTabs = storage.savedTabs || [];
      let savedGroups = storage.savedGroups || [];
      let savedSpaces = storage.savedSpaces || [{ id: 'default', title: 'Default', color: 'blue' }];
      let savedActiveSpaceId = storage.activeSpaceId || 'default';

      // Get current actual tabs and groups
      const currentTabs = await chrome.tabs.query({ currentWindow: true });
      let currentGroups = [];
      if (chrome.tabGroups) {
        currentGroups = await chrome.tabGroups.query({ windowId: chrome.windows.WINDOW_ID_CURRENT });
      } else {
        // Fallback: try to get groups from background script
        try {
          const response = await chrome.runtime.sendMessage({ type: 'GET_GROUPS' });
          if (response && response.groups) {
            currentGroups = response.groups;
          }
        } catch (e) {
          console.error('Failed to get groups from background:', e);
        }
      }

      console.log('Init Tabs Debug:', {
        hasTabGroupsApi: !!chrome.tabGroups,
        currentGroups,
        currentTabsCount: currentTabs.length,
        tabsWithGroups: currentTabs.filter(t => t.groupId > -1).length
      });

      // Merge logic:
      // 1. If we have saved tabs, try to match them with current tabs by ID or URL
      // 2. If a saved tab no longer exists in current tabs, mark it as ghost
      // 3. If a current tab is not in saved tabs, add it

      const newTabsState = [];
      const currentTabsMap = new Map(currentTabs.map(t => [t.id, t]));

      // Process saved tabs
      for (const savedTab of savedTabs) {
        if (currentTabsMap.has(savedTab.id)) {
          // Tab still exists, update it
          newTabsState.push({ ...savedTab, ...currentTabsMap.get(savedTab.id), isGhost: false });
          currentTabsMap.delete(savedTab.id);
        } else {
          // Tab is gone, mark as ghost
          newTabsState.push({ ...savedTab, isGhost: true });
        }
      }

      // Add remaining new current tabs
      for (const tab of currentTabsMap.values()) {
        newTabsState.push({ ...tab, isGhost: false });
      }

      // Process groups
      const newGroupsState = [];
      const currentGroupsMap = new Map(currentGroups.map(g => [g.id, g]));

      // Process saved groups to keep local state like 'collapsed' if we want to override chrome's or keep ghost groups
      // For now, we primarily sync with Chrome's groups, but we might want to persist 'collapsed' state if we want it independent of Chrome
      // or if we want to support ghost groups.
      // Let's sync with Chrome groups but preserve our local 'collapsed' state if it exists in savedGroups.

      const savedGroupsMap = new Map(savedGroups.map(g => [g.id, g]));

      for (const currentGroup of currentGroups) {
        const savedGroup = savedGroupsMap.get(currentGroup.id);
        newGroupsState.push({
          ...currentGroup,
          collapsed: savedGroup ? savedGroup.collapsed : currentGroup.collapsed, // Prefer saved collapsed state if we want to enforce it, or just use current. 
          spaceId: savedGroup ? (savedGroup.spaceId || 'default') : 'default'
          // Actually, Chrome syncs collapsed state. Let's just use Chrome's state for now, 
          // unless we want to support groups that are closed in Chrome but kept here (ghost groups).
          // For ghost groups support, we need to check savedGroups.
        });
        if (savedGroup) savedGroupsMap.delete(currentGroup.id);
      }

      // Add ghost groups (groups that are in savedGroups but not in currentGroups, and have ghost tabs)
      // We need to know if a ghost group has ghost tabs to decide whether to keep it.
      // For simplicity in this step, let's just keep all saved groups that are not in current groups as ghost groups?
      // Or better: filter later. Let's add them for now.
      for (const savedGroup of savedGroupsMap.values()) {
        // Only keep ghost group if it has ghost tabs associated with it? 
        // We'll filter this when rendering or cleaning up. For now, add it.
        newGroupsState.push({ ...savedGroup, isGhost: true });
      }

      setTabs(newTabsState);
      setGroups(newGroupsState);
      setSpaces(savedSpaces);
      setActiveSpaceId(savedActiveSpaceId);

      const activeTab = currentTabs.find(t => t.active);
      if (activeTab) setActiveTabId(activeTab.id);
    };

    initTabs();
  }, []);

  // Save tabs and groups to storage whenever they change
  useEffect(() => {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      if (tabs.length > 0) {
        const tabsToSave = tabs.map(t => ({
          id: t.id,
          title: t.title,
          url: t.url,
          favIconUrl: t.favIconUrl,
          isGhost: t.isGhost,
          isPinned: t.isPinned,
          groupId: t.groupId,
          subgroup: t.subgroup
        }));
        chrome.storage.local.set({ savedTabs: tabsToSave });
      }

      if (groups.length > 0) {
        const groupsToSave = groups.map(g => ({
          id: g.id,
          title: g.title,
          color: g.color,
          collapsed: g.collapsed,
          isGhost: g.isGhost,
          spaceId: g.spaceId || 'default'
        }));
        chrome.storage.local.set({ savedGroups: groupsToSave });
      }

      if (spaces.length > 0) {
        chrome.storage.local.set({ savedSpaces: spaces, activeSpaceId });
      }
    }
  }, [tabs, groups, spaces, activeSpaceId]);

  // Listen for tab updates
  useEffect(() => {
    if (typeof chrome === 'undefined' || !chrome.tabs) return;

    const handleCreated = (tab) => {
      if (isInternalUpdate.current) return;
      setTabs(prev => [...prev, { ...tab, isGhost: false }]);
    };

    const handleUpdated = (tabId, changeInfo, tab) => {
      setTabs(prev => prev.map(t => {
        if (t.id !== tabId) return t;
        // 保留本地分组归属，避免被 Chrome 状态覆盖
        return { ...t, ...tab, groupId: t.groupId ?? tab.groupId, isGhost: false };
      }));
      if (tab.active) setActiveTabId(tabId);
    };

    const handleRemoved = (tabId) => {
      if (isInternalUpdate.current) return;
      setTabs(prev => prev.map(t => t.id === tabId ? { ...t, isGhost: true } : t));
    };

    const handleActivated = (activeInfo) => {
      setActiveTabId(activeInfo.tabId);
    };

    const handleGroupCreated = (group) => {
      setGroups(prev => [...prev, { ...group, isGhost: false }]);
    };

    const handleGroupUpdated = (group) => {
      setGroups(prev => prev.map(g => g.id === group.id ? { ...g, ...group, isGhost: false } : g));
    };

    const handleGroupRemoved = (groupId) => {
      // Mark as ghost instead of removing, if we want to support ghost groups
      // But we should only keep it if it has ghost tabs. 
      // For now, let's mark as ghost.
      setGroups(prev => prev.map(g => g.id === groupId ? { ...g, isGhost: true } : g));
    };

    chrome.tabs.onCreated.addListener(handleCreated);
    chrome.tabs.onUpdated.addListener(handleUpdated);
    chrome.tabs.onRemoved.addListener(handleRemoved);
    chrome.tabs.onActivated.addListener(handleActivated);

    if (chrome.tabGroups) {
      chrome.tabGroups.onCreated.addListener(handleGroupCreated);
      chrome.tabGroups.onUpdated.addListener(handleGroupUpdated);
      chrome.tabGroups.onRemoved.addListener(handleGroupRemoved);
    }

    return () => {
      chrome.tabs.onCreated.removeListener(handleCreated);
      chrome.tabs.onUpdated.removeListener(handleUpdated);
      chrome.tabs.onRemoved.removeListener(handleRemoved);
      chrome.tabs.onActivated.removeListener(handleActivated);

      if (chrome.tabGroups) {
        chrome.tabGroups.onCreated.removeListener(handleGroupCreated);
        chrome.tabGroups.onUpdated.removeListener(handleGroupUpdated);
        chrome.tabGroups.onRemoved.removeListener(handleGroupRemoved);
      }
    };
  }, []);

  const switchToTab = async (tab) => {
    if (typeof chrome === 'undefined' || !chrome.tabs) {
      setActiveTabId(tab.id);
      return;
    }

    if (tab.isGhost) {
      // Reopen ghost tab
      isInternalUpdate.current = true;
      const newTab = await chrome.tabs.create({ url: tab.url, active: true });

      // Replace ghost tab with new tab in state
      setTabs(prev => prev.map(t => t.id === tab.id ? { ...newTab, isGhost: false } : t));
      setActiveTabId(newTab.id);

      // Small delay to allow listeners to settle if needed, though isInternalUpdate handles most
      setTimeout(() => { isInternalUpdate.current = false; }, 100);
    } else {
      await chrome.tabs.update(tab.id, { active: true });
    }
  };

  const closeTab = async (tabId) => {
    if (typeof chrome === 'undefined' || !chrome.tabs) {
      // In mock mode, closeTab behaves like removeTab for simplicity unless we want to simulate ghosting
      setTabs(prev => prev.map(t => t.id === tabId ? { ...t, isGhost: true } : t));
      return;
    }

    const tab = tabs.find(t => t.id === tabId);
    if (!tab) return;

    if (tab.isGhost) {
      // If it's already a ghost, "closing" it via X shouldn't do anything based on new requirements
      // It should only be removed via the "Remove" context menu option
      return;
    } else {
      // If it's a real tab, close it in browser. 
      // The 'onRemoved' listener will handle marking it as ghost.
      await chrome.tabs.remove(tabId);
    }
  };

  const removeTab = async (tabId) => {
    // Permanently remove the tab from the list
    if (typeof chrome === 'undefined' || !chrome.tabs) {
      setTabs(prev => prev.filter(t => t.id !== tabId));
      return;
    }

    const tab = tabs.find(t => t.id === tabId);

    // Optimistically remove from state immediately
    setTabs(prev => prev.filter(t => t.id !== tabId));

    // If it's a real active tab (not ghost), also close it in browser
    if (tab && !tab.isGhost) {
      try {
        await chrome.tabs.remove(tabId);
      } catch (e) {
        // Ignore error if tab is already gone
        console.log('Tab might already be closed', e);
      }
    }
  };

  const clearGhosts = () => {
    setTabs(prev => prev.filter(t => !t.isGhost));
  };

  const togglePin = (tabId) => {
    setTabs(prev => prev.map(t => {
      if (t.id === tabId) {
        return { ...t, isPinned: !t.isPinned };
      }
      return t;
    }));
  };

  const toggleGroupCollapse = async (groupId) => {
    const group = groups.find(g => g.id === groupId);
    if (!group) return;

    const newCollapsedState = !group.collapsed;

    // Update local state
    setGroups(prev => prev.map(g => g.id === groupId ? { ...g, collapsed: newCollapsedState } : g));

    // Sync with Chrome if it's not a ghost group
    if (!group.isGhost && typeof chrome !== 'undefined' && chrome.tabGroups) {
      try {
        await chrome.tabGroups.update(groupId, { collapsed: newCollapsedState });
      } catch (e) {
        console.error("Failed to update group collapse state", e);
      }
    }
  };

  const getExportPayload = () => {
    return {
      meta: {
        version: 1,
        exportedAt: new Date().toISOString()
      },
      spaces,
      activeSpaceId,
      groups: groups.map(g => ({
        id: g.id,
        title: g.title,
        color: g.color,
        collapsed: !!g.collapsed,
        isGhost: !!g.isGhost,
        spaceId: g.spaceId || 'default'
      })),
      tabs: tabs.map(t => ({
        id: t.id,
        title: t.title,
        url: t.url,
        favIconUrl: t.favIconUrl,
        isGhost: !!t.isGhost,
        isPinned: !!t.isPinned,
        groupId: t.groupId,
        subgroup: t.subgroup
      }))
    };
  };

  const importData = (payload = {}) => {
    const incomingSpaces = Array.isArray(payload.spaces) ? payload.spaces : [];
    const incomingGroups = Array.isArray(payload.groups) ? payload.groups : [];
    const incomingTabs = Array.isArray(payload.tabs) ? payload.tabs : [];

    // Merge spaces with cap (4 total including default)
    const normalize = (title = '') => title.trim().toLowerCase();
    const existingSpaceColors = new Set(spaces.map(s => s.color || 'grey'));
    const mergedSpaces = [...spaces];
    const maxSpaces = 4;

    incomingSpaces.forEach(space => {
      const colorKey = space.color || 'grey';
      if (mergedSpaces.length >= maxSpaces) return;
      if (existingSpaceColors.has(colorKey)) return;
      mergedSpaces.push({
        id: space.id || generateLocalId('space'),
        title: space.title || colorKey.charAt(0).toUpperCase() + colorKey.slice(1),
        color: colorKey
      });
      existingSpaceColors.add(colorKey);
    });

    // Ensure default space exists (blue). If missing and blue already used, still force default.
    if (!mergedSpaces.some(s => s.id === 'default')) {
      mergedSpaces.unshift({ id: 'default', title: 'Default', color: 'blue' });
      existingSpaceColors.add('blue');
    }

    const spaceIdSet = new Set(mergedSpaces.map(s => s.id));
    const importedActiveSpaceId = payload.activeSpaceId && spaceIdSet.has(payload.activeSpaceId)
      ? payload.activeSpaceId
      : 'default';

    const groupKeyToId = new Map(groups.map(g => [normalizeTitle(g.title || ''), g.id]));
    const existingGroupIds = new Set(groups.map(g => String(g.id)));
    const addedGroups = [];

    incomingGroups.forEach(group => {
      const key = normalizeTitle(group.title || '');
      if (!key || groupKeyToId.has(key)) {
        return;
      }
      let newId = generateLocalId('group');
      while (existingGroupIds.has(String(newId))) {
        newId = generateLocalId('group');
      }
      existingGroupIds.add(String(newId));
      const fallbackSpaceId = spaceIdSet.has(group.spaceId) ? group.spaceId : 'default';
      groupKeyToId.set(key, newId);
      addedGroups.push({
        id: newId,
        title: group.title || 'Untitled Group',
        color: group.color || 'grey',
        collapsed: !!group.collapsed,
        isGhost: true,
        spaceId: fallbackSpaceId
      });
    });

    const mergedGroups = [...groups, ...addedGroups];
    const groupIdToKey = new Map(mergedGroups.map(g => [g.id, normalizeTitle(g.title || '')]));

    const tabKey = (tab) => {
      const groupKey = groupIdToKey.get(tab.groupId) || '';
      return `${tab.url || ''}:::${groupKey}`;
    };

    const existingTabKeys = new Set(tabs.map(tabKey));
    const addedTabs = [];
    const usedTabIds = new Set(tabs.map(t => String(t.id)));

    incomingTabs.forEach(tab => {
      const sourceGroup = incomingGroups.find(g => g.id === tab.groupId);
      const targetGroupKey = sourceGroup ? normalizeTitle(sourceGroup.title || '') : '';
      const targetGroupId = targetGroupKey ? groupKeyToId.get(targetGroupKey) : undefined;
      const targetSpaceId = sourceGroup && spaceIdSet.has(sourceGroup.spaceId) ? sourceGroup.spaceId : 'default';
      const resolvedGroupId = targetGroupId ?? -1;
      const groupKeyForTab = targetGroupKey || '';
      const key = `${tab.url || ''}:::${groupKeyForTab}`;
      if (existingTabKeys.has(key)) return;

      let newId = generateLocalId('tab');
      while (usedTabIds.has(String(newId))) {
        newId = generateLocalId('tab');
      }
      usedTabIds.add(String(newId));
      existingTabKeys.add(key);

      addedTabs.push({
        id: newId,
        title: tab.title || tab.url || 'Untitled',
        url: tab.url,
        favIconUrl: tab.favIconUrl,
        isGhost: true,
        isPinned: !!tab.isPinned,
        groupId: resolvedGroupId,
        subgroup: tab.subgroup,
        spaceId: targetSpaceId
      });
    });

    if (addedGroups.length > 0) {
      setGroups(prev => [...prev, ...addedGroups]);
    }
    if (addedTabs.length > 0) {
      setTabs(prev => [...prev, ...addedTabs]);
    }

    setSpaces(mergedSpaces.slice(0, maxSpaces));
    setActiveSpaceId(importedActiveSpaceId);

    return {
      addedGroups: addedGroups.length,
      addedTabs: addedTabs.length,
      skippedGroups: incomingGroups.length - addedGroups.length,
      skippedTabs: incomingTabs.length - addedTabs.length
    };
  };

  const changeTabGroup = async (tabId, targetGroupId, newGroupTitle) => {
    const tab = tabs.find(t => t.id === tabId);
    if (!tab) return;

    let resolvedGroupId = targetGroupId;
    let createdGroup = null;

    if (targetGroupId === -1 || targetGroupId === 'inbox' || targetGroupId === null || targetGroupId === undefined) {
      resolvedGroupId = -1;
    }

    if ((targetGroupId === 'new' || (!targetGroupId && newGroupTitle)) && newGroupTitle) {
      createdGroup = {
        id: generateLocalId('group'),
        title: newGroupTitle,
        color: 'grey',
        collapsed: false,
        isGhost: false
      };
      resolvedGroupId = createdGroup.id;
      setGroups(prev => [...prev, createdGroup]);
    }

    setTabs(prev => prev.map(t => t.id === tabId ? { ...t, groupId: resolvedGroupId } : t));

    // 若需与 Chrome 同步，可开启 USE_CHROME_GROUP_SYNC；默认独立维护，不再推送到 Chrome
    if (USE_CHROME_GROUP_SYNC && typeof chrome !== 'undefined' && chrome.tabs) {
      try {
        if (resolvedGroupId === -1) {
          await chrome.tabs.ungroup(tabId);
        } else if (createdGroup && chrome.tabs.group) {
          const newId = await chrome.tabs.group({ tabIds: tabId });
          resolvedGroupId = newId;
          if (chrome.tabGroups && chrome.tabGroups.update) {
            await chrome.tabGroups.update(newId, { title: createdGroup.title, color: createdGroup.color });
          }
          setGroups(prev => prev.map(g => g.id === createdGroup.id ? { ...g, id: newId, isGhost: false } : g));
          setTabs(prev => prev.map(t => t.groupId === createdGroup.id ? { ...t, groupId: newId } : t));
        } else if (chrome.tabs.group) {
          const targetGroup = groups.find(g => g.id === resolvedGroupId);
          if (targetGroup && targetGroup.isGhost) {
            const newId = await chrome.tabs.group({ tabIds: tabId });
            resolvedGroupId = newId;
            if (chrome.tabGroups && chrome.tabGroups.update) {
              await chrome.tabGroups.update(newId, { title: targetGroup.title, color: targetGroup.color });
            }
            setGroups(prev => prev.map(g => g.id === targetGroup.id ? { ...g, id: newId, isGhost: false } : g));
            setTabs(prev => prev.map(t => t.groupId === targetGroup.id ? { ...t, groupId: newId } : t));
          } else {
            await chrome.tabs.group({ tabIds: tabId, groupId: resolvedGroupId });
          }
        }
      } catch (e) {
        console.error('Failed to change tab group', e);
      }
    }
    
    // 本地分组使用时，确保目标组标记为非幽灵
    setGroups(prev => prev.map(g => g.id === resolvedGroupId ? { ...g, isGhost: false } : g));
  };

  const setTabSubgroup = (tabId, subgroupName) => {
    setTabs(prev => prev.map(t => t.id === tabId ? { ...t, subgroup: subgroupName || undefined } : t));
  };

  const addSpace = (color) => {
    const targetColor = color || 'grey';
    if (spaces.length >= 4) return null; // cap including default
    if (spaces.some(s => (s.color || 'grey') === targetColor)) return null; // color must be unique
    const title = targetColor.charAt(0).toUpperCase() + targetColor.slice(1);
    const newSpace = {
      id: generateLocalId('space'),
      title,
      color: targetColor
    };
    setSpaces(prev => [...prev, newSpace]);
    return newSpace;
  };

  const removeSpace = (spaceId) => {
    if (spaceId === 'default') return; // Cannot delete default space

    setGroups(prevGroups => {
      const normalize = (title = '') => title.trim().toLowerCase();
      const titleToDefaultGroup = new Map(
        prevGroups
          .filter(g => (g.spaceId || 'default') === 'default')
          .map(g => [normalize(g.title || ''), g])
      );

      const mergeMap = new Map(); // sourceGroupId -> targetGroupId
      const nextGroups = [];

      prevGroups.forEach(g => {
        if (g.spaceId === spaceId) {
          const key = normalize(g.title || '');
          const target = titleToDefaultGroup.get(key);
          if (target) {
            mergeMap.set(g.id, target.id);
            // skip adding g (merged into target)
          } else {
            const moved = { ...g, spaceId: 'default' };
            nextGroups.push(moved);
            titleToDefaultGroup.set(key, moved);
          }
        } else {
          nextGroups.push(g);
        }
      });

      if (mergeMap.size > 0) {
        setTabs(prevTabs => prevTabs.map(t => mergeMap.has(t.groupId) ? { ...t, groupId: mergeMap.get(t.groupId) } : t));
      }

      return nextGroups;
    });

    setSpaces(prev => prev.filter(s => s.id !== spaceId));
    if (activeSpaceId === spaceId) setActiveSpaceId('default');
  };

  const updateSpace = (spaceId, updates) => {
    setSpaces(prev => prev.map(s => s.id === spaceId ? { ...s, ...updates } : s));
  };

  const moveGroupToSpace = (groupId, targetSpaceId) => {
    setGroups(prev => prev.map(g => g.id === groupId ? { ...g, spaceId: targetSpaceId } : g));
  };

  const updateGroup = (groupId, updates) => {
    setGroups(prev => prev.map(g => g.id === groupId ? { ...g, ...updates } : g));
  };

  const addGroupToSpace = (spaceId) => {
    const targetSpaceId = spaceId || 'default';
    const newGroup = {
      id: generateLocalId('group'),
      title: `Group ${groups.length + 1}`,
      color: 'grey',
      collapsed: false,
      isGhost: true,
      spaceId: targetSpaceId
    };
    setGroups(prev => [...prev, newGroup]);
    return newGroup;
  };


  return {
    tabs,
    activeTabId,
    switchToTab,
    closeTab,
    removeTab,
    clearGhosts,
    togglePin,
    groups,
    toggleGroupCollapse,
    getExportPayload,
    importData,
    setTabSubgroup,
    changeTabGroup,
    spaces,
    activeSpaceId,
    setActiveSpaceId,
    addSpace,
    removeSpace,
    updateSpace,
    moveGroupToSpace,
    updateGroup,
    addGroupToSpace
  };
};

export const useSpaces = () => {
  // This hook might be better integrated into useTabs or separate. 
  // Given the requirement to filter groups in useTabs, let's keep it inside useTabs for now 
  // or export it from there if we refactor.
  // For now, I will implement the logic inside useTabs to keep state centralized.
  return {};
};
