'use client';

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useServiceCredit } from "@/hooks/useServiceCredit";
import { useLiquidityPool } from "@/hooks/useLiquidityPool";
import { useState, useEffect } from "react";
import { getAllServiceMetadata } from "@/lib/metadata-storage";
import { formatEther } from "viem";

export function InvestmentOpportunities() {
  const { useNextTokenId } = useServiceCredit();
  const { useCurrentYield, usePoolConfig } = useLiquidityPool();

  const nextTokenId = useNextTokenId();
  const currentYield = useCurrentYield();
  const poolConfig = usePoolConfig();

  const totalServices = nextTokenId.data ? Number(nextTokenId.data) - 1 : 0;
  const [allMetadata, setAllMetadata] = useState<Record<number, any>>({});
  const [categoryFilter, setCategoryFilter] = useState("all");

  useEffect(() => {
    const metadata = getAllServiceMetadata();
    setAllMetadata(metadata);
  }, []);

  // Get unique categories
  const categories = Array.from(
    new Set(Object.values(allMetadata).map((m: any) => m?.category).filter(Boolean))
  );

  const yieldRate = currentYield.data ? Number(currentYield.data) / 100 : 0;
  const discount = poolConfig.data ? Number(poolConfig.data[0]) / 100 : 10;

  if (totalServices === 0) {
    return (
      <Card className="p-12 text-center border-2 border-dashed">
        <p className="text-muted-foreground mb-2">No investment opportunities yet</p>
        <p className="text-sm text-muted-foreground">Services will appear here once created</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <select
          className="px-4 py-2 border border-input bg-background rounded-md"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="all">All Categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        <select className="px-4 py-2 border border-input bg-background rounded-md">
          <option>Sort by APY</option>
          <option>Sort by Pool Size</option>
          <option>Sort by Available</option>
        </select>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: totalServices }, (_, i) => {
          const tokenId = i + 1;
          return (
            <InvestmentCard
              key={tokenId}
              tokenId={tokenId}
              metadata={allMetadata[tokenId]}
              categoryFilter={categoryFilter}
              apy={yieldRate}
              discount={discount}
            />
          );
        })}
      </div>
    </div>
  );
}

function InvestmentCard({
  tokenId,
  metadata,
  categoryFilter,
  apy,
  discount
}: {
  tokenId: number;
  metadata?: any;
  categoryFilter: string;
  apy: number;
  discount: number;
}) {
  const { useServiceInfo } = useServiceCredit();
  const serviceInfo = useServiceInfo(BigInt(tokenId));

  if (!serviceInfo.data) return null;

  const price = serviceInfo.data[0];
  const expiryTimestamp = serviceInfo.data[1];
  const maxSupply = Number(serviceInfo.data[2]);
  const totalMinted = Number(serviceInfo.data[3]);
  const active = serviceInfo.data[4];
  const available = maxSupply - totalMinted;

  if (!active) return null;

  // Apply category filter
  if (categoryFilter !== 'all' && metadata?.category !== categoryFilter) {
    return null;
  }

  const businessName = metadata?.brand || 'Service Provider';
  const serviceName = metadata?.name || `Service #${tokenId}`;
  const category = metadata?.category || 'Service';

  // Calculate pool metrics
  const poolSize = Number(formatEther(price)) * totalMinted;
  const availableInvestment = Number(formatEther(price)) * available;

  // Calculate expiry
  const now = Math.floor(Date.now() / 1000);
  const expiresIn = Number(expiryTimestamp) - now;
  const daysLeft = Math.floor(expiresIn / (24 * 60 * 60));

  // Simplified risk score based on redemption rate and duration
  const getRiskLevel = () => {
    if (daysLeft > 90) return "Low";
    if (daysLeft > 30) return "Medium";
    return "High";
  };

  const riskLevel = getRiskLevel();

  return (
    <Card className="border-2 hover:border-accent transition-colors">
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="font-bold text-lg mb-1">{businessName}</h3>
            <p className="text-sm text-muted-foreground">{category}</p>
          </div>
          <div
            className={`text-xs px-2 py-1 rounded ${
              riskLevel === "Low"
                ? "bg-accent/10 text-accent"
                : riskLevel === "Medium"
                  ? "bg-muted text-foreground"
                  : "bg-destructive/10 text-destructive"
            }`}
          >
            {riskLevel} Risk
          </div>
        </div>

        <div className="mb-6">
          <div className="text-3xl font-bold text-accent mb-1">{apy.toFixed(1)}% APY</div>
          <div className="text-xs text-muted-foreground">Average annual yield</div>
        </div>

        <div className="space-y-2 mb-6 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Service</span>
            <span className="font-medium">{serviceName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Token Price</span>
            <span className="font-medium">{formatEther(price)} MNT</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Pool Size</span>
            <span className="font-medium">{poolSize.toFixed(2)} MNT</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Available to Invest</span>
            <span className="font-medium">{availableInvestment.toFixed(2)} MNT</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">LP Discount</span>
            <span className="font-medium text-accent">{discount}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Expires in</span>
            <span className="font-medium">{daysLeft} days</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Tokens Sold</span>
            <span className="font-medium">{totalMinted} / {maxSupply}</span>
          </div>
        </div>

        <Button className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
          Provide Liquidity
        </Button>
      </div>
    </Card>
  );
}
