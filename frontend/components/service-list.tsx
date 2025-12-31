'use client';

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useServiceCredit } from "@/hooks/useServiceCredit";
import { formatEther } from "viem";
import { useState, useEffect } from "react";

interface Service {
  tokenId: bigint;
  price: bigint;
  expiryTimestamp: bigint;
  maxSupply: number;
  totalMinted: number;
  active: boolean;
  serviceType: number;
}

export function ServiceList({ providerAddress }: { providerAddress?: `0x${string}` }) {
  const { useServiceInfo, useProviderStats } = useServiceCredit();
  const providerStats = useProviderStats(providerAddress);
  const [services, setServices] = useState<Service[]>([]);

  // Get number of services from provider stats
  const serviceCount = providerStats.data ? Number(providerStats.data[0]) : 0;

  // Fetch each service (tokenIds are sequential, starting from 1)
  useEffect(() => {
    if (serviceCount > 0) {
      const fetchedServices: Service[] = [];
      // In production, you'd fetch these one by one or use multicall
      // For now, we'll show a placeholder
      console.log(`Provider has ${serviceCount} services`);
    }
  }, [serviceCount]);

  if (!providerAddress) {
    return <div className="text-center text-muted-foreground">Connect wallet to view services</div>;
  }

  if (serviceCount === 0) {
    return (
      <Card className="p-8 text-center border-2 border-dashed">
        <p className="text-muted-foreground mb-4">No services created yet</p>
        <p className="text-sm text-muted-foreground">Create your first service to start tokenizing your business!</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        You have created {serviceCount} service{serviceCount !== 1 ? 's' : ''}
      </p>

      {/* Placeholder for actual services - will be populated after indexing */}
      <Card className="p-6 border-2">
        <div className="text-sm text-muted-foreground">
          Services will appear here after creation. Check the blockchain explorer for your transactions.
        </div>
      </Card>
    </div>
  );
}
