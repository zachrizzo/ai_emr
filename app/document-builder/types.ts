export type ElementType = 'text' | 'textarea' | 'number' | 'date' | 'select' | 'checkbox' | 'radio' | 'table' | 'staticText' | 'image' | 'signature' | 'button'

export interface TableColumn {
  id: string
  header: string
  type: 'text' | 'number' | 'date' | 'select' | 'staticText'
  options?: string[]
  staticValue?: string
}

export interface TableConfig {
  columns: TableColumn[]
  minRows?: number
  maxRows?: number
}

export interface ValidationRules {
  required?: boolean
  min?: number
  max?: number
  pattern?: string
  options?: string[]
  maxSize?: number // in MB
  acceptedTypes?: string[]
}

export interface DateConfig {
  allowPastDates?: boolean
  allowFutureDates?: boolean
  minDate?: string
  maxDate?: string
}

export interface Element {
  id: string
  type: ElementType
  label: string
  description?: string
  placeholder?: string
  value?: string
  required?: boolean
  layout?: 'full' | 'half'
  validation?: ValidationRules
  options?: string[]
  tableConfig?: TableConfig
  dateConfig?: DateConfig
  imageConfig?: {
    maxSize?: number // in MB
    acceptedTypes?: string[]
  }
  signatureConfig?: {
    penColor?: string
    backgroundColor?: string
    width?: number
    height?: number
  }
  buttonConfig?: {
    variant?: 'default' | 'outline' | 'secondary' | 'destructive' | 'ghost' | 'link'
    action?: 'submit' | 'navigate'
    url?: string
    target?: '_blank' | '_self'
    size?: 'default' | 'sm' | 'lg'
  }
}
