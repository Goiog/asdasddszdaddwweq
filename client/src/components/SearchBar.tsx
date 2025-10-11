// src/components/SearchBar.tsx
import React from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

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
  return (
    <div className="space-y-2">
      {/* Buttons */}
      <div className="flex gap-2 mb-1">
        {(["hanzi", "pinyin", "translation"] as const).map((mode) => (
          <Button
            key={mode}
            size="sm"
            variant={searchMode === mode ? "default" : "outline"}
            onClick={() => setSearchMode(mode)}
          >
            {mode.charAt(0).toUpperCase() + mode.slice(1)}
          </Button>
        ))}
      </div>

      {/* Search input */}
      <Input
        id="search"
        placeholder={`Search by ${searchMode}`}
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="pl-10"
      />
    </div>
  )
}
