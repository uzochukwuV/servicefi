'use client';

import { useAccount, useConnect, useDisconnect, useChainId, useSwitchChain } from 'wagmi';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Wallet, LogOut, Copy, ExternalLink } from 'lucide-react';
import { useState } from 'react';
import { mantle, mantleSepoliaTestnet } from 'wagmi/chains';
import { defineChain } from 'viem';



export function WalletConnect() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const [copied, setCopied] = useState(false);

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const getExplorerUrl = () => {
    if (chainId === 5003) {
      return `https://explorer.testnet.mantle.xyz/address/${address}`;
    }
    return `https://explorer.mantle.xyz/address/${address}`;
  };

  const isCorrectNetwork = chainId === 5003 || chainId === 5000;

  if (!isConnected) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button className="bg-accent text-accent-foreground hover:bg-accent/90">
            <Wallet className="w-4 h-4 mr-2" />
            Connect Wallet
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Choose Wallet</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {connectors.map((connector) => (
            <DropdownMenuItem
              key={connector.id}
              onClick={() => connect({ connector })}
              className="cursor-pointer"
            >
              {connector.name}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {!isCorrectNetwork && (
        <Button
          variant="destructive"
          size="sm"
          onClick={() => switchChain({ chainId: mantleSepoliaTestnet.id })}
        >
          Switch to Mantle
        </Button>
      )}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="font-mono">
            <Wallet className="w-4 h-4 mr-2" />
            {formatAddress(address!)}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground mb-1">Connected Wallet</span>
              <span className="font-mono text-xs">{formatAddress(address!)}</span>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={copyAddress} className="cursor-pointer">
            <Copy className="w-4 h-4 mr-2" />
            {copied ? 'Copied!' : 'Copy Address'}
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <a
              href={getExplorerUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="cursor-pointer"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              View on Explorer
            </a>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuLabel className="text-xs text-muted-foreground">
            Network: {chainId === 5003 ? 'Mantle Testnet' : 'Mantle Mainnet'}
          </DropdownMenuLabel>
          {chainId === 5003 && (
            <DropdownMenuItem
              onClick={() => switchChain({ chainId: mantle.id })}
              className="cursor-pointer text-xs"
            >
              Switch to Mainnet
            </DropdownMenuItem>
          )}
          {chainId === 5000 && (
            <DropdownMenuItem
              onClick={() => switchChain({ chainId: mantleSepoliaTestnet.id })}
              className="cursor-pointer text-xs"
            >
              Switch to Testnet
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => disconnect()} className="cursor-pointer text-destructive">
            <LogOut className="w-4 h-4 mr-2" />
            Disconnect
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
