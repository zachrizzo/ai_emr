import React from 'react';
import { Element } from '../types';

interface SidebarProps {
    onAddElements: (element: Omit<Element, "id">) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onAddElements }) => {
    return (
        <div className="w-64 bg-gray-100 p-4">
            <h2 className="text-lg font-semibold mb-4">Elements</h2>
            {/* Add your sidebar content here */}
        </div>
    );
};
