'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { useServiceCredit } from './useServiceCredit';

interface BusinessData {
  name: string;
  businessType: string;
  registrationNumber: string;
  address: string;
  phone: string;
  email: string;
}

export function useBusinessRegistration() {
  const { address } = useAccount();
  const { registerProvider, useProviderInfo } = useServiceCredit();
  const [isLoading, setIsLoading] = useState(false);

  // Check if already registered
  const providerInfo = useProviderInfo(address);
  const isRegistered = providerInfo.data?.[5] || false; // active field

  // Register business on-chain
  const registerBusiness = async (businessData: BusinessData) => {
    if (!address) throw new Error('Wallet not connected');
    
    setIsLoading(true);
    try {
      // For now, just register on-chain
      // In production, you could store business data on IPFS first
      const hash = await registerProvider();
      return hash;
    } finally {
      setIsLoading(false);
    }
  };

  // Optional: Upload documents to IPFS (Pinata)
  const uploadDocument = async (file: File): Promise<string> => {
    // This would require PINATA_JWT in environment
    // For now, return mock hash
    return `QmMockHash${Date.now()}`;
  };

  return {
    registerBusiness,
    uploadDocument,
    isRegistered,
    isLoading,
    providerInfo: providerInfo.data,
  };
}