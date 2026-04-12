import React, { useRef, useEffect } from 'react';
import { useJsApiLoader } from '@react-google-maps/api';
import { MapPin } from 'lucide-react';

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onPlaceSelected: (place: { name: string; lat: number; lng: number }) => void;
  placeholder?: string;
  icon?: React.ReactNode;
}

const libraries: ("places")[] = ["places"];

export const AddressAutocomplete: React.FC<AddressAutocompleteProps> = ({
  value,
  onChange,
  onPlaceSelected,
  placeholder = "주소 검색",
  icon = <MapPin className="absolute left-4 w-5 h-5 text-primary-container" />
}) => {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
    libraries
  });

  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  useEffect(() => {
    if (!isLoaded || !inputRef.current) return;

    autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
      componentRestrictions: { country: 'kr' },
      fields: ['formatted_address', 'geometry', 'name']
    });

    autocompleteRef.current.addListener('place_changed', () => {
      const place = autocompleteRef.current?.getPlace();
      if (place && place.geometry && place.geometry.location) {
        const name = place.name || place.formatted_address || '';
        onChange(name);
        onPlaceSelected({
          name,
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng()
        });
      }
    });

    return () => {
      if (autocompleteRef.current) {
        google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, [isLoaded, onPlaceSelected, onChange]);

  return (
    <div className="relative flex items-center">
      {icon}
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-surface-container-lowest border border-transparent rounded-xl pl-12 pr-4 py-4 text-on-surface font-semibold shadow-sm outline-none focus:border-primary-container transition-colors"
      />
    </div>
  );
};
