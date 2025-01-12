'use client'

import React from 'react';
import { useDrop } from 'react-dnd';
import { useDocumentBuilder } from './document-builder-context';
import { FormElement } from './form-elements/form-element';
import { Element } from './types';

interface DropZoneProps {
  onUpdateElement: (id: string, updates: Partial<Element>) => void;
  onRemoveElement: (id: string) => void;
  onMoveElement: (dragIndex: number, hoverIndex: number) => void;
}

export function DropZone({ onUpdateElement, onRemoveElement, onMoveElement }: DropZoneProps) {
  const { currentTemplate, addElement } = useDocumentBuilder();

  const [{ isOver }, dropRef] = useDrop({
    accept: 'element',
    drop: (item: { type: string; label: string }, monitor) => {
      if (!monitor.didDrop()) {
        addElement({
          type: item.type as 'staticText' | 'text' | 'checkbox' | 'dropdown' | 'radio',
          label: item.label,
          description: '',
          value: '',
          options: [],
          layout: 'full'
        });
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  return (
    <div
      ref={dropRef as unknown as React.RefObject<HTMLDivElement>}
      className={`min-h-[200px] p-4 border-2 border-dashed ${isOver ? 'border-blue-500' : 'border-gray-300'}`}
    >
      {currentTemplate?.content?.map((element, index) => (
        <FormElement
          key={element.id}
          element={element}
          index={index}
          onUpdateElement={onUpdateElement}
          onRemoveElement={onRemoveElement}
          onMoveElement={onMoveElement}
        />
      ))}
      {(!currentTemplate?.content || currentTemplate.content.length === 0) && (
        <p className="text-center text-gray-500">
          Drag and drop elements here or use the sidebar to add elements
        </p>
      )}
    </div>
  );
}

