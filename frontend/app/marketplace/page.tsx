'use client';

import { Navigation } from "@/components/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useServiceCredit } from "@/hooks/useServiceCredit"
import { useState, useEffect, useMemo } from "react"
import { getAllServiceMetadata } from "@/lib/metadata-storage"
import { formatEther } from "viem"
import { PurchaseModal } from "@/components/purchase-modal"

export default function Marketplace() {
  const { useNextTokenId } = useServiceCredit();
  const nextTokenId = useNextTokenId();
  const totalServices = nextTokenId.data ? Number(nextTokenId.data) - 1 : 0;

  const [allMetadata, setAllMetadata] = useState<Record<number, any>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortBy, setSortBy] = useState("default");
  const [selectedService, setSelectedService] = useState<any>(null);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);

  useEffect(() => {
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

  // Get unique categories from metadata
  const categories = useMemo(() => {
    const cats = new Set<string>();
    Object.values(allMetadata).forEach((meta: any) => {
      if (meta?.category) cats.add(meta.category);
    });
    return Array.from(cats);
  }, [allMetadata]);

  return (
    <main className="min-h-screen">
      <Navigation />

      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12">
            <h1 className="text-5xl font-bold mb-4 text-balance">Service Marketplace</h1>
            <p className="text-xl text-muted-foreground text-pretty">
              Browse tokenized services and discover real yield opportunities.
            </p>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-12">
            <Input
              placeholder="Search services or businesses..."
              className="flex-1"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
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
            <select
              className="px-4 py-2 border border-input bg-background rounded-md"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="default">Default Order</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="available">Most Available</option>
            </select>
          </div>

          {/* Service Grid */}
          {totalServices === 0 ? (
            <Card className="p-12 text-center border-2 border-dashed">
              <p className="text-muted-foreground mb-2">No services available yet</p>
              <p className="text-sm text-muted-foreground">Check back later for tokenized services</p>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: totalServices }, (_, i) => {
                const tokenId = i + 1;
                return (
                  <MarketplaceServiceCard
                    key={tokenId}
                    tokenId={tokenId}
                    metadata={allMetadata[tokenId]}
                    searchQuery={searchQuery}
                    categoryFilter={categoryFilter}
                    onPurchase={handlePurchase}
                  />
                );
              })}
            </div>
          )}
        </div>
      </section>

      {selectedService && (
        <PurchaseModal
          isOpen={isPurchaseModalOpen}
          onClose={() => setIsPurchaseModalOpen(false)}
          service={selectedService}
        />
      )}

      <footer className="border-t border-border py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center text-sm text-muted-foreground">
          © 2025 ServiceFi. Built on Mantle Network.
        </div>
      </footer>
    </main>
  )
}

function MarketplaceServiceCard({
  tokenId,
  metadata,
  searchQuery,
  categoryFilter,
  onPurchase
}: {
  tokenId: number;
  metadata?: any;
  searchQuery: string;
  categoryFilter: string;
  onPurchase: (tokenId: number, price: bigint, maxSupply: number, totalMinted: number, name: string) => void;
}) {
  const { useServiceInfo } = useServiceCredit();
  const serviceInfo = useServiceInfo(BigInt(tokenId));

  if (!serviceInfo.data) {
    return null;
  }

  const price = serviceInfo.data[0];
  const expiryTimestamp = serviceInfo.data[1];
  const maxSupply = Number(serviceInfo.data[2]);
  const totalMinted = Number(serviceInfo.data[3]);
  const active = serviceInfo.data[4];
  const available = maxSupply - totalMinted;

  if (!active || available === 0) return null;

  // Apply search filter
  const serviceName = metadata?.name || `Service #${tokenId}`;
  const businessName = metadata?.brand || 'Service Provider';
  const searchLower = searchQuery.toLowerCase();
  if (searchQuery && !serviceName.toLowerCase().includes(searchLower) && !businessName.toLowerCase().includes(searchLower)) {
    return null;
  }

  // Apply category filter
  if (categoryFilter !== 'all' && metadata?.category !== categoryFilter) {
    return null;
  }

  // Calculate expiry
  const now = Math.floor(Date.now() / 1000);
  const expiresIn = Number(expiryTimestamp) - now;
  const daysLeft = Math.floor(expiresIn / (24 * 60 * 60));

  return (
    <Card className="overflow-hidden border-2 hover:border-accent transition-colors group">
      {metadata?.image ? (
        <div className="aspect-video bg-muted overflow-hidden">
          <img
            src={metadata.image}
            alt={serviceName}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>
      ) : (
        <div className="aspect-video bg-muted flex items-center justify-center">
          <div className="text-6xl font-bold text-muted-foreground/20">{businessName.charAt(0)}</div>
        </div>
      )}

      <div className="p-6">
        <div className="text-xs text-muted-foreground mb-2">{metadata?.category || 'Service'}</div>
        <h3 className="text-xl font-bold mb-1">{businessName}</h3>
        <p className="text-muted-foreground mb-4">{serviceName}</p>

        {metadata?.description && (
          <p className="text-xs text-muted-foreground mb-4 line-clamp-2">{metadata.description}</p>
        )}

        <div className="space-y-3 mb-6 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Token Price</span>
            <span className="font-bold">{formatEther(price)} MNT</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Token ID</span>
            <span className="font-mono">#{tokenId}</span>
          </div>
          <div className="pt-3 border-t border-border">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-muted-foreground">Available</span>
              <span className="font-medium">{available} / {maxSupply} tokens</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Expires in</span>
              <span className={daysLeft <= 7 ? "text-accent font-medium" : ""}>{daysLeft} days</span>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={() => onPurchase(tokenId, price, maxSupply, totalMinted, serviceName)}
            className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90"
            disabled={available === 0}
          >
            {available === 0 ? 'Sold Out' : 'Purchase'}
          </Button>
          <Button variant="outline" className="flex-1 bg-transparent">
            Details
          </Button>
        </div>
      </div>
    </Card>
  );
}
