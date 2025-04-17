"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { type Commune, loadCommunes } from "@/lib/communes"
import Fuse from "fuse.js"
import debounce from "lodash/debounce"

interface CommuneSearchProps {
  onSelect: (commune: Commune) => void;
  selectedCommune?: Commune;
}

// Configuration optimisée de Fuse.js
const fuseOptions = {
  keys: ["commune", "departement", "codeDepartement"],
  threshold: 0.3,
  distance: 100,
  includeScore: true,
  minMatchCharLength: 2,
  useExtendedSearch: true,
  ignoreLocation: true,
  shouldSort: true,
  findAllMatches: false
}

export function CommuneSearch({ onSelect, selectedCommune }: CommuneSearchProps) {
  const [communes, setCommunes] = useState<Commune[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const [searchResults, setSearchResults] = useState<Commune[]>([])
  const [fuse, setFuse] = useState<Fuse<Commune> | null>(null)
  const [isClient, setIsClient] = useState(false)

  // Marquer le composant comme monté côté client
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Charger les communes et initialiser Fuse.js une seule fois
  useEffect(() => {
    if (!isClient) return

    loadCommunes().then(loadedCommunes => {
      setCommunes(loadedCommunes)
      setFuse(new Fuse(loadedCommunes, fuseOptions))
    })
  }, [isClient])

  // Debounce la recherche pour éviter trop de calculs
  const debouncedSearch = useMemo(
    () =>
      debounce((term: string) => {
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

  // Nettoyer le debounce lors du démontage
  useEffect(() => {
    return () => {
      debouncedSearch.cancel()
    }
  }, [debouncedSearch])

  // Ne rien rendre côté serveur
  if (!isClient) {
    return (
      <div className="space-y-2">
        <Label htmlFor="commune">Commune</Label>
        <Input
          id="commune"
          type="text"
          placeholder="Rechercher une commune..."
          className="h-12"
          disabled
        />
      </div>
    )
  }

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
        />
        {isOpen && searchTerm && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
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