'use client';

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useServiceCredit } from "@/hooks/useServiceCredit";
import { formatEther } from "viem";
import { useEffect, useState } from "react";
import { getServiceMetadata, ServiceMetadata } from "@/lib/metadata-storage";

interface ServiceCardProps {
  tokenId: number;
}

export function ServiceCard({ tokenId }: ServiceCardProps) {
  const { useServiceInfo, useServiceStats } = useServiceCredit();
  const [metadata, setMetadata] = useState<ServiceMetadata | null>(null);

  const serviceInfo = useServiceInfo(BigInt(tokenId));
  const serviceStats = useServiceStats(BigInt(tokenId));

  useEffect(() => {
    // Load metadata from localStorage
    const meta = getServiceMetadata(tokenId);
    setMetadata(meta);
  }, [tokenId]);

  if (!serviceInfo.data || !serviceStats.data) {
    return (
      <Card className="p-6 border-2 animate-pulse">
        <div className="h-4 bg-muted rounded w-1/2 mb-2"></div>
        <div className="h-3 bg-muted rounded w-1/3"></div>
      </Card>
    );
  }

  const price = serviceInfo.data[0];
  const maxSupply = Number(serviceInfo.data[2]);
  const totalMinted = Number(serviceInfo.data[3]);
  const active = serviceInfo.data[4];

  const statsPrice = serviceStats.data[0];
  const statsTotalMinted = Number(serviceStats.data[1]);
  const totalRedeemed = Number(serviceStats.data[2]);
  const revenue = serviceStats.data[4];
  const isActive = serviceStats.data[5];

  return (
    <Card className="p-6 border-2 hover:border-accent transition-colors">
      {metadata?.image && (
        <div className="w-full h-40 rounded-md overflow-hidden bg-muted mb-4">
          <img
            src={metadata.image}
            alt={metadata.name || `Service #${tokenId}`}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>
      )}

      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-xs text-muted-foreground">{metadata?.brand || 'Unknown Brand'}</p>
          <h3 className="font-bold text-lg mb-1">{metadata?.name || `Service #${tokenId}`}</h3>
          <div className="text-sm text-muted-foreground">{formatEther(price)} MNT per token</div>
        </div>
        <div
          className={`text-xs px-2 py-1 ${
            isActive ? "bg-accent/10 text-accent" : "bg-muted text-muted-foreground"
          }`}
        >
          {isActive ? "Active" : "Inactive"}
        </div>
      </div>

      {metadata?.description && (
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
          {metadata.description}
        </p>
      )}

      <div className="space-y-2 mb-4 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Active Tokens</span>
          <span className="font-medium">{totalMinted - totalRedeemed}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Redeemed</span>
          <span className="font-medium">{totalRedeemed}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Total Minted</span>
          <span className="font-medium">{totalMinted} / {maxSupply}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Total Revenue</span>
          <span className="font-bold">{formatEther(revenue)} MNT</span>
        </div>
      </div>

      <div className="flex gap-2">
        <Button variant="outline" size="sm" className="flex-1 bg-transparent">
          View Details
        </Button>
        <Button variant="outline" size="sm" className="flex-1 bg-transparent">
          {isActive ? "Pause" : "Resume"}
        </Button>
      </div>
    </Card>
  );
}
