import React from 'react';
import { Upload, Download, X } from 'lucide-react';

const SettingsModal = ({
    isOpen,
    onClose,
    onImportClick,
    onExportClick,
    isBusy = false,
    message = '',
    error = ''
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-[#1f2126] border border-white/10 rounded-xl shadow-2xl w-[380px] max-w-[90vw] overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
                    <div>
                        <h3 className="text-lg font-semibold text-white">设置</h3>
                        <p className="text-xs text-arc-muted mt-1">导入或导出当前分组与标签数据</p>
                    </div>
                    <button
                        className="p-2 rounded-md text-arc-muted hover:text-white hover:bg-white/5 transition-colors"
                        onClick={onClose}
                        aria-label="Close settings"
                    >
                        <X size={16} />
                    </button>
                </div>

                <div className="p-5 space-y-3">
                    <button
                        onClick={onExportClick}
                        disabled={isBusy}
                        className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-white/5 hover:bg-white/10 text-white text-sm font-medium border border-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Download size={16} />
                        导出当前数据
                    </button>

                    <button
                        onClick={onImportClick}
                        disabled={isBusy}
                        className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-[#3b82f6]/20 hover:bg-[#3b82f6]/30 text-white text-sm font-medium border border-[#3b82f6]/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Upload size={16} />
                        导入数据文件
                    </button>

                    {(message || error) && (
                        <div className={`text-xs leading-relaxed rounded-lg px-3 py-2 border ${error ? 'border-red-500/30 bg-red-500/10 text-red-100' : 'border-white/10 bg-white/5 text-arc-muted'}`}>
                            {error || message}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;
