'use client';

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAccount } from "wagmi";
import { useLiquidityPool } from "@/hooks/useLiquidityPool";
import { formatEther } from "viem";
import { toast } from "sonner";

export function MyPortfolio() {
  const { address } = useAccount();
  const {
    useLPPositions,
    useIsPositionUnlocked,
    withdrawLiquidity,
    isPending,
    isConfirming,
  } = useLiquidityPool();

  const lpPositions = useLPPositions(address);

  if (!address) {
    return (
      <Card className="p-8 text-center border-2">
        <p className="text-muted-foreground">Connect your wallet to view your portfolio</p>
      </Card>
    );
  }

  const positions = (lpPositions.data as any[]) || [];

  if (positions.length === 0) {
    return (
      <Card className="p-8 text-center border-2 border-dashed">
        <p className="text-muted-foreground mb-2">No active investments</p>
        <p className="text-sm text-muted-foreground">Start providing liquidity to earn yield</p>
      </Card>
    );
  }

  const handleWithdraw = async (positionIndex: number) => {
    try {
      await withdrawLiquidity(positionIndex);
      toast.success('Withdrawal successful!');
    } catch (error: any) {
      toast.error(error.message || 'Withdrawal failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Active Investments</h2>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {positions.map((position: any, index: number) => (
          <PortfolioCard
            key={index}
            position={position}
            positionIndex={index}
            userAddress={address}
            onWithdraw={handleWithdraw}
            isWithdrawing={isPending || isConfirming}
          />
        ))}
      </div>
    </div>
  );
}

function PortfolioCard({
  position,
  positionIndex,
  userAddress,
  onWithdraw,
  isWithdrawing,
}: {
  position: any;
  positionIndex: number;
  userAddress: `0x${string}`;
  onWithdraw: (index: number) => void;
  isWithdrawing: boolean;
}) {
  const { useIsPositionUnlocked } = useLiquidityPool();
  const isUnlocked = useIsPositionUnlocked(userAddress, positionIndex);

  const amount = formatEther(position.amount || 0n);
  const lockPeriodDays = Number(position.lockPeriod) / (24 * 60 * 60);
  const depositTimestamp = Number(position.depositTimestamp);
  const unlockTimestamp = depositTimestamp + Number(position.lockPeriod);

  const depositDate = new Date(depositTimestamp * 1000).toLocaleDateString();
  const unlockDate = new Date(unlockTimestamp * 1000).toLocaleDateString();

  const now = Math.floor(Date.now() / 1000);
  const daysRemaining = Math.max(0, Math.ceil((unlockTimestamp - now) / (24 * 60 * 60)));
  const canWithdraw = isUnlocked.data === true || now >= unlockTimestamp;

  // Calculate estimated returns (simplified - actual returns from redemptions)
  const estimatedYield = parseFloat(amount) * 0.15; // Placeholder 15% estimated yield

  return (
    <Card className="p-6 border-2">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-bold text-lg mb-1">Liquidity Position #{positionIndex + 1}</h3>
          <div className="text-sm text-muted-foreground">Deposited: {depositDate}</div>
        </div>
        <div
          className={`text-xs px-2 py-1 rounded ${
            canWithdraw ? "bg-accent/10 text-accent" : "bg-muted text-muted-foreground"
          }`}
        >
          {canWithdraw ? "Unlocked" : `Locked ${daysRemaining}d`}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <div className="text-sm text-muted-foreground mb-1">Invested</div>
          <div className="text-xl font-bold">{amount} MNT</div>
        </div>
        <div>
          <div className="text-sm text-muted-foreground mb-1">Est. Earned</div>
          <div className="text-xl font-bold text-accent">{estimatedYield.toFixed(2)} MNT</div>
        </div>
      </div>

      <div className="space-y-2 mb-4 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Lock Period</span>
          <span className="font-medium">{lockPeriodDays} days</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Unlock Date</span>
          <span className="font-medium">{unlockDate}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Status</span>
          <span className="font-medium">
            {canWithdraw ? "Ready to withdraw" : `${daysRemaining} days remaining`}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Est. ROI</span>
          <span className="font-bold text-accent">
            {((estimatedYield / parseFloat(amount)) * 100).toFixed(1)}%
          </span>
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          variant="outline"
          className="flex-1 bg-transparent"
          disabled={canWithdraw || isWithdrawing}
        >
          Add Liquidity
        </Button>
        <Button
          onClick={() => onWithdraw(positionIndex)}
          disabled={!canWithdraw || isWithdrawing}
          className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90"
        >
          {isWithdrawing ? "Processing..." : "Withdraw"}
        </Button>
      </div>
    </Card>
  );
}
