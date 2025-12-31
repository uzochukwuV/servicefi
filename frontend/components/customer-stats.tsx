'use client';

import { Card } from "@/components/ui/card";
import { useAccount } from "wagmi";
import { useServiceCredit } from "@/hooks/useServiceCredit";
import { useReadContract } from "wagmi";
import { ServiceCreditTokenABI } from "@/lib/contracts/abis";
import { getContractAddress } from "@/lib/contracts/addresses";
import { useChainId } from "wagmi";
import { useEffect, useState } from "react";
import { formatEther } from "viem";

export function CustomerStats() {
  const { address } = useAccount();
  const chainId = useChainId();
  const chainName = (chainId === 5003) ? 'mantleSepoliaTestnet' : 'mantleMainnet';
  const contractAddress = getContractAddress(chainName, 'serviceCreditToken') as `0x${string}`;

  const { useNextTokenId, useServiceInfo } = useServiceCredit();
  const nextTokenId = useNextTokenId();
  const totalServices = nextTokenId.data ? Number(nextTokenId.data) - 1 : 0;

  const [stats, setStats] = useState({
    totalTokens: 0,
    totalValue: 0,
    expiringSoon: 0,
  });

  useEffect(() => {
    if (!address || totalServices === 0) return;

    const calculateStats = async () => {
      let tokenCount = 0;
      let totalVal = 0;
      let expiring = 0;
      const now = Math.floor(Date.now() / 1000);

      for (let i = 1; i <= totalServices; i++) {
        try {
          // This is a simplified version - in production you'd batch these calls
          const tokenId = BigInt(i);

          // Would need to fetch balance and service info for each token
          // For now showing placeholder
        } catch (error) {
          console.error(`Error fetching stats for token ${i}:`, error);
        }
      }

      setStats({
        totalTokens: tokenCount,
        totalValue: totalVal,
        expiringSoon: expiring,
      });
    };

    calculateStats();
  }, [address, totalServices, contractAddress]);

  if (!address) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="p-6">
          <div className="text-sm text-muted-foreground mb-1">My Tokens</div>
          <div className="text-3xl font-bold">--</div>
          <div className="text-xs text-muted-foreground mt-1">Connect wallet</div>
        </Card>
        <Card className="p-6">
          <div className="text-sm text-muted-foreground mb-1">Total Value</div>
          <div className="text-3xl font-bold">--</div>
          <div className="text-xs text-muted-foreground mt-1">Connect wallet</div>
        </Card>
        <Card className="p-6">
          <div className="text-sm text-muted-foreground mb-1">Redeemed</div>
          <div className="text-3xl font-bold">--</div>
          <div className="text-xs text-muted-foreground mt-1">Connect wallet</div>
        </Card>
        <Card className="p-6">
          <div className="text-sm text-muted-foreground mb-1">Expiring Soon</div>
          <div className="text-3xl font-bold">--</div>
          <div className="text-xs text-muted-foreground mt-1">Connect wallet</div>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <Card className="p-6">
        <div className="text-sm text-muted-foreground mb-1">My Tokens</div>
        <div className="text-3xl font-bold">{stats.totalTokens}</div>
        <div className="text-xs text-muted-foreground mt-1">Service credits owned</div>
      </Card>
      <Card className="p-6">
        <div className="text-sm text-muted-foreground mb-1">Total Value</div>
        <div className="text-3xl font-bold">{stats.totalValue.toFixed(2)} MNT</div>
        <div className="text-xs text-accent mt-1">In your wallet</div>
      </Card>
      <Card className="p-6">
        <div className="text-sm text-muted-foreground mb-1">Redeemed</div>
        <div className="text-3xl font-bold">--</div>
        <div className="text-xs text-muted-foreground mt-1">All time</div>
      </Card>
      <Card className="p-6">
        <div className="text-sm text-muted-foreground mb-1">Expiring Soon</div>
        <div className="text-3xl font-bold">{stats.expiringSoon}</div>
        <div className="text-xs text-muted-foreground mt-1">Within 7 days</div>
      </Card>
    </div>
  );
}
