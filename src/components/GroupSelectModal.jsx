import React, { useEffect, useMemo, useState } from 'react';
import { FolderPlus, Inbox, X } from 'lucide-react';

const GroupSelectModal = ({
    isOpen,
    mode = 'add',
    groups = [],
    currentGroupId = -1,
    onConfirm,
    onClose
}) => {
    const [selectedId, setSelectedId] = useState(currentGroupId ?? -1);
    const [newGroup, setNewGroup] = useState('');

    useEffect(() => {
        if (isOpen) {
            setSelectedId(currentGroupId ?? -1);
            setNewGroup('');
        }
    }, [isOpen, currentGroupId]);

    const sortedGroups = useMemo(() => {
        return [...groups].sort((a, b) => (a.title || '').localeCompare(b.title || '', 'en'));
    }, [groups]);

    if (!isOpen) return null;

    const handleSubmit = () => {
        const payload = {
            targetGroupId: newGroup.trim() ? 'new' : selectedId,
            newGroupName: newGroup.trim()
        };
        onConfirm(payload);
    };

    const modeLabel = mode === 'move' ? 'Move to another group' : 'Add to group';

    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-arc-bg text-arc-text border border-black/10 dark:border-white/10 rounded-xl shadow-2xl w-[360px] max-w-[90vw] overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="flex items-center justify-between px-5 py-4 border-b border-black/5 dark:border-white/10">
                    <div className="flex items-center gap-2">
                        <FolderPlus size={16} className="text-arc-muted" />
                        <div>
                            <h3 className="text-sm font-semibold">{modeLabel}</h3>
                            <p className="text-xs text-arc-muted mt-0.5">Choose an existing group or create a new one</p>
                        </div>
                    </div>
                    <button
                        className="p-2 rounded-md text-arc-muted hover:text-arc-text hover:bg-arc-hover transition-colors"
                        onClick={onClose}
                        aria-label="Close group select modal"
                    >
                        <X size={16} />
                    </button>
                </div>

                <div className="p-5 space-y-3">
                    <div className="space-y-2">
                        <div className="text-xs text-arc-muted">Existing groups</div>
                        <div className="space-y-1 max-h-52 overflow-y-auto pr-1">
                            <label className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-arc-hover cursor-pointer">
                                <input
                                    type="radio"
                                    name="group-select"
                                    className="accent-blue-500"
                                    checked={selectedId === -1}
                                    onChange={() => setSelectedId(-1)}
                                />
                                <Inbox size={14} className="text-arc-muted" />
                                <span className="text-sm text-arc-text">Inbox (no group)</span>
                            </label>
                            {sortedGroups.map(g => (
                                <label key={g.id} className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-arc-hover cursor-pointer">
                                    <input
                                        type="radio"
                                        name="group-select"
                                        className="accent-blue-500"
                                        checked={selectedId === g.id}
                                        onChange={() => setSelectedId(g.id)}
                                    />
                                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--arc-muted)' }} />
                                    <span className="text-sm text-arc-text">{g.title || 'Untitled Group'}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs text-arc-muted">Or create a new group</label>
                        <input
                            value={newGroup}
                            onChange={(e) => setNewGroup(e.target.value)}
                            placeholder="Enter a new group name (leave blank to use selection above)"
                            className="w-full rounded-lg border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 text-sm text-arc-text placeholder:text-arc-muted focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                        />
                    </div>

                    <div className="flex gap-2 pt-1">
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-2 rounded-lg border border-black/10 dark:border-white/10 text-sm text-arc-text dark:text-white hover:bg-arc-hover transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            className="flex-1 px-4 py-2 rounded-lg bg-[#3b82f6]/80 hover:bg-[#3b82f6] text-white text-sm font-semibold transition-colors"
                        >
                            Confirm
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GroupSelectModal;
