'use client';

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useServiceCredit } from "@/hooks/useServiceCredit";
import { formatEther, parseEther } from "viem";
import { toast } from "sonner";

interface PurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  service: {
    tokenId: bigint;
    price: bigint;
    name: string;
    maxSupply: number;
    totalMinted: number;
  };
}

export function PurchaseModal({ isOpen, onClose, service }: PurchaseModalProps) {
  const [amount, setAmount] = useState(1);
  const { mintCredit, isPending } = useServiceCredit();

  const totalCost = service.price * BigInt(amount);
  const remaining = service.maxSupply - service.totalMinted;

  const handlePurchase = async () => {
    if (amount > remaining) {
      toast.error(`Only ${remaining} tokens available`);
      return;
    }

    try {
      await mintCredit(service.tokenId, BigInt(amount), service.price);
      toast.success(`Successfully purchased ${amount} ${service.name} credit(s)!`);
      onClose();
      setAmount(1);
    } catch (error: any) {
      toast.error(error.message || 'Purchase failed');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Purchase Service Credits</DialogTitle>
          <DialogDescription>{service.name}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Price per credit:</span>
            <span className="font-bold">{formatEther(service.price)} MNT</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Available:</span>
            <span className="font-medium">{remaining} / {service.maxSupply}</span>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Amount to purchase:</label>
            <Input
              type="number"
              min="1"
              max={remaining}
              value={amount}
              onChange={(e) => setAmount(Math.min(Number(e.target.value), remaining))}
            />
          </div>

          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Subtotal:</span>
              <span>{formatEther(totalCost)} MNT</span>
            </div>
            <div className="flex items-center justify-between font-bold text-lg">
              <span>Total:</span>
              <span>{formatEther(totalCost)} MNT</span>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={handlePurchase}
            disabled={isPending || amount < 1}
            className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90"
          >
            {isPending ? 'Processing...' : `Purchase ${amount} Credit${amount !== 1 ? 's' : ''}`}
          </Button>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
