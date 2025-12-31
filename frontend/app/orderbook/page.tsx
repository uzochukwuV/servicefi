'use client';

import { Navigation } from "@/components/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useState } from "react"
import { formatEther, parseEther } from "viem"
import { useMarketplace } from "@/hooks/useMarketplace"
import { useServiceCredit } from "@/hooks/useServiceCredit"
import { useAccount } from "wagmi"

export default function OrderBook() {
  const [selectedTokenId, setSelectedTokenId] = useState<bigint>(BigInt(1));
  const { address } = useAccount();

  return (
    <main className="min-h-screen">
      <Navigation />

      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12">
            <h1 className="text-5xl font-bold mb-4 text-balance">Order Book Marketplace</h1>
            <p className="text-xl text-muted-foreground text-pretty">
              Trade service tokens peer-to-peer with price bounds and dynamic discounts.
            </p>
          </div>

          {/* Token Selector */}
          <Card className="p-6 mb-8 border-2">
            <label className="block text-sm font-medium mb-2">Select Service Token</label>
            <div className="flex gap-4">
              <Input
                type="number"
                min="1"
                value={selectedTokenId.toString()}
                onChange={(e) => setSelectedTokenId(BigInt(e.target.value || "1"))}
                placeholder="Token ID"
                className="max-w-[200px]"
              />
              <ServiceTokenInfo tokenId={selectedTokenId} />
            </div>
          </Card>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Column - Order Book */}
            <div className="lg:col-span-2">
              <Card className="p-6 border-2">
                <h2 className="text-2xl font-bold mb-6">Order Book - Token #{selectedTokenId.toString()}</h2>
                <OrderBookDisplay tokenId={selectedTokenId} />
              </Card>

              {/* My Listings & Offers */}
              <Card className="p-6 border-2 mt-8">
                <Tabs defaultValue="listings">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="listings">My Listings</TabsTrigger>
                    <TabsTrigger value="offers">My Offers</TabsTrigger>
                  </TabsList>
                  <TabsContent value="listings">
                    <MyListings userAddress={address} />
                  </TabsContent>
                  <TabsContent value="offers">
                    <MyOffers userAddress={address} />
                  </TabsContent>
                </Tabs>
              </Card>
            </div>

            {/* Right Column - Trade Panel */}
            <div className="lg:col-span-1">
              <Card className="p-6 border-2 sticky top-24">
                <Tabs defaultValue="sell">
                  <TabsList className="grid w-full grid-cols-2 mb-6">
                    <TabsTrigger value="sell">Sell</TabsTrigger>
                    <TabsTrigger value="buy">Buy</TabsTrigger>
                  </TabsList>
                  <TabsContent value="sell">
                    <CreateListingForm tokenId={selectedTokenId} />
                  </TabsContent>
                  <TabsContent value="buy">
                    <BuyPanel tokenId={selectedTokenId} />
                  </TabsContent>
                </Tabs>
              </Card>

              {/* Price Info */}
              <Card className="p-6 border-2 mt-4">
                <h3 className="font-bold mb-4">Price Information</h3>
                <PriceInfo tokenId={selectedTokenId} />
              </Card>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-border py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center text-sm text-muted-foreground">
          © 2025 ServiceFi. Built on Mantle Network.
        </div>
      </footer>
    </main>
  );
}

function ServiceTokenInfo({ tokenId }: { tokenId: bigint }) {
  const { useServiceInfo } = useServiceCredit();
  const serviceInfo = useServiceInfo(tokenId);

  if (!serviceInfo.data) return <div className="text-sm text-muted-foreground">Loading...</div>;

  const price = serviceInfo.data[0];
  const expiryTimestamp = serviceInfo.data[1];
  const now = Math.floor(Date.now() / 1000);
  const daysLeft = Math.floor((Number(expiryTimestamp) - now) / (24 * 60 * 60));

  return (
    <div className="flex gap-6 text-sm">
      <div>
        <span className="text-muted-foreground">Fixed Price: </span>
        <span className="font-bold">{formatEther(price)} MNT</span>
      </div>
      <div>
        <span className="text-muted-foreground">Expires in: </span>
        <span className="font-bold">{daysLeft} days</span>
      </div>
    </div>
  );
}

