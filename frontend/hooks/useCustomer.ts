'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { useServiceCredit } from './useServiceCredit';
import { useRedemptionOracle } from './useRedemptionOracle';

export function useCustomer() {
  const { address } = useAccount();
  const { mintCredit, useBalance } = useServiceCredit();
  const { requestVerification } = useRedemptionOracle();
  const [isLoading, setIsLoading] = useState(false);

  // Purchase service credits
  const purchaseCredits = async (tokenId: bigint, amount: number, price: bigint) => {
    if (!address) throw new Error('Wallet not connected');
    
    setIsLoading(true);
    try {
      const hash = await mintCredit(tokenId, BigInt(amount), price);
      return hash;
    } finally {
      setIsLoading(false);
    }
  };

  // Request redemption
  const redeemCredits = async (tokenId: bigint, amount: number) => {
    if (!address) throw new Error('Wallet not connected');
    
    setIsLoading(true);
    try {
      // Generate simple proof hash (in production, this would be QR code data)
      const proofHash = `0x${Math.random().toString(16).slice(2).padStart(64, '0')}` as `0x${string}`;
      const hash = await requestVerification(tokenId, BigInt(amount), proofHash);
      return hash;
    } finally {
      setIsLoading(false);
    }
  };

  // Get user balance for a token
  const getBalance = (tokenId: bigint) => {
    if (!address) return null;
    return useBalance(address, tokenId);
  };

  return {
    purchaseCredits,
    redeemCredits,
    getBalance,
    isLoading,
  };
}