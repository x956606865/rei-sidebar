import React, { useEffect, useRef, useState } from 'react';

const ContextMenu = ({ x, y, onClose, options }) => {
    const menuRef = useRef(null);
    const [hoveredIndex, setHoveredIndex] = useState(null);

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
                <div
                    key={index}
                    className="relative"
                    onMouseEnter={() => setHoveredIndex(index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                >
                    <button
                        className="w-full text-left px-3 py-1.5 text-sm text-white hover:bg-blue-500 transition-colors flex items-center gap-2 justify-between group"
                        onClick={(e) => {
                            if (option.subMenu) return;
                            option.onClick();
                            onClose();
                        }}
                    >
                        <div className="flex items-center gap-2">
                            {option.icon && <span className="w-4 h-4">{option.icon}</span>}
                            {option.label}
                        </div>
                        {option.subMenu && <span className="text-gray-400 group-hover:text-white">▶</span>}
                    </button>

                    {option.subMenu && hoveredIndex === index && (
                        <div className="absolute left-full top-0 bg-[#2B2D31] border border-white/10 rounded-lg shadow-xl py-1 min-w-[160px] ml-1">
                            {option.subMenu.map((subOption, subIndex) => (
                                <button
                                    key={subIndex}
                                    className="w-full text-left px-3 py-1.5 text-sm text-white hover:bg-blue-500 transition-colors"
                                    onClick={() => {
                                        subOption.onClick();
                                        onClose();
                                    }}
                                >
                                    {subOption.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

export default ContextMenu;
