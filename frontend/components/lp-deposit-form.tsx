'use client';

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLiquidityPool } from "@/hooks/useLiquidityPool";
import { useAccount, useBalance } from "wagmi";
import { formatEther } from "viem";
import { toast } from "sonner";

export function LPDepositForm() {
  const [amount, setAmount] = useState("");
  const [lockDays, setLockDays] = useState(7);
  const { address } = useAccount();
  const { data: balance } = useBalance({ address });

  const {
    addLiquidity,
    usePoolConfig,
    usePoolStats,
    useCurrentYield,
    useLPPositions,
    isPending,
    isConfirming,
    isSuccess,
  } = useLiquidityPool();

  const poolConfig = usePoolConfig();
  const poolStats = usePoolStats();
  const currentYield = useCurrentYield();
  const lpPositions = useLPPositions(address);

  // Get pool configuration
  const minLockDays = poolConfig.data
    ? Number(poolConfig.data[1]) / (24 * 60 * 60) // Convert seconds to days
    : 7;
  const discount = poolConfig.data
    ? Number(poolConfig.data[0]) / 100 // Convert basis points to percentage
    : 10;

  // Get pool stats
  const totalLiquidity = poolStats.data
    ? formatEther(poolStats.data[0])
    : "0";
  const totalCreditsIssued = poolStats.data
    ? formatEther(poolStats.data[1])
    : "0";

  // Get current yield
  const yieldRate = currentYield.data
    ? Number(currentYield.data) / 100
    : 0;

  // Calculate estimated returns
  const estimatedDiscount = amount ? (parseFloat(amount) * discount / 100).toFixed(4) : "0";
  const estimatedYield = amount ? (parseFloat(amount) * yieldRate / 100 * lockDays / 365).toFixed(4) : "0";

  const handleDeposit = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (lockDays < minLockDays) {
      toast.error(`Minimum lock period is ${minLockDays} days`);
      return;
    }

    if (balance && parseFloat(amount) > parseFloat(formatEther(balance.value))) {
      toast.error("Insufficient balance");
      return;
    }

    try {
      await addLiquidity(amount, lockDays);
      toast.success(`Successfully deposited ${amount} MNT for ${lockDays} days!`);
      setAmount("");
      setLockDays(7);
    } catch (error: any) {
      toast.error(error.message || 'Deposit failed');
    }
  };

  const handleMaxClick = () => {
    if (balance) {
      // Leave a small amount for gas fees
      const maxAmount = parseFloat(formatEther(balance.value)) - 0.01;
      setAmount(maxAmount > 0 ? maxAmount.toString() : "0");
    }
  };

  return (
    <div className="space-y-6">
      {/* Main Deposit Form */}
      <Card className="p-6 border-2">
        <h3 className="text-xl font-bold mb-4">Add Liquidity</h3>

        {/* Pool Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-muted rounded-lg">
          <div>
            <p className="text-sm text-muted-foreground">Total Pool Liquidity</p>
            <p className="text-lg font-bold">{totalLiquidity} MNT</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Credits Issued</p>
            <p className="text-lg font-bold">{totalCreditsIssued} MNT</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Current Yield (APY)</p>
            <p className="text-lg font-bold text-green-600">{yieldRate.toFixed(2)}%</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">LP Discount</p>
            <p className="text-lg font-bold text-blue-600">{discount}%</p>
          </div>
        </div>

        {/* Amount Input */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Amount (MNT)</Label>
            <div className="flex gap-2">
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              <Button variant="outline" onClick={handleMaxClick}>
                MAX
              </Button>
            </div>
            {balance && (
              <p className="text-sm text-muted-foreground">
                Balance: {parseFloat(formatEther(balance.value)).toFixed(4)} MNT
              </p>
            )}
          </div>

          {/* Lock Period Input */}
          <div className="space-y-2">
            <Label htmlFor="lockDays">Lock Period (days)</Label>
            <Input
              id="lockDays"
              type="number"
              min={minLockDays}
              value={lockDays}
              onChange={(e) => setLockDays(Math.max(minLockDays, parseInt(e.target.value) || minLockDays))}
            />
            <p className="text-sm text-muted-foreground">
              Minimum lock period: {minLockDays} days
            </p>
          </div>

          {/* Estimated Returns */}
          {amount && parseFloat(amount) > 0 && (
            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Estimated discount savings:</span>
                <span className="font-medium">{estimatedDiscount} MNT</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Estimated yield ({lockDays} days):</span>
                <span className="font-medium text-green-600">{estimatedYield} MNT</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>Total estimated return:</span>
                <span className="text-accent">{(parseFloat(estimatedDiscount) + parseFloat(estimatedYield)).toFixed(4)} MNT</span>
              </div>
            </div>
          )}

          {/* Deposit Button */}
          <Button
            onClick={handleDeposit}
            disabled={isPending || isConfirming || !amount || parseFloat(amount) <= 0}
            className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
          >
            {isPending || isConfirming ? 'Processing...' : 'Add Liquidity'}
          </Button>

          {isSuccess && (
            <p className="text-sm text-green-600 text-center">
              Transaction confirmed! Your liquidity has been added.
            </p>
          )}
        </div>
      </Card>

      {/* User Positions */}
      {address && lpPositions.data && Array.isArray(lpPositions.data) && lpPositions.data.length > 0 && (
        <Card className="p-6 border-2">
          <h3 className="text-xl font-bold mb-4">Your LP Positions</h3>
          <div className="space-y-3">
            {lpPositions.data.map((position: any, index: number) => (
              <div key={index} className="p-4 bg-muted rounded-lg">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-muted-foreground">Amount</p>
                    <p className="font-bold">{formatEther(position.amount)} MNT</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Lock Period</p>
                    <p className="font-bold">{Number(position.lockPeriod) / (24 * 60 * 60)} days</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Deposited</p>
                    <p className="text-xs">{new Date(Number(position.depositTimestamp) * 1000).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Unlocks</p>
                    <p className="text-xs">{new Date((Number(position.depositTimestamp) + Number(position.lockPeriod)) * 1000).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
