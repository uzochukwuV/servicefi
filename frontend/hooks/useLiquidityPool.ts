'use client';

import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { LiquidityPoolABI } from '@/lib/contracts/abis';
import { getContractAddress } from '@/lib/contracts/addresses';
import { useChainId } from 'wagmi';
import { parseEther } from 'viem';

export function useLiquidityPool() {
  const chainId = useChainId();
  const chainName = (chainId === 5003) ? 'mantleSepoliaTestnet' : 'mantleMainnet';
  const contractAddress = getContractAddress(chainName, 'liquidityPool') as `0x${string}`;

  const { writeContractAsync, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  // Read Functions
  const usePoolStats = () => {
    return useReadContract({
      address: contractAddress,
      abi: LiquidityPoolABI,
      functionName: 'getPoolStats',
    });
  };

  const useLPPositions = (address?: `0x${string}`) => {
    return useReadContract({
      address: contractAddress,
      abi: LiquidityPoolABI,
      functionName: 'getLPPositions',
      args: address ? [address] : undefined,
      query: {
        enabled: !!address,
      },
    });
  };

  const useTotalLPStake = () => {
    return useReadContract({
      address: contractAddress,
      abi: LiquidityPoolABI,
      functionName: 'getTotalLPStake',
    });
  };

  const usePoolConfig = () => {
    return useReadContract({
      address: contractAddress,
      abi: LiquidityPoolABI,
      functionName: 'poolConfig',
    });
  };

  // Dashboard Helper Hooks
  const usePoolAnalytics = () => {
    return useReadContract({
      address: contractAddress,
      abi: LiquidityPoolABI,
      functionName: 'getPoolAnalytics',
    });
  };

  const useUserLPStats = (address?: `0x${string}`) => {
    return useReadContract({
      address: contractAddress,
      abi: LiquidityPoolABI,
      functionName: 'getUserLPStats',
      args: address ? [address] : undefined,
      query: {
        enabled: !!address,
      },
    });
  };

  const useCurrentYield = () => {
    return useReadContract({
      address: contractAddress,
      abi: LiquidityPoolABI,
      functionName: 'getCurrentYield',
    });
  };

  const useIsPositionUnlocked = (lp?: `0x${string}`, positionIndex?: number) => {
    return useReadContract({
      address: contractAddress,
      abi: LiquidityPoolABI,
      functionName: 'isPositionUnlocked',
      args: lp && positionIndex !== undefined ? [lp, BigInt(positionIndex)] : undefined,
      query: {
        enabled: !!lp && positionIndex !== undefined,
      },
    });
  };

  // Write Functions
  const addLiquidity = async (amount: string, lockDays: number) => {
    const amountWei = parseEther(amount);
    const lockPeriod = lockDays * 24 * 60 * 60;

    return await writeContractAsync({
      address: contractAddress,
      abi: LiquidityPoolABI,
      functionName: 'addLiquidity',
      args: [lockPeriod],
      value: amountWei,
    });
  };

  const withdrawLiquidity = async (positionIndex: number) => {
    return await writeContractAsync({
      address: contractAddress,
      abi: LiquidityPoolABI,
      functionName: 'withdrawLiquidity',
      args: [BigInt(positionIndex)],
    });
  };

  const purchaseCredits = async (tokenId: bigint, amount: bigint) => {
    return await writeContractAsync({
      address: contractAddress,
      abi: LiquidityPoolABI,
      functionName: 'purchaseCredits',
      args: [tokenId, amount],
    });
  };

  return {
    // Read hooks
    usePoolStats,
    useLPPositions,
    useTotalLPStake,
    usePoolConfig,
    // Dashboard helper hooks
    usePoolAnalytics,
    useUserLPStats,
    useCurrentYield,
    useIsPositionUnlocked,
    // Write functions
    addLiquidity,
    withdrawLiquidity,
    purchaseCredits,
    // Transaction state
    isPending,
    isConfirming,
    isSuccess,
    hash,
  };
}
