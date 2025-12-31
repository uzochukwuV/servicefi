'use client';

import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { RedemptionOracleABI } from '@/lib/contracts/abis';
import { getContractAddress } from '@/lib/contracts/addresses';
import { useChainId } from 'wagmi';
import { keccak256, toBytes } from 'viem';

export function useRedemptionOracle() {
  const chainId = useChainId();
  const chainName = chainId === 5003 ? 'mantleSepoliaTestnet' : 'mantleMainnet';
  const contractAddress = getContractAddress(chainName, 'redemptionOracle') as `0x${string}`;

  const { writeContractAsync, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  // Read Functions
  const useRequest = (requestId?: `0x${string}`) => {
    return useReadContract({
      address: contractAddress,
      abi: RedemptionOracleABI,
      functionName: 'getRequest',
      args: requestId ? [requestId] : undefined,
      query: {
        enabled: !!requestId,
      },
    });
  };

  const useVerifierInfo = (address?: `0x${string}`) => {
    return useReadContract({
      address: contractAddress,
      abi: RedemptionOracleABI,
      functionName: 'verifiers',
      args: address ? [address] : undefined,
      query: {
        enabled: !!address,
      },
    });
  };

  const useServiceRedemptions = (tokenId?: bigint) => {
    return useReadContract({
      address: contractAddress,
      abi: RedemptionOracleABI,
      functionName: 'serviceRedemptions',
      args: tokenId !== undefined ? [tokenId] : undefined,
      query: {
        enabled: tokenId !== undefined,
      },
    });
  };

  // Write Functions
  const requestVerification = async (tokenId: bigint, amount: bigint, proofData: string) => {
    // Generate proof hash from proof data (e.g., QR code, receipt ID)
    const proofHash = keccak256(toBytes(proofData)) as `0x${string}`;

    return await writeContractAsync({
      address: contractAddress,
      abi: RedemptionOracleABI,
      functionName: 'requestVerification',
      args: [tokenId, amount, proofHash],
    });
  };

  const verifyRedemption = async (requestId: `0x${string}`, approved: boolean) => {
    return await writeContractAsync({
      address: contractAddress,
      abi: RedemptionOracleABI,
      functionName: 'verifyRedemption',
      args: [requestId, approved],
    });
  };

  const batchVerify = async (requestIds: `0x${string}`[], approvals: boolean[]) => {
    return await writeContractAsync({
      address: contractAddress,
      abi: RedemptionOracleABI,
      functionName: 'batchVerify',
      args: [requestIds, approvals],
    });
  };

  return {
    // Read hooks
    useRequest,
    useVerifierInfo,
    useServiceRedemptions,
    // Write functions
    requestVerification,
    verifyRedemption,
    batchVerify,
    // Transaction state
    isPending,
    isConfirming,
    isSuccess,
    hash,
  };
}
