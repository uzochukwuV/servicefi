'use client';

import { Card } from "@/components/ui/card";
import { useAccount } from "wagmi";
import { useLiquidityPool } from "@/hooks/useLiquidityPool";
import { formatEther } from "viem";

export function InvestorStats() {
  const { address } = useAccount();
  const { usePoolStats, useLPPositions, useUserLPStats, useCurrentYield } = useLiquidityPool();

  const poolStats = usePoolStats();
  const lpPositions = useLPPositions(address);
  const userLPStats = useUserLPStats(address);
  const currentYield = useCurrentYield();

  if (!address) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="p-6">
          <div className="text-sm text-muted-foreground mb-1">Total Invested</div>
          <div className="text-3xl font-bold">--</div>
          <div className="text-xs text-muted-foreground mt-1">Connect wallet</div>
        </Card>
        <Card className="p-6">
          <div className="text-sm text-muted-foreground mb-1">Total Earned</div>
          <div className="text-3xl font-bold">--</div>
          <div className="text-xs text-muted-foreground mt-1">Connect wallet</div>
        </Card>
        <Card className="p-6">
          <div className="text-sm text-muted-foreground mb-1">Current APY</div>
          <div className="text-3xl font-bold">--</div>
          <div className="text-xs text-muted-foreground mt-1">Connect wallet</div>
        </Card>
        <Card className="p-6">
          <div className="text-sm text-muted-foreground mb-1">Active Positions</div>
          <div className="text-3xl font-bold">--</div>
          <div className="text-xs text-muted-foreground mt-1">Connect wallet</div>
        </Card>
      </div>
    );
  }

  // Calculate total invested from LP positions
  const positions = lpPositions.data as any[] || [];
  const totalInvested = positions.reduce((sum, pos) => {
    return sum + Number(formatEther(pos.amount || BigInt(0)));
  }, 0);

  // Get user stats if available
  const userTotalStake = userLPStats.data ? formatEther((userLPStats.data as any)[0] || BigInt(0)) : "0";
  const userTotalRewards = userLPStats.data ? formatEther((userLPStats.data as any)[1] || BigInt(0)) : "0";

  // Get current yield rate
  const yieldRate = currentYield.data ? Number(currentYield.data) / 100 : 0;

  // Active positions count
  const activePositions = positions.length;

  // Calculate ROI
  const roi = totalInvested > 0
    ? ((parseFloat(userTotalRewards) / totalInvested) * 100).toFixed(1)
    : "0";

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <Card className="p-6">
        <div className="text-sm text-muted-foreground mb-1">Total Invested</div>
        <div className="text-3xl font-bold">{totalInvested.toFixed(2)} MNT</div>
        <div className="text-xs text-muted-foreground mt-1">Locked in liquidity pools</div>
      </Card>
      <Card className="p-6">
        <div className="text-sm text-muted-foreground mb-1">Total Earned</div>
        <div className="text-3xl font-bold">{parseFloat(userTotalRewards).toFixed(2)} MNT</div>
        <div className="text-xs text-accent mt-1">{roi}% ROI</div>
      </Card>
      <Card className="p-6">
        <div className="text-sm text-muted-foreground mb-1">Current APY</div>
        <div className="text-3xl font-bold">{yieldRate.toFixed(1)}%</div>
        <div className="text-xs text-accent mt-1">Real yield from services</div>
      </Card>
      <Card className="p-6">
        <div className="text-sm text-muted-foreground mb-1">Active Positions</div>
        <div className="text-3xl font-bold">{activePositions}</div>
        <div className="text-xs text-muted-foreground mt-1">LP deposits</div>
      </Card>
    </div>
  );
}
