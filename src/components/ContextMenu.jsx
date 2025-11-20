import React, { useEffect, useRef } from 'react';

const ContextMenu = ({ x, y, onClose, options }) => {
    const menuRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                onClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [onClose]);

    return (
        <div
            ref={menuRef}
            className="fixed z-50 bg-[#2B2D31] border border-white/10 rounded-lg shadow-xl py-1 min-w-[160px]"
            style={{ top: y, left: x }}
        >
            {options.map((option, index) => (
                <button
                    key={index}
                    className="w-full text-left px-3 py-1.5 text-sm text-white hover:bg-blue-500 transition-colors flex items-center gap-2"
                    onClick={() => {
                        option.onClick();
                        onClose();
                    }}
                >
                    {option.icon && <span className="w-4 h-4">{option.icon}</span>}
                    {option.label}
                </button>
            ))}
        </div>
    );
};

export default ContextMenu;
