'use client';

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useServiceCredit } from "@/hooks/useServiceCredit";
import { formatEther } from "viem";
import { useState, useEffect } from "react";
import { getServiceMetadata, getAllServiceMetadata } from "@/lib/metadata-storage";
import { PurchaseModal } from "@/components/purchase-modal";

export function BrowseServices() {
  const { useServiceInfo, useNextTokenId } = useServiceCredit();
  const nextTokenId = useNextTokenId();
  const [allMetadata, setAllMetadata] = useState<Record<number, any>>({});
  const [selectedService, setSelectedService] = useState<any>(null);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);

  const totalServices = nextTokenId.data ? Number(nextTokenId.data) - 1 : 0;

  useEffect(() => {
    // Load all metadata from localStorage
    const metadata = getAllServiceMetadata();
    setAllMetadata(metadata);
  }, []);

  const handlePurchase = (tokenId: number, price: bigint, maxSupply: number, totalMinted: number, name: string) => {
    setSelectedService({
      tokenId: BigInt(tokenId),
      price,
      name: name || `Service #${tokenId}`,
      maxSupply,
      totalMinted,
    });
    setIsPurchaseModalOpen(true);
  };

  if (totalServices === 0) {
    return (
      <Card className="p-8 text-center border-2 border-dashed">
        <p className="text-muted-foreground mb-2">No services available yet</p>
        <p className="text-sm text-muted-foreground">Check back later for available services</p>
      </Card>
    );
  }

  return (
    <>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: totalServices }, (_, i) => {
          const tokenId = i + 1;
          return <ServiceBrowseCard key={tokenId} tokenId={tokenId} metadata={allMetadata[tokenId]} onPurchase={handlePurchase} />;
        })}
      </div>

      {selectedService && (
        <PurchaseModal
          isOpen={isPurchaseModalOpen}
          onClose={() => setIsPurchaseModalOpen(false)}
          service={selectedService}
        />
      )}
    </>
  );
}

function ServiceBrowseCard({ tokenId, metadata, onPurchase }: { tokenId: number; metadata?: any; onPurchase: (tokenId: number, price: bigint, maxSupply: number, totalMinted: number, name: string) => void }) {
  const { useServiceInfo } = useServiceCredit();
  const serviceInfo = useServiceInfo(BigInt(tokenId));

  if (!serviceInfo.data) {
    return (
      <Card className="border-2 animate-pulse">
        <div className="aspect-video bg-muted"></div>
        <div className="p-6 space-y-3">
          <div className="h-4 bg-muted rounded w-3/4"></div>
          <div className="h-3 bg-muted rounded w-1/2"></div>
        </div>
      </Card>
    );
  }

  const price = serviceInfo.data[0];
  const maxSupply = Number(serviceInfo.data[2]);
  const totalMinted = Number(serviceInfo.data[3]);
  const active = serviceInfo.data[4];
  const available = maxSupply - totalMinted;

  if (!active) return null;

  return (
    <Card className="border-2 hover:border-accent transition-colors">
      {metadata?.image && (
        <div className="aspect-video bg-muted overflow-hidden">
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
      {!metadata?.image && (
        <div className="aspect-video bg-muted flex items-center justify-center">
          <div className="text-6xl font-bold text-muted-foreground/20">{metadata?.brand?.[0] || '#'}</div>
        </div>
      )}

      <div className="p-6">
        <h3 className="font-bold text-lg mb-1">{metadata?.brand || 'Service Provider'}</h3>
        <p className="text-muted-foreground text-sm mb-4">{metadata?.name || `Service #${tokenId}`}</p>

        {metadata?.description && (
          <p className="text-xs text-muted-foreground mb-4 line-clamp-2">{metadata.description}</p>
        )}

        <div className="space-y-2 mb-6">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-accent">{formatEther(price)} MNT</span>
          </div>
          <div className="text-xs text-muted-foreground">
            {available} available • {totalMinted} already sold
          </div>
        </div>

        <Button
          onClick={() => onPurchase(tokenId, price, maxSupply, totalMinted, metadata?.name || `Service #${tokenId}`)}
          disabled={available === 0}
          className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
        >
          {available === 0 ? 'Sold Out' : 'Purchase Token'}
        </Button>
      </div>
    </Card>
  );
}
