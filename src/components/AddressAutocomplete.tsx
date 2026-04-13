import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MapPin, Search, X, Loader2 } from 'lucide-react';
import { geocode } from '../lib/naverApi';

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onPlaceSelected: (place: { name: string; lat: number; lng: number }) => void;
  placeholder?: string;
  icon?: React.ReactNode;
}

export const AddressAutocomplete: React.FC<AddressAutocompleteProps> = ({
  value,
  onChange,
  onPlaceSelected,
  placeholder = "주소 검색 (예: 대전 유성구 대학로 99)",
  icon = <MapPin className="absolute left-4 w-5 h-5 text-primary-container" />,
}) => {
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState<Array<{ address: string; lat: number; lng: number }>>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const searchAddress = useCallback(async (query: string) => {
    if (query.length < 2) {
      setResults([]);
      setShowResults(false);
      return;
    }

    setIsSearching(true);
    try {
      const result = await geocode(query);
      if (result) {
        setResults([result]);
        setShowResults(true);
      } else {
        setResults([]);
        setShowResults(true);
      }
    } catch {
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    onChange(val);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchAddress(val), 500);
  };

  const handleSelect = (result: { address: string; lat: number; lng: number }) => {
    onChange(result.address);
    onPlaceSelected({ name: result.address, lat: result.lat, lng: result.lng });
    setShowResults(false);
    setResults([]);
  };

  const handleSearch = () => {
    if (value.length >= 2) searchAddress(value);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    }
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <div className="relative flex items-center">
        {icon}
        <input
          type="text"
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => results.length > 0 && setShowResults(true)}
          placeholder={placeholder}
          className="w-full bg-surface-container-lowest border border-transparent rounded-xl pl-12 pr-20 py-4 text-on-surface font-semibold shadow-sm outline-none focus:border-primary-container transition-colors"
        />
        <div className="absolute right-3 flex items-center gap-1">
          {value && (
            <button
              onClick={() => { onChange(''); setResults([]); setShowResults(false); }}
              className="p-1.5 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={handleSearch}
            className="p-1.5 bg-primary-container/10 text-primary-container rounded-lg hover:bg-primary-container/20 transition-colors"
          >
            {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {showResults && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-lg border border-slate-100 z-50 overflow-hidden">
          {results.length > 0 ? (
            results.map((result, idx) => (
              <button
                key={idx}
                onClick={() => handleSelect(result)}
                className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors flex items-center gap-3"
              >
                <MapPin className="w-4 h-4 text-primary-container flex-shrink-0" />
                <span className="text-sm font-medium text-on-surface truncate">{result.address}</span>
              </button>
            ))
          ) : (
            <div className="px-4 py-3 text-sm text-on-surface-variant text-center">
              검색 결과가 없습니다. 더 구체적인 주소를 입력해주세요.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
