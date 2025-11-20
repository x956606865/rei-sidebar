import React from 'react';

const ConfirmationModal = ({ isOpen, title, message, onConfirm, onCancel, confirmLabel = 'Confirm', cancelLabel = 'Cancel' }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-[#2B2D31] border border-white/10 rounded-xl shadow-2xl w-[320px] overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="p-5">
                    <h3 className="text-lg font-medium text-white mb-2">{title}</h3>
                    <p className="text-sm text-arc-muted leading-relaxed">{message}</p>
                </div>
                <div className="flex border-t border-white/10">
                    <button
                        onClick={onCancel}
                        className="flex-1 px-4 py-3 text-sm font-medium text-white hover:bg-white/5 transition-colors"
                    >
                        {cancelLabel}
                    </button>
                    <div className="w-px bg-white/10" />
                    <button
                        onClick={onConfirm}
                        className="flex-1 px-4 py-3 text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;
