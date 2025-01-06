// MultiSelect.tsx
import * as React from "react"
import { Check, ChevronsUpDown, X, Search } from 'lucide-react'
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"

interface Option {
  label: string
  value: string
}

interface MultiSelectProps {
  options?: Option[]
  selected?: string[]
  onChange: (selected: string[]) => void
  placeholder?: string
  className?: string
}

export function MultiSelect({
  options = [],
  selected = [],
  onChange,
  placeholder = "Select items...",
  className
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false)
  const [inputValue, setInputValue] = React.useState("")

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

  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(inputValue.toLowerCase())
  )

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between hover:bg-background h-auto", className)}
        >
          <div className="flex-1 flex items-center max-h-[80px] min-h-[36px] py-2">
            <div className="w-[90%] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 hover:scrollbar-thumb-gray-400 pr-2">
              <div className="flex flex-wrap gap-1">
                {selected.length > 0 ? (
                  selected.map((value) => {
                    const option = options.find((opt) => opt.value === value)
                    return (
                      <Badge
                        variant="secondary"
                        key={value}
                        className="mr-1 mb-1 px-1 py-0 shrink-0 whitespace-nowrap"
                      >
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
                  <span className="text-muted-foreground px-1">{placeholder}</span>
                )}
              </div>
            </div>
          </div>
          <div className="flex shrink-0 ml-2">
            {selected.length > 0 && (
              <X
                className="h-4 w-4 shrink-0 opacity-50 hover:opacity-100 mr-2"
                onClick={(e) => {
                  e.stopPropagation()
                  onChange([])
                }}
              />
            )}
            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-2" align="start">
        <div className="flex items-center border rounded-md px-3 mb-2">
          <Search className="h-4 w-4 text-muted-foreground mr-2" />
          <Input
            placeholder="Search..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 px-0"
          />
        </div>
        <div className="max-h-64 overflow-auto">
          {filteredOptions.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-6">
              No items found.
            </div>
          ) : (
            filteredOptions.map((option) => (
              <div
                key={option.value}
                className="flex items-center gap-2 px-2 py-1.5 cursor-pointer hover:bg-accent rounded-sm"
                onClick={() => handleSelect(option.value)}
              >
                <Checkbox
                  checked={selected.includes(option.value)}
                  onCheckedChange={() => handleSelect(option.value)}
                  className="cursor-pointer data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                />
                <span className="text-sm">{option.label}</span>
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

