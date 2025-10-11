import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Search, User, X } from 'lucide-react';
import { useFuzzySearch } from '@/lib/hooks/useFuzzySearch';
import { highlightMatch } from '@/lib/highlightMatch';
import type { Paziente } from '@shared/schema';

interface AutocompleteSearchProps {
  pazienti: Paziente[];
  onSelect?: (paziente: Paziente) => void;
}

export default function AutocompleteSearch({ 
  pazienti,
  onSelect 
}: AutocompleteSearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [, setLocation] = useLocation();

  const { query, setQuery, results, hasResults } = useFuzzySearch({
    data: pazienti,
    keys: ['nome', 'cognome', 'codiceFiscale', 'telefono', 'citta'],
    threshold: 0.3,
    limit: 8
  });

  useEffect(() => {
    setIsOpen(query.length >= 2 && hasResults);
    setSelectedIndex(0);
  }, [query, hasResults]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        !inputRef.current?.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < results.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : prev);
        break;
      case 'Enter':
        e.preventDefault();
        if (results[selectedIndex]) {
          handleSelect(results[selectedIndex].item);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        inputRef.current?.blur();
        break;
    }
  };

  const handleSelect = (paziente: Paziente) => {
    if (onSelect) {
      onSelect(paziente);
    } else {
      setLocation(`/dashboard/cartella-clinica?pazienteId=${paziente.id}`);
    }
    setQuery('');
    setIsOpen(false);
    inputRef.current?.blur();
  };

  const clearSearch = () => {
    setQuery('');
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const getHighlightedField = (result: any, fieldName: string) => {
    const match = result.matches?.find((m: any) => m.key === fieldName);
    if (match && match.indices) {
      return highlightMatch(result.item[fieldName], match.indices);
    }
    return result.item[fieldName] || '';
  };

  return (
    <div className="relative w-full">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => query.length >= 2 && hasResults && setIsOpen(true)}
          placeholder="Cerca paziente per nome, CF, telefono, città..."
          className="w-full pl-10 pr-10 py-3 border border-input bg-background rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-base"
          data-testid="input-fuzzy-search"
        />
        {query && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground hover-elevate active-elevate-2"
            data-testid="button-clear-search"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-2 bg-card rounded-lg shadow-xl border border-border max-h-96 overflow-y-auto"
          data-testid="dropdown-search-results"
        >
          {results.length === 0 ? (
            <div className="px-4 py-8 text-center text-muted-foreground">
              <Search className="w-8 h-8 mx-auto mb-2" />
              <p>Nessun paziente trovato</p>
              <p className="text-sm mt-1">Prova con un altro termine</p>
            </div>
          ) : (
            <ul className="py-2">
              {results.map((result, index) => (
                <li key={result.item.id}>
                  <button
                    onClick={() => handleSelect(result.item)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`w-full px-4 py-3 text-left hover-elevate transition-colors ${
                      index === selectedIndex ? 'bg-accent' : ''
                    }`}
                    data-testid={`button-search-result-${result.item.id}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-1">
                        <User className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-foreground">
                          {getHighlightedField(result, 'cognome')}{' '}
                          {getHighlightedField(result, 'nome')}
                        </div>
                        <div className="text-sm text-muted-foreground font-mono">
                          {getHighlightedField(result, 'codiceFiscale')}
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                          <span>{getHighlightedField(result, 'telefono')}</span>
                          <span>•</span>
                          <span>{getHighlightedField(result, 'citta')}</span>
                        </div>
                        {result.score !== undefined && (
                          <div className="text-xs text-muted-foreground mt-1">
                            Rilevanza: {((1 - result.score) * 100).toFixed(0)}%
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
          
          {results.length > 0 && (
            <div className="px-4 py-2 bg-muted border-t border-border text-xs text-muted-foreground flex items-center justify-between">
              <span>Usa ↑ ↓ per navigare, Enter per selezionare</span>
              <span data-testid="text-results-count">
                {results.length} risultat{results.length !== 1 ? 'i' : 'o'}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
