export interface Element {
  id: string;
  type: 'staticText' | 'text' | 'checkbox' | 'dropdown' | 'radio';
  label: string;
  description: string;
  value: string;
  options: string[];
  layout: 'full' | 'half';
}
