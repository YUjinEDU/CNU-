import React, { useState } from 'react';
import { Building2, Check } from 'lucide-react';
import { CAMPUS_ZONES } from '../data/campusBuildings';

interface CampusBuildingSelectorProps {
  value: string;
  onBuildingSelected: (building: { name: string; lat: number; lng: number }) => void;
  placeholder?: string;
}

export const CampusBuildingSelector: React.FC<CampusBuildingSelectorProps> = ({
  value,
  onBuildingSelected,
  placeholder = '캠퍼스 권역을 선택해주세요',
}) => {
  const handleSelect = (zone: typeof CAMPUS_ZONES[number]) => {
    onBuildingSelected({
      name: `충남대학교 ${zone.name}`,
      lat: zone.coord.lat,
      lng: zone.coord.lng,
    });
  };

  if (!value) {
    return (
      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-3">
          {CAMPUS_ZONES.map(zone => (
            <button
              key={zone.id}
              type="button"
              onClick={() => handleSelect(zone)}
              className="flex flex-col items-start p-4 rounded-xl bg-surface-container-lowest shadow-sm hover:bg-primary-container/10 transition-all text-left"
            >
              <span className="text-2xl mb-2">{zone.icon}</span>
              <span className="font-bold text-sm text-on-surface">{zone.name}</span>
              <span className="text-[10px] text-on-surface-variant mt-0.5">{zone.description}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => onBuildingSelected({ name: '', lat: 0, lng: 0 })}
        className="w-full bg-blue-50 border border-primary-container/20 rounded-xl px-4 py-4 text-left shadow-sm flex items-center gap-3"
      >
        <Building2 className="w-5 h-5 text-primary-container flex-shrink-0" />
        <span className="flex-1 font-semibold text-primary-container truncate">{value}</span>
        <Check className="w-5 h-5 text-primary-container" />
      </button>
      <p className="text-[10px] text-on-surface-variant mt-1 ml-1">다시 선택하려면 터치하세요</p>
    </div>
  );
};
