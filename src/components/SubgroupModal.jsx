import React, { useEffect, useMemo, useState } from 'react';
import { FolderPlus, X } from 'lucide-react';

const SubgroupModal = ({
    isOpen,
    groupTitle = '',
    existingSubgroups = [],
    initialValue = '',
    onConfirm,
    onClose
}) => {
    const [value, setValue] = useState(initialValue || '');

    useEffect(() => {
        if (isOpen) {
            setValue(initialValue || '');
        }
    }, [isOpen, initialValue]);

    const normalizedExisting = useMemo(() => {
        const seen = new Set();
        return existingSubgroups
            .map(name => (name || '').trim())
            .filter(name => {
                const lower = name.toLowerCase();
                if (!name || seen.has(lower)) return false;
                seen.add(lower);
                return true;
            });
    }, [existingSubgroups]);

    if (!isOpen) return null;

    const handleSubmit = () => {
        onConfirm(value.trim());
    };

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-arc-bg text-arc-text border border-black/10 dark:border-white/10 rounded-xl shadow-2xl w-[380px] max-w-[90vw] overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="flex items-center justify-between px-5 py-4 border-b border-black/5 dark:border-white/10">
                    <div className="flex items-center gap-2">
                        <FolderPlus size={16} className="text-arc-muted" />
                        <div>
                            <h3 className="text-sm font-semibold">添加到子组</h3>
                            <p className="text-xs text-arc-muted mt-0.5">所在分组：{groupTitle || '未命名分组'}</p>
                        </div>
                    </div>
                    <button
                        className="p-2 rounded-md text-arc-muted hover:text-arc-text hover:bg-arc-hover transition-colors"
                        onClick={onClose}
                        aria-label="Close subgroup modal"
                    >
                        <X size={16} />
                    </button>
                </div>

                <div className="p-5 space-y-4">
                    <div className="space-y-2">
                        <label className="text-xs text-arc-muted">子组名称</label>
                        <input
                            value={value}
                            onChange={(e) => setValue(e.target.value)}
                            placeholder="输入新子组名，或选择下方已有子组"
                            className="w-full rounded-lg border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 text-sm text-arc-text placeholder:text-arc-muted focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                        />
                    </div>

                    {normalizedExisting.length > 0 && (
                        <div className="space-y-2">
                            <div className="text-xs text-arc-muted">已存在的子组</div>
                            <div className="flex flex-wrap gap-2">
                                {normalizedExisting.map(name => (
                                    <button
                                        key={name}
                                        className="px-3 py-1 rounded-full bg-arc-hover hover:bg-arc-active text-xs text-arc-text dark:text-white transition-colors"
                                        onClick={() => setValue(name)}
                                    >
                                        {name}
                                    </button>
                                ))}
                                <button
                                    className="px-3 py-1 rounded-full bg-black/5 dark:bg-white/5 text-xs text-arc-muted hover:text-arc-text hover:bg-arc-hover transition-colors"
                                    onClick={() => setValue('')}
                                >
                                    清除子组
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="flex gap-2">
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-2 rounded-lg border border-black/10 dark:border-white/10 text-sm text-arc-text dark:text-white hover:bg-arc-hover transition-colors"
                        >
                            取消
                        </button>
                        <button
                            onClick={handleSubmit}
                            className="flex-1 px-4 py-2 rounded-lg bg-[#3b82f6]/80 hover:bg-[#3b82f6] text-white text-sm font-semibold transition-colors"
                        >
                            确定
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SubgroupModal;
