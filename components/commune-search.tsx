"use client"

import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { type Commune, loadCommunes } from "@/lib/communes"
import Fuse from "fuse.js"
import debounce from "lodash/debounce"

interface CommuneSearchProps {
  onSelect: (commune: Commune) => void;
  selectedCommune?: Commune;
}

export function CommuneSearch({ onSelect, selectedCommune }: CommuneSearchProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const [searchResults, setSearchResults] = useState<Commune[]>([])
  const [fuse, setFuse] = useState<Fuse<Commune> | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [dropdownStyle, setDropdownStyle] = useState({
    width: 0,
    left: 0,
    top: 0
  })

  // Initialiser Fuse.js et charger les communes
  useEffect(() => {
    loadCommunes().then(communes => {
      setFuse(new Fuse(communes, {
        keys: ["commune", "departement", "codeDepartement"],
        threshold: 0.3,
        distance: 100,
        includeScore: true,
        minMatchCharLength: 2
      }))
    })
  }, [])

  // Initialiser le terme de recherche si une commune est sélectionnée
  useEffect(() => {
    if (selectedCommune) {
      setSearchTerm(selectedCommune.commune)
    }
  }, [selectedCommune])

  // Mise à jour de la position du dropdown
  const updateDropdownPosition = useCallback(() => {
    if (isOpen && inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect()
      setDropdownStyle({
        width: rect.width,
        left: rect.left,
        top: rect.bottom + window.scrollY + 4
      })
    }
  }, [isOpen])

  useEffect(() => {
    updateDropdownPosition()
    
    if (isOpen) {
      window.addEventListener('resize', updateDropdownPosition)
      window.addEventListener('scroll', updateDropdownPosition)
      
      return () => {
        window.removeEventListener('resize', updateDropdownPosition)
        window.removeEventListener('scroll', updateDropdownPosition)
      }
    }
  }, [isOpen, updateDropdownPosition])

  const debouncedSearch = useMemo(
    () => debounce((term: string) => {
      if (!term || !fuse) {
        setSearchResults([])
        return
      }
      const results = fuse
        .search(term)
        .map(result => result.item)
        .slice(0, 10)
      setSearchResults(results)
    }, 150),
    [fuse]
  )

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchTerm(value)
    setIsOpen(true)
    debouncedSearch(value)
  }, [debouncedSearch])

  const handleSelect = useCallback((commune: Commune) => {
    onSelect(commune)
    setSearchTerm(commune.commune)
    setIsOpen(false)
    setSearchResults([])
  }, [onSelect])

  useEffect(() => {
    return () => {
      debouncedSearch.cancel()
    }
  }, [debouncedSearch])

  return (
    <div className="space-y-2">
      <Label htmlFor="commune">Commune</Label>
      <div className="relative">
        <Input
          id="commune"
          type="text"
          placeholder="Rechercher une commune..."
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          className="h-12"
          ref={inputRef}
          suppressHydrationWarning
        />
        {isOpen && searchTerm && (
          <div 
            className="fixed z-[9999] bg-white border border-gray-200 rounded-lg shadow-lg max-h-[300px] overflow-auto" 
            style={{
              width: `${dropdownStyle.width}px`,
              left: `${dropdownStyle.left}px`,
              top: `${dropdownStyle.top}px`
            }}
          >
            {searchResults.length === 0 ? (
              <div className="p-2 text-sm text-gray-500">Aucune commune trouvée</div>
            ) : (
              <div className="py-1">
                {searchResults.map((commune) => (
                  <button
                    key={`${commune.codeDepartement}-${commune.commune}`}
                    onClick={() => handleSelect(commune)}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                  >
                    <div className="flex flex-col">
                      <span className="font-medium">{commune.commune}</span>
                      <span className="text-sm text-gray-500">
                        {commune.departement} ({commune.codeDepartement})
                      </span>
                      <span className="text-sm text-gray-500">
                        Zone PTZ: {commune.zonePTZ2024 || commune.zonePTZ2014}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
} 