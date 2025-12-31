'use client';

import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { ServiceCreditTokenABI } from '@/lib/contracts/abis';
import { getContractAddress } from '@/lib/contracts/addresses';
import { useChainId } from 'wagmi';
import { parseEther } from 'viem';

export function useServiceCredit() {
  const chainId = useChainId();
  const chainName = (chainId === 5003) ? 'mantleSepoliaTestnet' : 'mantleMainnet';
  const contractAddress = getContractAddress(chainName, 'serviceCreditToken') as `0x${string}`;

  const { writeContractAsync, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  // Read Functions
  const useProviderInfo = (address?: `0x${string}`) => {
    return useReadContract({
      address: contractAddress,
      abi: ServiceCreditTokenABI,
      functionName: 'providers',
      args: address ? [address] : undefined,
      query: {
        enabled: !!address,
      },
    });
  };

  const useServiceInfo = (tokenId?: bigint) => {
    return useReadContract({
      address: contractAddress,
      abi: ServiceCreditTokenABI,
      functionName: 'getServiceInfo',
      args: tokenId !== undefined ? [tokenId] : undefined,
      query: {
        enabled: tokenId !== undefined,
      },
    });
  };

  const useBalance = (account?: `0x${string}`, tokenId?: bigint) => {
    return useReadContract({
      address: contractAddress,
      abi: ServiceCreditTokenABI,
      functionName: 'balanceOf',
      args: account && tokenId !== undefined ? [account, tokenId] : undefined,
      query: {
        enabled: !!account && tokenId !== undefined,
      },
    });
  };

  const useNextTokenId = () => {
    return useReadContract({
      address: contractAddress,
      abi: ServiceCreditTokenABI,
      functionName: 'nextTokenId',
    });
  };

  // Dashboard Helper Hooks
  const useServiceStats = (tokenId?: bigint) => {
    return useReadContract({
      address: contractAddress,
      abi: ServiceCreditTokenABI,
      functionName: 'getServiceStats',
      args: tokenId !== undefined ? [tokenId] : undefined,
      query: {
        enabled: tokenId !== undefined,
      },
    });
  };

  const useRedemptionRate = (tokenId?: bigint) => {
    return useReadContract({
      address: contractAddress,
      abi: ServiceCreditTokenABI,
      functionName: 'getRedemptionRate',
      args: tokenId !== undefined ? [tokenId] : undefined,
      query: {
        enabled: tokenId !== undefined,
      },
    });
  };

  const useServiceRevenue = (tokenId?: bigint) => {
    return useReadContract({
      address: contractAddress,
      abi: ServiceCreditTokenABI,
      functionName: 'getServiceRevenue',
      args: tokenId !== undefined ? [tokenId] : undefined,
      query: {
        enabled: tokenId !== undefined,
      },
    });
  };

  const useProviderStats = (address?: `0x${string}`) => {
    return useReadContract({
      address: contractAddress,
      abi: ServiceCreditTokenABI,
      functionName: 'getProviderStats',
      args: address ? [address] : undefined,
      query: {
        enabled: !!address,
      },
    });
  };

  // Write Functions
  const registerProvider = async () => {
    return await writeContractAsync({
      address: contractAddress,
      abi: ServiceCreditTokenABI,
      functionName: 'registerProvider',
    });
  };

  const createService = async (params: {
    price: string;
    expiryDays: number;
    maxSupply: number;
    serviceType: number;
    tokenURI: string;
  }) => {
    const priceWei = parseEther(params.price);
    const expiryTimestamp = BigInt(Math.floor(Date.now() / 1000) + params.expiryDays * 24 * 60 * 60);

    return await writeContractAsync({
      address: contractAddress,
      abi: ServiceCreditTokenABI,
      functionName: 'createService',
      args: [
        priceWei,
        expiryTimestamp,
        params.maxSupply,
        params.serviceType,
        params.tokenURI
      ],
    });
  };

  const mintCredit = async (tokenId: bigint, amount: bigint, price: bigint) => {
    const totalCost = price * amount;

    return await writeContractAsync({
      address: contractAddress,
      abi: ServiceCreditTokenABI,
      functionName: 'mintCredit',
      args: [tokenId, amount],
      value: totalCost,
    });
  };

  return {
    // Read hooks
    useProviderInfo,
    useServiceInfo,
    useBalance,
    useNextTokenId,
    // Dashboard helper hooks
    useServiceStats,
    useRedemptionRate,
    useServiceRevenue,
    useProviderStats,
    // Write functions
    registerProvider,
    createService,
    mintCredit,
    // Transaction state
    isPending,
    isConfirming,
    isSuccess,
    hash,
  };
}
