import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Trash2, Palette } from 'lucide-react';
import ContextMenu from './ContextMenu';

const SpaceSelector = ({ spaces, activeSpaceId, onSwitchSpace, onAddSpace, onRemoveSpace, onUpdateSpace }) => {
    const [contextMenu, setContextMenu] = useState(null);
    const [colorMenu, setColorMenu] = useState(null);

    const colorClassMap = {
        grey: 'bg-gray-500',
        blue: 'bg-blue-500',
        red: 'bg-red-500',
        yellow: 'bg-yellow-500',
        green: 'bg-green-500',
        pink: 'bg-pink-500',
        purple: 'bg-purple-500',
        cyan: 'bg-cyan-500',
        orange: 'bg-orange-500',
    };

    const openContextMenu = (event, space) => {
        console.log('[SpaceSelector] openContextMenu', {
            spaceId: space.id,
            spaceTitle: space.title,
            clientX: event.clientX,
            clientY: event.clientY,
            target: event.target?.className
        });
        const rect = event.currentTarget.getBoundingClientRect();
        const menuWidth = 180;
        const menuHeight = 110;
        const padding = 8;
        const x = Math.min(rect.left, window.innerWidth - menuWidth - padding);
        const y = Math.min(rect.bottom + 4, window.innerHeight - menuHeight - padding);
        setContextMenu({ x, y, space });
    };

    const handleContextMenu = (e, space) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('[SpaceSelector] onContextMenu fired', {
            button: e.button,
            type: e.type,
            spaceId: space.id
        });
        openContextMenu(e, space);
    };

    const handleRightMouseDown = (e, space) => {
        if (e.button !== 2) return;
        e.preventDefault();
        e.stopPropagation();
        console.log('[SpaceSelector] onMouseDown right button', {
            button: e.button,
            type: e.type,
            spaceId: space.id
        });
        openContextMenu(e, space);
    };

    const [showColorPicker, setShowColorPicker] = useState(false);
    const pickerRef = useRef(null);
    const colorMenuRef = useRef(null);

    const colors = Object.keys(colorClassMap);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (pickerRef.current && !pickerRef.current.contains(event.target)) setShowColorPicker(false);
            if (colorMenuRef.current && !colorMenuRef.current.contains(event.target)) setColorMenu(null);
        };

        if (showColorPicker || colorMenu) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showColorPicker, colorMenu]);

    useEffect(() => {
        if (contextMenu) {
            console.log('[SpaceSelector] contextMenu set', contextMenu);
        }
    }, [contextMenu]);

    useEffect(() => {
        if (colorMenu) {
            console.log('[SpaceSelector] colorMenu set', colorMenu);
        }
    }, [colorMenu]);

    const handleColorSelect = (color) => {
        const created = onAddSpace(color);
        if (!created) {
            alert('最多支持 4 个 Space（含默认），请先删除或重用已有 Space。');
        }
        setShowColorPicker(false);
    };

    const handleDelete = (space) => {
        if (confirm(`Are you sure you want to delete space "${space.title}"? Groups will be moved to Default.`)) {
            onRemoveSpace(space.id);
        }
        setContextMenu(null);
    };

    const handleChangeColor = (space, pos) => {
        setColorMenu({
            x: pos?.x ?? 0,
            y: pos?.y ?? 0,
            space
        });
        setContextMenu(null);
    };

    return (
        <div className="flex items-center gap-2">
            <div className="flex items-center gap-3 overflow-x-auto no-scrollbar px-2">
                {spaces.map(space => (
                    <button
                        key={space.id}
                        type="button"
                        className="w-4 h-4 flex items-center justify-center cursor-pointer transition-all group relative bg-transparent border-0 appearance-none outline-none focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0 active:outline-none"
                        onClick={() => onSwitchSpace(space.id)}
                        onContextMenu={(e) => handleContextMenu(e, space)}
                        onMouseDown={(e) => handleRightMouseDown(e, space)}
                        title={space.title}
                    >
                        <span
                            className={`
                                inline-block rounded-full transition-all duration-200
                                ${activeSpaceId === space.id
                                    ? `w-2 h-2 ${colorClassMap[space.color] || 'bg-gray-500'}`
                                    : `w-1.5 h-1.5 bg-gray-300 dark:bg-gray-600 group-hover:w-2 group-hover:h-2 group-hover:${colorClassMap[space.color] || 'bg-gray-500'}`
                                }
                            `}
                        />
                        {/* hit area */}
                        <span className="absolute inset-0 -m-1" />
                    </button>
                ))}
            </div>

            <div className="relative" ref={pickerRef}>
                <button
                    className={`w-8 h-8 rounded-full flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 text-arc-muted hover:text-arc-text dark:hover:text-white transition-colors ${showColorPicker ? 'bg-black/5 dark:bg-white/10 text-arc-text dark:text-white' : ''}`}
                    onClick={() => setShowColorPicker(!showColorPicker)}
                    title="Add Space"
                >
                    <Plus size={16} />
                </button>

                {showColorPicker && (
                    <div className="absolute bottom-full left-0 mb-2 p-2 bg-white dark:bg-[#2B2D31] border border-black/5 dark:border-white/10 rounded-lg shadow-xl grid grid-cols-3 gap-2 min-w-[100px] z-50">
                        {colors.map(color => (
                            <button
                                key={color}
                                className={`w-6 h-6 rounded-full ${colorClassMap[color]} hover:scale-110 transition-transform ring-1 ring-black/5 dark:ring-white/10`}
                                onClick={() => handleColorSelect(color)}
                                title={color}
                            />
                        ))}
                    </div>
                )}
            </div>

            {contextMenu && (
                <ContextMenu
                    x={contextMenu.x}
                    y={contextMenu.y}
                    onClose={() => setContextMenu(null)}
                    options={[
                        ...(contextMenu.space.id !== 'default' ? [{
                            label: 'Delete Space',
                            icon: <Trash2 size={14} />,
                            onClick: () => handleDelete(contextMenu.space)
                        }] : [{
                            label: 'Default space cannot be deleted',
                            icon: <Trash2 size={14} />,
                            disabled: true,
                            onClick: () => {}
                        }]),
                        {
                            label: 'Change Color',
                            icon: <Palette size={14} />,
                            onClick: () => handleChangeColor(contextMenu.space, { x: contextMenu.x, y: contextMenu.y })
                        }
                    ]}
                />
            )}

            {typeof document !== 'undefined' && colorMenu && createPortal(
                <div
                    className="fixed z-[10000] p-2 bg-white dark:bg-[#2B2D31] border border-black/5 dark:border-white/10 rounded-lg shadow-xl grid grid-cols-3 gap-2 min-w-[110px]"
                    style={{
                        top: Math.min(colorMenu.y, window.innerHeight - 150),
                        left: Math.min(colorMenu.x, window.innerWidth - 140)
                    }}
                    ref={colorMenuRef}
                >
                    {colors.map(color => (
                        <button
                            key={color}
                            className={`w-6 h-6 rounded-full ${colorClassMap[color]} hover:scale-110 transition-transform ring-1 ring-black/5 dark:ring-white/10`}
                            onClick={() => {
                                console.log('[SpaceSelector] color picked', color);
                                onUpdateSpace(colorMenu.space.id, { color });
                                setColorMenu(null);
                            }}
                            title={color}
                        />
                    ))}
                    <button
                        className="col-span-3 mt-1 w-full text-xs text-arc-muted hover:text-arc-text text-center"
                        onClick={() => setColorMenu(null)}
                    >
                        取消
                    </button>
                </div>,
                document.body
            )}
        </div>
    );
};

export default SpaceSelector;
