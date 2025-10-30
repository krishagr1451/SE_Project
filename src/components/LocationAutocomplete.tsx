'use client'

import { useState, useEffect, useRef } from 'react'

interface LocationAutocompleteProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  required?: boolean
  name?: string
}

interface Suggestion {
  display_name: string
  lat: string
  lon: string
}

export default function LocationAutocomplete({
  value,
  onChange,
  placeholder = 'Enter location',
  className = '',
  required = false,
  name = 'location',
}: LocationAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [loading, setLoading] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    const debounce = setTimeout(() => {
      if (value.length >= 2) {
        fetchSuggestions(value)
      } else {
        setSuggestions([])
        setShowSuggestions(false)
      }
    }, 300)

    return () => clearTimeout(debounce)
  }, [value])

  const fetchSuggestions = async (query: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/geocode?address=${encodeURIComponent(query)}&autocomplete=true`)
      const data = await response.json()
      
      if (Array.isArray(data)) {
        setSuggestions(data.slice(0, 5))
        setShowSuggestions(true)
      } else if (data.display_name) {
        setSuggestions([data])
        setShowSuggestions(true)
      }
    } catch (error) {
      console.error('Failed to fetch suggestions:', error)
      setSuggestions([])
    } finally {
      setLoading(false)
    }
  }

  const handleSelect = (suggestion: Suggestion) => {
    // Extract a cleaner location name
    const parts = suggestion.display_name.split(',')
    const cleanLocation = parts.slice(0, 3).join(',').trim()
    onChange(cleanLocation)
    setShowSuggestions(false)
    setSuggestions([])
  }

  return (
    <div ref={wrapperRef} className="relative">
      <input
        type="text"
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={className}
        required={required}
        autoComplete="off"
      />
      
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleSelect(suggestion)}
              className="w-full px-4 py-2 text-left hover:bg-indigo-50 focus:bg-indigo-50 focus:outline-none text-sm"
            >
              {suggestion.display_name}
            </button>
          ))}
        </div>
      )}
      
      {loading && value.length >= 2 && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <div className="animate-spin h-4 w-4 border-2 border-indigo-600 border-t-transparent rounded-full"></div>
        </div>
      )}
    </div>
  )
}
