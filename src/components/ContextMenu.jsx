import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

const ContextMenu = ({ x, y, onClose, options }) => {
    const menuRef = useRef(null);
    const [hoveredIndex, setHoveredIndex] = useState(null);
    const [pos, setPos] = useState({ x, y });
    const [menuSize, setMenuSize] = useState({ width: 0, height: 0 });

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

    useEffect(() => {
        setPos({ x, y });
    }, [x, y]);

    useLayoutEffect(() => {
        const menu = menuRef.current;
        if (!menu) return;
        const rect = menu.getBoundingClientRect();
        if (rect.width !== menuSize.width || rect.height !== menuSize.height) {
            setMenuSize({ width: rect.width, height: rect.height });
        }
        let nextX = pos.x;
        let nextY = pos.y;
        const padding = 8;
        if (nextX + rect.width > window.innerWidth - padding) {
            nextX = window.innerWidth - rect.width - padding;
        }
        if (nextY + rect.height > window.innerHeight - padding) {
            nextY = window.innerHeight - rect.height - padding;
        }
        if (nextX !== pos.x || nextY !== pos.y) {
            setPos({ x: nextX, y: nextY });
        }
    }, [pos.x, pos.y, options.length]);

    if (typeof document === 'undefined') return null;

    return createPortal(
        <div
            ref={menuRef}
            className="fixed z-[9999] bg-[#2B2D31] border border-white/10 rounded-lg shadow-xl py-1 min-w-[160px]"
            style={{ top: pos.y, left: pos.x }}
            onContextMenu={(e) => e.preventDefault()}
        >
            {options.map((option, index) => (
                <div
                    key={index}
                    className="relative"
                    onMouseEnter={() => setHoveredIndex(index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                >
                    <button
                        className={`w-full text-left px-3 py-1.5 text-sm flex items-center gap-2 justify-between group ${
                            option.disabled
                                ? 'text-gray-500 cursor-not-allowed'
                                : 'text-white/90 hover:bg-white/10 transition-colors'
                        }`}
                        disabled={option.disabled}
                        onClick={(e) => {
                            if (option.disabled) return;
                            if (option.subMenu) return;
                            option.onClick();
                            onClose();
                        }}
                    >
                        <div className="flex items-center gap-2">
                            {option.icon && <span className="w-4 h-4">{option.icon}</span>}
                            {option.label}
                        </div>
                        {option.subMenu && <span className={`text-gray-400 ${option.disabled ? '' : 'group-hover:text-white'}`}>▶</span>}
                    </button>

                    {option.subMenu && hoveredIndex === index && (() => {
                        const submenuWidth = 110;
                        const padding = 8;
                        const canMeasure = typeof window !== 'undefined';
                        const openRight = canMeasure
                            ? pos.x + (menuSize.width || 160) + submenuWidth + padding <= window.innerWidth
                            : true;
                        const submenuStyle = openRight
                            ? { left: '100%', marginLeft: '4px' }
                            : { right: '100%', marginRight: '4px' };
                        return (
                            <div
                                className="absolute top-0 bg-[#2B2D31] border border-white/10 rounded-lg shadow-xl py-1 min-w-[96px]"
                                style={submenuStyle}
                            >
                                {option.subMenu.map((subOption, subIndex) => (
                                    <button
                                        key={subIndex}
                                        className="w-full text-left px-2 py-1.5 text-sm text-white/90 hover:bg-white/10 transition-colors flex items-center gap-2"
                                        onClick={() => {
                                            subOption.onClick();
                                            onClose();
                                        }}
                                    >
                                        {subOption.label}
                                    </button>
                                ))}
                            </div>
                        );
                    })()}
                </div>
            ))}
        </div>,
        document.body
    );
};

export default ContextMenu;