function OrderBookDisplay({ tokenId }: { tokenId: bigint }) {
  const { useActiveListings, useBestAsk } = useMarketplace();
  const activeListings = useActiveListings(tokenId);
  const bestAsk = useBestAsk(tokenId);

  if (activeListings.isLoading) {
    return <div className="text-center py-8 text-muted-foreground">Loading order book...</div>;
  }

  const listingIds = activeListings.data || [];

  if (listingIds.length === 0) {
    return (
      <div className="text-center py-12 border-2 border-dashed rounded-lg">
        <p className="text-muted-foreground">No active listings for this token</p>
        <p className="text-sm text-muted-foreground mt-2">Be the first to create a listing!</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 p-4 bg-muted/50 rounded-lg">
        <div className="text-sm text-muted-foreground mb-1">Best Ask</div>
        <div className="text-2xl font-bold">
          {bestAsk.data ? `${formatEther(bestAsk.data)} MNT` : '—'}
        </div>
      </div>

      <div className="space-y-2">
        <div className="grid grid-cols-4 gap-4 text-xs font-medium text-muted-foreground pb-2 border-b">
          <div>SELLER</div>
          <div className="text-right">AMOUNT</div>
          <div className="text-right">ASK PRICE</div>
          <div className="text-right">ACTION</div>
        </div>

        {listingIds.map((listingId) => (
          <ListingRow key={listingId.toString()} listingId={listingId} />
        ))}
      </div>
    </div>
  );
}

function ListingRow({ listingId }: { listingId: bigint }) {
  const { useListing, buyListing } = useMarketplace();
  const { address } = useAccount();
  const listing = useListing(listingId);
  const [buyAmount, setBuyAmount] = useState("1");
  const [isBuying, setIsBuying] = useState(false);

  if (!listing.data || !listing.data[7]) return null; // Check if active

  const seller = listing.data[1] as `0x${string}`;
  const amount = listing.data[3];
  const askPrice = listing.data[4];
  const isOwnListing = address && seller.toLowerCase() === address.toLowerCase();

  const handleBuy = async () => {
    if (!buyAmount || Number(buyAmount) < 1) return;
    setIsBuying(true);
    try {
      const totalCost = askPrice * BigInt(buyAmount);
      await buyListing.writeContractAsync({
        args: [listingId, BigInt(buyAmount)],
        value: totalCost,
      });
    } catch (error) {
      console.error("Buy failed:", error);
    } finally {
      setIsBuying(false);
    }
  };

  return (
    <div className="grid grid-cols-4 gap-4 items-center py-3 border-b hover:bg-muted/50 transition-colors">
      <div className="font-mono text-xs">
        {seller.slice(0, 6)}...{seller.slice(-4)}
      </div>
      <div className="text-right font-medium">{amount.toString()}</div>
      <div className="text-right font-bold text-accent">{formatEther(askPrice)} MNT</div>
      <div className="text-right">
        {isOwnListing ? (
          <span className="text-xs text-muted-foreground">Your listing</span>
        ) : (
          <div className="flex gap-1 justify-end">
            <Input
              type="number"
              min="1"
              max={amount.toString()}
              value={buyAmount}
              onChange={(e) => setBuyAmount(e.target.value)}
              className="w-16 h-8 text-xs"
            />
            <Button
              size="sm"
              onClick={handleBuy}
              disabled={isBuying || !buyAmount}
              className="h-8 text-xs"
            >
              {isBuying ? "..." : "Buy"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function CreateListingForm({ tokenId }: { tokenId: bigint }) {
  const { createListing, getSuggestedPrice } = useMarketplace();
  const { useBalance } = useServiceCredit();
  const { address } = useAccount();
  const balance = useBalance(address, tokenId);
  const suggestedPrice = getSuggestedPrice(tokenId);

  const [amount, setAmount] = useState("");
  const [askPrice, setAskPrice] = useState("");
  const [duration, setDuration] = useState("7");
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    if (!amount || !askPrice) return;
    setIsCreating(true);
    try {
      await createListing.writeContractAsync({
        args: [
          tokenId,
          BigInt(amount),
          parseEther(askPrice),
          Number(duration),
        ],
      });
      setAmount("");
      setAskPrice("");
    } catch (error) {
      console.error("Create listing failed:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const userBalance = balance.data ? Number(balance.data) : 0;

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">
          Your Balance: {userBalance} tokens
        </label>
        <Input
          type="number"
          min="1"
          max={userBalance}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Amount to sell"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          Ask Price (MNT per token)
          {suggestedPrice.data && (
            <span className="ml-2 text-xs text-accent">
              Suggested: {formatEther(suggestedPrice.data)}
            </span>
          )}
        </label>
        <Input
          type="number"
          step="0.01"
          value={askPrice}
          onChange={(e) => setAskPrice(e.target.value)}
          placeholder="0.00"
        />
        <p className="text-xs text-muted-foreground mt-1">
          Price must be within 90-105% of fixed price
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Listing Duration</label>
        <select
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          className="w-full px-4 py-2 border border-input bg-background rounded-md"
        >
          <option value="1">1 day</option>
          <option value="3">3 days</option>
          <option value="7">7 days</option>
          <option value="14">14 days</option>
          <option value="30">30 days</option>
        </select>
      </div>

      {amount && askPrice && (
        <div className="p-4 bg-muted/50 rounded-lg space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">You will sell:</span>
            <span className="font-bold">{amount} tokens</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">You will receive:</span>
            <span className="font-bold">{(Number(amount) * Number(askPrice) * 0.98).toFixed(4)} MNT</span>
          </div>
          <div className="text-xs text-muted-foreground">
            (2% marketplace fee deducted)
          </div>
        </div>
      )}

      <Button
        onClick={handleCreate}
        disabled={isCreating || !amount || !askPrice || Number(amount) > userBalance}
        className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
      >
        {isCreating ? "Creating..." : "Create Listing"}
      </Button>
    </div>
  );
}

function BuyPanel({ tokenId }: { tokenId: bigint }) {
  const { makeOffer } = useMarketplace();
  const [listingId, setListingId] = useState("");
  const [amount, setAmount] = useState("");
  const [bidPrice, setBidPrice] = useState("");
  const [duration, setDuration] = useState("3");
  const [isOffering, setIsOffering] = useState(false);

  const handleOffer = async () => {
    if (!listingId || !amount || !bidPrice) return;
    setIsOffering(true);
    try {
      const totalCost = parseEther(bidPrice) * BigInt(amount);
      await makeOffer.writeContractAsync({
        args: [
          BigInt(listingId),
          BigInt(amount),
          parseEther(bidPrice),
          Number(duration),
        ],
        value: totalCost,
      });
      setListingId("");
      setAmount("");
      setBidPrice("");
    } catch (error) {
      console.error("Make offer failed:", error);
    } finally {
      setIsOffering(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">Listing ID</label>
        <Input
          type="number"
          min="1"
          value={listingId}
          onChange={(e) => setListingId(e.target.value)}
          placeholder="Enter listing ID"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Amount</label>
        <Input
          type="number"
          min="1"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Tokens to buy"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Bid Price (MNT per token)</label>
        <Input
          type="number"
          step="0.01"
          value={bidPrice}
          onChange={(e) => setBidPrice(e.target.value)}
          placeholder="0.00"
        />
        <p className="text-xs text-muted-foreground mt-1">
          Bid must be below the ask price
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Offer Duration</label>
        <select
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          className="w-full px-4 py-2 border border-input bg-background rounded-md"
        >
          <option value="1">1 day</option>
          <option value="3">3 days</option>
          <option value="7">7 days</option>
        </select>
      </div>

      {amount && bidPrice && (
        <div className="p-4 bg-muted/50 rounded-lg space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total cost:</span>
            <span className="font-bold">{(Number(amount) * Number(bidPrice)).toFixed(4)} MNT</span>
          </div>
          <div className="text-xs text-muted-foreground">
            (Locked until offer accepted or expires)
          </div>
        </div>
      )}

      <Button
        onClick={handleOffer}
        disabled={isOffering || !listingId || !amount || !bidPrice}
        className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
      >
        {isOffering ? "Submitting..." : "Make Offer"}
      </Button>
    </div>
  );
}

function PriceInfo({ tokenId }: { tokenId: bigint }) {
  const { usePriceBounds, getSuggestedPrice } = useMarketplace();
  const priceBounds = usePriceBounds(tokenId);
  const suggestedPrice = getSuggestedPrice(tokenId);

  if (priceBounds.isLoading) return <div className="text-sm text-muted-foreground">Loading...</div>;

  const bounds = priceBounds.data;
  if (!bounds) return null;

  return (
    <div className="space-y-3 text-sm">
      <div className="flex justify-between">
        <span className="text-muted-foreground">Fixed Price:</span>
        <span className="font-bold">{formatEther(bounds[2])} MNT</span>
      </div>
      <div className="flex justify-between">
        <span className="text-muted-foreground">Min Price:</span>
        <span>{formatEther(bounds[0])} MNT</span>
      </div>
      <div className="flex justify-between">
        <span className="text-muted-foreground">Max Price:</span>
        <span>{formatEther(bounds[1])} MNT</span>
      </div>
      <div className="pt-3 border-t">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Suggested Price:</span>
          <span className="font-bold text-accent">
            {suggestedPrice.data ? formatEther(suggestedPrice.data) : '—'} MNT
          </span>
        </div>
      </div>
      <div className="text-xs text-muted-foreground">
        Price bounds: {Number(bounds[4]) / 100}% - {Number(bounds[5]) / 100}%
      </div>
    </div>
  );
}

function MyListings({ userAddress }: { userAddress?: `0x${string}` }) {
  const { useUserActiveListings, cancelListing } = useMarketplace();
  const userListings = useUserActiveListings(userAddress);

  if (!userAddress) {
    return <div className="text-center py-8 text-muted-foreground">Connect wallet to view listings</div>;
  }

  if (userListings.isLoading) {
    return <div className="text-center py-8 text-muted-foreground">Loading your listings...</div>;
  }

  const listingIds = userListings.data || [];

  if (listingIds.length === 0) {
    return <div className="text-center py-8 text-muted-foreground">You have no active listings</div>;
  }

  return (
    <div className="space-y-4 mt-4">
      {listingIds.map((listingId) => (
        <MyListingCard key={listingId.toString()} listingId={listingId} onCancel={cancelListing} />
      ))}
    </div>
  );
}

function MyListingCard({ listingId, onCancel }: { listingId: bigint; onCancel: any }) {
  const { useListing } = useMarketplace();
  const listing = useListing(listingId);
  const [isCanceling, setIsCanceling] = useState(false);

  if (!listing.data) return null;

  const tokenId = listing.data[2];
  const amount = listing.data[3];
  const askPrice = listing.data[4];
  const expiresAt = listing.data[6];
  const active = listing.data[7];

  if (!active) return null;

  const handleCancel = async () => {
    setIsCanceling(true);
    try {
      await onCancel.writeContractAsync({ args: [listingId] });
    } catch (error) {
      console.error("Cancel failed:", error);
    } finally {
      setIsCanceling(false);
    }
  };

  const now = Math.floor(Date.now() / 1000);
  const hoursLeft = Math.floor((Number(expiresAt) - now) / 3600);

  return (
    <Card className="p-4 border">
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <div className="font-mono text-sm text-muted-foreground">Listing #{listingId.toString()}</div>
          <div className="text-sm">
            <span className="font-bold">{amount.toString()}</span> tokens of{" "}
            <span className="font-bold">#{tokenId.toString()}</span>
          </div>
          <div className="text-lg font-bold text-accent">{formatEther(askPrice)} MNT/token</div>
          <div className="text-xs text-muted-foreground">Expires in {hoursLeft}h</div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleCancel}
          disabled={isCanceling}
        >
          {isCanceling ? "..." : "Cancel"}
        </Button>
      </div>
    </Card>
  );
}

function MyOffers({ userAddress }: { userAddress?: `0x${string}` }) {
  if (!userAddress) {
    return <div className="text-center py-8 text-muted-foreground">Connect wallet to view offers</div>;
  }

  return (
    <div className="text-center py-8 text-muted-foreground">
      <p>No active offers</p>
      <p className="text-xs mt-2">Make an offer on a listing to see it here</p>
    </div>
  );
}
