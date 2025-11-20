// Background service worker
console.log('Background service worker started');

// Ensure clicking the extension icon opens the side panel
const enableSidePanelBehavior = () => {
    if (chrome.sidePanel && chrome.sidePanel.setPanelBehavior) {
        chrome.sidePanel
            .setPanelBehavior({ openPanelOnActionClick: true })
            .catch((error) => console.error('Failed to set panel behavior:', error));
    } else {
        console.warn('chrome.sidePanel API not available');
    }
};

enableSidePanelBehavior();

chrome.runtime.onInstalled.addListener(() => {
    enableSidePanelBehavior();
});

chrome.action.onClicked.addListener(async (tab) => {
    if (chrome.sidePanel && chrome.sidePanel.open) {
        try {
            await chrome.sidePanel.open({ windowId: tab.windowId });
        } catch (error) {
            console.error('Failed to open side panel on action click:', error);
        }
    }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'GET_GROUPS') {
        if (chrome.tabGroups) {
            chrome.tabGroups.query({ windowId: chrome.windows.WINDOW_ID_CURRENT })
                .then(groups => sendResponse({ groups }))
                .catch(error => sendResponse({ error: error.message }));
            return true; // Keep channel open for async response
        } else {
            sendResponse({ error: 'tabGroups API not available in background' });
        }
    }
});
