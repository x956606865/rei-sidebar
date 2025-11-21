import React, { useState, useRef, useEffect } from 'react';
import { Plus, Trash2, Edit2 } from 'lucide-react';
import ContextMenu from './ContextMenu';

const SpaceSelector = ({ spaces, activeSpaceId, onSwitchSpace, onAddSpace, onRemoveSpace, onUpdateSpace }) => {
    const [contextMenu, setContextMenu] = useState(null);
    const [editingSpaceId, setEditingSpaceId] = useState(null);
    const [editName, setEditName] = useState('');

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

    const handleContextMenu = (e, space) => {
        e.preventDefault();
        if (space.id === 'default') return;
        setContextMenu({
            x: e.clientX,
            y: e.clientY,
            space
        });
    };

    const [showColorPicker, setShowColorPicker] = useState(false);
    const pickerRef = useRef(null);

    const colors = Object.keys(colorClassMap);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (pickerRef.current && !pickerRef.current.contains(event.target)) {
                setShowColorPicker(false);
            }
        };

        if (showColorPicker) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showColorPicker]);

    const handleColorSelect = (color) => {
        onAddSpace(color);
        setShowColorPicker(false);
    };

    const handleRename = (space) => {
        const newName = prompt('Enter new space name:', space.title);
        if (newName) {
            onUpdateSpace(space.id, { title: newName });
        }
        setContextMenu(null);
    };

    const handleDelete = (space) => {
        if (confirm(`Are you sure you want to delete space "${space.title}"? Groups will be moved to Default.`)) {
            onRemoveSpace(space.id);
        }
        setContextMenu(null);
    };

    return (
        <div className="flex items-center gap-2">
            <div className="flex items-center gap-3 overflow-x-auto no-scrollbar px-2">
                {spaces.map(space => (
                    <div
                        key={space.id}
                        className="w-4 h-4 flex items-center justify-center cursor-pointer transition-all group relative"
                        onClick={() => onSwitchSpace(space.id)}
                        onContextMenu={(e) => handleContextMenu(e, space)}
                        title={space.title}
                    >
                        <div
                            className={`
                                rounded-full transition-all duration-200
                                ${activeSpaceId === space.id
                                    ? `w-2 h-2 ${colorClassMap[space.color] || 'bg-gray-500'}`
                                    : `w-1.5 h-1.5 bg-gray-300 dark:bg-gray-600 group-hover:w-2 group-hover:h-2 group-hover:${colorClassMap[space.color] || 'bg-gray-500'}`
                                }
                            `}
                        />
                        {/* Invisible hover target to make clicking easier */}
                        <div className="absolute inset-0 -m-1" />
                    </div>
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
                        {
                            label: 'Rename Space',
                            icon: <Edit2 size={14} />,
                            onClick: () => handleRename(contextMenu.space)
                        },
                        {
                            label: 'Delete Space',
                            icon: <Trash2 size={14} />,
                            onClick: () => handleDelete(contextMenu.space)
                        }
                    ]}
                />
            )}
        </div>
    );
};

export default SpaceSelector;
