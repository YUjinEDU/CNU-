import React, { useCallback } from 'react';
import { MapPin, Search } from 'lucide-react';
import { geocode } from '../lib/naverApi';
import { showToast } from './Toast';

// Daum Postcode 타입
declare global {
  interface Window {
    daum: {
      Postcode: new (options: {
        oncomplete: (data: DaumPostcodeResult) => void;
        width?: string;
        height?: string;
      }) => { open: () => void };
    };
  }
}

interface DaumPostcodeResult {
  zonecode: string;       // 우편번호
  address: string;        // 기본 주소
  addressType: string;    // R(도로명), J(지번)
  roadAddress: string;    // 도로명 주소
  jibunAddress: string;   // 지번 주소
  buildingName: string;   // 건물명
  apartment: string;      // 아파트 여부
  sido: string;           // 시/도
  sigungu: string;        // 시/군/구
  bname: string;          // 법정동/법정리
}

interface AddressSearchProps {
  value: string;
  onAddressSelected: (result: {
    name: string;
    fullAddress: string;
    zipCode: string;
    lat: number;
    lng: number;
  }) => void;
  placeholder?: string;
  label?: string;
}

let scriptLoaded = false;
function loadDaumPostcode(): Promise<void> {
  if (scriptLoaded && window.daum?.Postcode) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = '//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';
    script.async = true;
    script.onload = () => { scriptLoaded = true; resolve(); };
    script.onerror = () => reject(new Error('Daum Postcode 스크립트 로드 실패'));
    document.head.appendChild(script);
  });
}

export const AddressSearch: React.FC<AddressSearchProps> = ({
  value,
  onAddressSelected,
  placeholder = '주소를 검색해주세요',
}) => {
  const handleSearch = useCallback(async () => {
    try {
      await loadDaumPostcode();
    } catch {
      showToast('주소 검색 서비스를 불러올 수 없습니다.', 'error');
      return;
    }

    new window.daum.Postcode({
      oncomplete: async (data: DaumPostcodeResult) => {
        const addr = data.roadAddress || data.jibunAddress;
        const displayName = data.buildingName
          ? `${addr} (${data.buildingName})`
          : addr;

        // 네이버 Geocoding으로 좌표 변환
        try {
          const geo = await geocode(addr);
          onAddressSelected({
            name: displayName,
            fullAddress: addr,
            zipCode: data.zonecode,
            lat: geo?.lat ?? 0,
            lng: geo?.lng ?? 0,
          });
        } catch {
          // Geocoding 실패해도 주소는 저장
          onAddressSelected({
            name: displayName,
            fullAddress: addr,
            zipCode: data.zonecode,
            lat: 0,
            lng: 0,
          });
        }
      },
    }).open();
  }, [onAddressSelected]);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleSearch}
        className="w-full bg-surface-container-lowest border border-transparent rounded-xl px-4 py-4 text-left shadow-sm flex items-center gap-3 hover:border-primary-container/30 transition-colors"
      >
        <MapPin className="w-5 h-5 text-primary-container flex-shrink-0" />
        <span className={`flex-1 font-semibold truncate ${value ? 'text-on-surface' : 'text-slate-400'}`}>
          {value || placeholder}
        </span>
        <div className="bg-primary-container/10 p-1.5 rounded-lg">
          <Search className="w-4 h-4 text-primary-container" />
        </div>
      </button>
    </div>
  );
};
