'use client';

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useServiceCredit } from "@/hooks/useServiceCredit";
import { useAccount } from "wagmi";
import { formatEther } from "viem";
import { useState, useEffect } from "react";
import { getServiceMetadata } from "@/lib/metadata-storage";
import { useReadContract } from "wagmi";
import { ServiceCreditTokenABI } from "@/lib/contracts/abis";
import { getContractAddress } from "@/lib/contracts/addresses";
import { useChainId } from "wagmi";

export function MyWallet() {
  const { address } = useAccount();
  const chainId = useChainId();
  const chainName = (chainId === 5003) ? 'mantleSepoliaTestnet' : 'mantleMainnet';
  const contractAddress = getContractAddress(chainName, 'serviceCreditToken') as `0x${string}`;

  const { useNextTokenId, useServiceInfo } = useServiceCredit();
  const nextTokenId = useNextTokenId();
  const totalServices = nextTokenId.data ? Number(nextTokenId.data) - 1 : 0;

  const [ownedTokens, setOwnedTokens] = useState<number[]>([]);

  // Check balances for all token IDs
  useEffect(() => {
    if (!address || totalServices === 0) return;

    const checkBalances = async () => {
      const owned: number[] = [];
      for (let i = 1; i <= totalServices; i++) {
        // We'll check balance in the TokenCard component
        owned.push(i);
      }
      setOwnedTokens(owned);
    };

    checkBalances();
  }, [address, totalServices]);

  if (!address) {
    return (
      <Card className="p-8 text-center border-2">
        <p className="text-muted-foreground">Connect your wallet to view your tokens</p>
      </Card>
    );
  }

  if (totalServices === 0) {
    return (
      <Card className="p-8 text-center border-2 border-dashed">
        <p className="text-muted-foreground mb-2">No services available</p>
        <p className="text-sm text-muted-foreground">Browse services to purchase tokens</p>
      </Card>
    );
  }

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {ownedTokens.map((tokenId) => (
        <WalletTokenCard key={tokenId} tokenId={tokenId} userAddress={address} contractAddress={contractAddress} />
      ))}
    </div>
  );
}

function WalletTokenCard({ tokenId, userAddress, contractAddress }: { tokenId: number; userAddress: `0x${string}`; contractAddress: `0x${string}` }) {
  const { useServiceInfo } = useServiceCredit();
  const [metadata, setMetadata] = useState<any>(null);

  const serviceInfo = useServiceInfo(BigInt(tokenId));

  // Get user's balance for this token
  const balance = useReadContract({
    address: contractAddress,
    abi: ServiceCreditTokenABI,
    functionName: 'balanceOf',
    args: [userAddress, BigInt(tokenId)],
  });

  useEffect(() => {
    const meta = getServiceMetadata(tokenId);
    setMetadata(meta);
  }, [tokenId]);

  const userBalance = balance.data ? Number(balance.data) : 0;

  // Don't show if user has no balance
  if (userBalance === 0) return null;

  if (!serviceInfo.data) {
    return null;
  }

  const price = serviceInfo.data[0];
  const expiryTimestamp = serviceInfo.data[1];
  const active = serviceInfo.data[4];

  const now = Math.floor(Date.now() / 1000);
  const expiresIn = Number(expiryTimestamp) - now;
  const daysLeft = Math.floor(expiresIn / (24 * 60 * 60));
  const isExpiring = daysLeft <= 7 && daysLeft > 0;
  const isExpired = daysLeft <= 0;

  return (
    <Card className={`p-6 border-2 ${isExpiring ? "border-accent" : isExpired ? "border-destructive" : ""}`}>
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-bold text-lg mb-1">{metadata?.brand || 'Service Provider'}</h3>
          <p className="text-sm text-muted-foreground">{metadata?.name || `Service #${tokenId}`}</p>
        </div>
        <div className={`text-xs px-2 py-1 ${isExpiring ? "bg-accent/10 text-accent" : isExpired ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground"}`}>
          {isExpired ? "Expired" : isExpiring ? "Expiring Soon" : "Active"}
        </div>
      </div>

      <div className="space-y-2 mb-4 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Token ID</span>
          <span className="font-mono">#{tokenId}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Balance</span>
          <span className="font-bold">{userBalance} token{userBalance !== 1 ? 's' : ''}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Value per token</span>
          <span className="font-bold">{formatEther(price)} MNT</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Total Value</span>
          <span className="font-bold text-accent">{formatEther(price * BigInt(userBalance))} MNT</span>
        </div>
        <div className="flex justify-between pt-2 border-t border-border">
          <span className="text-muted-foreground">Expires in</span>
          <span className={isExpiring ? "text-accent font-bold" : isExpired ? "text-destructive" : ""}>
            {isExpired ? "Expired" : `${daysLeft} day${daysLeft !== 1 ? 's' : ''}`}
          </span>
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90"
          disabled={isExpired}
        >
          Redeem Now
        </Button>
        <Button variant="outline" className="flex-1 bg-transparent">
          Transfer
        </Button>
      </div>
    </Card>
  );
}
