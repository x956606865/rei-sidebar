import { useState, useEffect, useRef } from 'react';

export const useTabs = () => {
  const [tabs, setTabs] = useState([]);
  const [activeTabId, setActiveTabId] = useState(null);
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

      // Load persisted tabs
      const storage = await chrome.storage.local.get(['savedTabs']);
      let savedTabs = storage.savedTabs || [];

      // Get current actual tabs
      const currentTabs = await chrome.tabs.query({ currentWindow: true });

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

      setTabs(newTabsState);

      const activeTab = currentTabs.find(t => t.active);
      if (activeTab) setActiveTabId(activeTab.id);
    };

    initTabs();
  }, []);

  // Save tabs to storage whenever they change
  useEffect(() => {
    if (typeof chrome !== 'undefined' && chrome.storage && tabs.length > 0) {
      const tabsToSave = tabs.map(t => ({
        id: t.id,
        title: t.title,
        url: t.url,
        favIconUrl: t.favIconUrl,
        isGhost: t.isGhost
      }));
      chrome.storage.local.set({ savedTabs: tabsToSave });
    }
  }, [tabs]);

  // Listen for tab updates
  useEffect(() => {
    if (typeof chrome === 'undefined' || !chrome.tabs) return;

    const handleCreated = (tab) => {
      if (isInternalUpdate.current) return;
      setTabs(prev => [...prev, { ...tab, isGhost: false }]);
    };

    const handleUpdated = (tabId, changeInfo, tab) => {
      setTabs(prev => prev.map(t => t.id === tabId ? { ...t, ...tab, isGhost: false } : t));
      if (tab.active) setActiveTabId(tabId);
    };

    const handleRemoved = (tabId) => {
      if (isInternalUpdate.current) return;
      setTabs(prev => prev.map(t => t.id === tabId ? { ...t, isGhost: true } : t));
    };

    const handleActivated = (activeInfo) => {
      setActiveTabId(activeInfo.tabId);
    };

    chrome.tabs.onCreated.addListener(handleCreated);
    chrome.tabs.onUpdated.addListener(handleUpdated);
    chrome.tabs.onRemoved.addListener(handleRemoved);
    chrome.tabs.onActivated.addListener(handleActivated);

    return () => {
      chrome.tabs.onCreated.removeListener(handleCreated);
      chrome.tabs.onUpdated.removeListener(handleUpdated);
      chrome.tabs.onRemoved.removeListener(handleRemoved);
      chrome.tabs.onActivated.removeListener(handleActivated);
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
      setTabs(prev => prev.filter(t => t.id !== tabId));
      return;
    }

    // If it's a ghost tab, remove it completely from list
    const tab = tabs.find(t => t.id === tabId);
    if (tab?.isGhost) {
      setTabs(prev => prev.filter(t => t.id !== tabId));
    } else {
      // If it's a real tab, close it in browser (listener will mark it as ghost)
      await chrome.tabs.remove(tabId);
    }
  };

  const clearGhosts = () => {
    setTabs(prev => prev.filter(t => !t.isGhost));
  };

  return {
    tabs,
    activeTabId,
    switchToTab,
    closeTab,
    clearGhosts
  };
};
