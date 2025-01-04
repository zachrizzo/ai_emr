// MultiSelect.tsx
import * as React from "react"
import { Check, X } from 'lucide-react'
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface Option {
  label: string
  value: string
}

interface MultiSelectProps {
  options?: Option[]
  selected?: string[]
  onChange: (selected: string[]) => void
  placeholder?: string
}

export function MultiSelect({
  options = [],
  selected = [],
  onChange,
  placeholder = "Select items..."
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false)

  const handleUnselect = React.useCallback((option: string) => {
    onChange(selected.filter((s) => s !== option))
  }, [onChange, selected])

  const handleSelect = React.useCallback((value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((s) => s !== value))
    } else {
      onChange([...selected, value])
    }
  }, [onChange, selected])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          <div className="flex gap-1 flex-wrap">
            {selected.length > 0 ? (
              selected.map((value) => {
                const option = options.find((opt) => opt.value === value)
                return (
                  <Badge variant="secondary" key={value} className="mr-1">
                    {option?.label ?? value}
                    <button
                      className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleUnselect(value)
                      }}
                    >
                      <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                    </button>
                  </Badge>
                )
              })
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
          </div>
          <X
            className={`h-4 w-4 shrink-0 opacity-50 ${selected.length === 0 ? 'hidden' : ''}`}
            onClick={(e) => {
              e.stopPropagation()
              onChange([])
            }}
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search..." className="h-9" />
          <CommandEmpty>No items found.</CommandEmpty>
          <CommandGroup className="max-h-64 overflow-auto">
            {options.map((option) => (
              <CommandItem
                key={option.value}
                onSelect={() => handleSelect(option.value)}
                className="flex items-center gap-2"
              >
                <div className={`flex h-4 w-4 items-center justify-center rounded-sm border ${selected.includes(option.value)
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-muted"
                  }`}>
                  <Check className={`h-3 w-3 ${selected.includes(option.value) ? "opacity-100" : "opacity-0"}`} />
                </div>
                <span>{option.label}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

