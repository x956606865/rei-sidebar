import React, { useEffect, useState } from 'react';
import { X, Palette } from 'lucide-react';

const GroupEditModal = ({
    isOpen,
    initialName,
    initialColor,
    colors = [],
    colorClassMap = {},
    onConfirm,
    onClose
}) => {
    const [name, setName] = useState(initialName || '');
    const [color, setColor] = useState(initialColor || 'grey');

    useEffect(() => {
        if (isOpen) {
            setName(initialName || '');
            setColor(initialColor || 'grey');
        }
    }, [isOpen, initialName, initialColor]);

    if (!isOpen) return null;

    const handleSubmit = () => {
        onConfirm?.({
            title: name.trim() || 'Untitled Group',
            color
        });
    };

    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-arc-bg text-arc-text border border-black/10 dark:border-white/10 rounded-xl shadow-2xl w-[360px] max-w-[90vw] overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="flex items-center justify-between px-5 py-4 border-b border-black/5 dark:border-white/10">
                    <div className="flex items-center gap-2">
                        <Palette size={16} className="text-arc-muted" />
                        <div>
                            <h3 className="text-sm font-semibold">编辑分组</h3>
                            <p className="text-xs text-arc-muted mt-0.5">修改名称与颜色</p>
                        </div>
                    </div>
                    <button
                        className="p-2 rounded-md text-arc-muted hover:text-arc-text hover:bg-arc-hover transition-colors"
                        onClick={onClose}
                        aria-label="Close edit group modal"
                    >
                        <X size={16} />
                    </button>
                </div>

                <div className="p-5 space-y-4">
                    <div className="space-y-2">
                        <label className="text-xs text-arc-muted">名称</label>
                        <input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="输入分组名称"
                            className="w-full rounded-lg border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 text-sm text-arc-text placeholder:text-arc-muted focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs text-arc-muted">颜色</label>
                        <div className="grid grid-cols-6 gap-2">
                            {colors.map(c => (
                                <button
                                    key={c}
                                    className={`w-8 h-8 rounded-full ${colorClassMap[c] || 'bg-gray-500'} flex items-center justify-center ring-1 ring-black/5 dark:ring-white/10 transition-transform hover:scale-105 ${
                                        color === c ? 'outline outline-[3px] outline-white dark:outline-blue-400 shadow-lg' : ''
                                    }`}
                                    onClick={() => setColor(c)}
                                    title={c}
                                />
                            ))}
                        </div>
                    </div>

                    <div className="flex gap-2 pt-1">
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

export default GroupEditModal;
