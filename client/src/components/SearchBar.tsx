// src/components/SearchBar.tsx
import React from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search } from "lucide-react"

interface SearchBarProps {
  searchQuery: string
  setSearchQuery: (value: string) => void
  searchMode: "hanzi" | "pinyin" | "translation"
  setSearchMode: (mode: "hanzi" | "pinyin" | "translation") => void
}

export const SearchBar: React.FC<SearchBarProps> = ({
  searchQuery,
  setSearchQuery,
  searchMode,
  setSearchMode,
}) => {
  const modes = [
    { key: "hanzi", label: "Hanzi" },
    { key: "pinyin", label: "Pinyin" },
    { key: "translation", label: "English" },
  ] as const

  return (
    <div className="w-full max-w-2xl mx-auto flex items-center rounded-2xl border bg-background shadow-sm overflow-hidden">
      {/* Search Icon */}
      <div className="pl-3 pr-1 text-muted-foreground">
        <Search className="h-4 w-4" />
      </div>

      

      {/* Mode Selector */}
      <div className="flex border-l divide-x">
        {modes.map((mode) => (
          <Button
            key={mode.key}
            variant={searchMode === mode.key ? "default" : "ghost"}
            size="sm"
            className={`rounded-none font-medium text-sm transition-colors ${
              searchMode === mode.key
                ? ""
                : "hover:bg-muted hover:text-foreground"
            }`}
            onClick={() => setSearchMode(mode.key)}
          >
            {mode.label}
          </Button>
        ))}
      </div>

      {/* Search Input */}
      <Input
        id="search"
        placeholder={`Search by ${
          modes.find((m) => m.key === searchMode)?.label.toLowerCase() || ""
        }`}
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="border-none shadow-none focus-visible:ring-0 flex-1 text-sm"
      />
    </div>
  )
}