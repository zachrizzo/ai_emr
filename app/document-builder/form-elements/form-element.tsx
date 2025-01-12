'use client'

import React from 'react';
import { Element } from '../types';

interface FormElementProps {
  element: Element;
  index: number;
  onUpdateElement: (id: string, updates: Partial<Element>) => void;
  onRemoveElement: (id: string) => void;
  onMoveElement: (dragIndex: number, hoverIndex: number) => void;
}

export const FormElement: React.FC<FormElementProps> = ({
  element,
  index,
  onUpdateElement,
  onRemoveElement,
  onMoveElement
}) => {
  return (
    <div className="p-4 border rounded mb-4">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-semibold">{element.label}</h3>
        <button
          onClick={() => onRemoveElement(element.id)}
          className="text-red-500 hover:text-red-700"
        >
          Remove
        </button>
      </div>
      <div className="space-y-2">
        <input
          type="text"
          value={element.label}
          onChange={(e) => onUpdateElement(element.id, { label: e.target.value })}
          className="w-full p-2 border rounded"
          placeholder="Label"
        />
        <textarea
          value={element.description}
          onChange={(e) => onUpdateElement(element.id, { description: e.target.value })}
          className="w-full p-2 border rounded"
          placeholder="Description"
        />
        {element.type === 'dropdown' || element.type === 'radio' ? (
          <div>
            <input
              type="text"
              value={element.options.join(', ')}
              onChange={(e) => onUpdateElement(element.id, { options: e.target.value.split(',').map(s => s.trim()) })}
              className="w-full p-2 border rounded"
              placeholder="Options (comma-separated)"
            />
          </div>
        ) : null}
      </div>
    </div>
  );
};

