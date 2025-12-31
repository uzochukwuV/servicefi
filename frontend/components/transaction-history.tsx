'use client';

import { Card } from "@/components/ui/card";
import { useAccount } from "wagmi";
import { useChainId, usePublicClient } from "wagmi";
import { useState, useEffect } from "react";
import { getContractAddress } from "@/lib/contracts/addresses";
import { ServiceCreditTokenABI } from "@/lib/contracts/abis";
import { formatEther } from "viem";
import { getServiceMetadata } from "@/lib/metadata-storage";

interface Transaction {
  date: string;
  type: string;
  service: string;
  business: string;
  amount: string;
  status: string;
  tokenId: number;
  timestamp: number;
}

export function TransactionHistory() {
  const { address } = useAccount();
  const chainId = useChainId();
  const publicClient = usePublicClient();
  const chainName = (chainId === 5003) ? 'mantleSepoliaTestnet' : 'mantleMainnet';
  const contractAddress = getContractAddress(chainName, 'serviceCreditToken') as `0x${string}`;

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!address || !publicClient) return;

    const fetchTransactions = async () => {
      setIsLoading(true);
      try {
        const txs: Transaction[] = [];

        // Get TransferSingle events (purchases and transfers)
        const transferLogs = await publicClient.getLogs({
          address: contractAddress,
          event: {
            type: 'event',
            name: 'TransferSingle',
            inputs: [
              { type: 'address', indexed: true, name: 'operator' },
              { type: 'address', indexed: true, name: 'from' },
              { type: 'address', indexed: true, name: 'to' },
              { type: 'uint256', indexed: false, name: 'id' },
              { type: 'uint256', indexed: false, name: 'value' },
            ],
          },
          fromBlock: BigInt(0),
          toBlock: 'latest',
        });

        // Filter for transactions involving the user
        for (const log of transferLogs) {
          const { from, to, id, value } = log.args as any;

          if (to === address || from === address) {
            const block = await publicClient.getBlock({ blockNumber: log.blockNumber });
            const timestamp = Number(block.timestamp);
            const date = new Date(timestamp * 1000);

            // Get service metadata
            const metadata = getServiceMetadata(Number(id));
            const serviceName = metadata?.name || `Service #${id}`;
            const businessName = metadata?.brand || 'Unknown Business';

            // Determine transaction type
            let type = 'Transfer';
            let status = 'Completed';

            // If from is zero address, it's a mint/purchase
            if (from === '0x0000000000000000000000000000000000000000') {
              type = 'Purchase';
              status = 'Active';
            } else if (to === '0x0000000000000000000000000000000000000000') {
              type = 'Burn';
              status = 'Completed';
            } else if (to === address) {
              type = 'Received';
              status = 'Active';
            } else if (from === address) {
              type = 'Sent';
              status = 'Completed';
            }

            txs.push({
              date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
              type,
              service: serviceName,
              business: businessName,
              amount: Number(value).toString(),
              status,
              tokenId: Number(id),
              timestamp,
            });
          }
        }

        // Get ServiceRedeemed events
        try {
          const redeemLogs = await publicClient.getLogs({
            address: contractAddress,
            event: {
              type: 'event',
              name: 'ServiceRedeemed',
              inputs: [
                { type: 'uint256', indexed: true, name: 'tokenId' },
                { type: 'address', indexed: true, name: 'customer' },
                { type: 'uint256', indexed: false, name: 'amount' },
              ],
            },
            fromBlock: BigInt(0),
            toBlock: 'latest',
          });

          // Filter redemptions for this user
          for (const log of redeemLogs) {
            const { tokenId, customer, amount } = log.args as any;

            if (customer === address) {
              const block = await publicClient.getBlock({ blockNumber: log.blockNumber });
              const timestamp = Number(block.timestamp);
              const date = new Date(timestamp * 1000);

              const metadata = getServiceMetadata(Number(tokenId));
              const serviceName = metadata?.name || `Service #${tokenId}`;
              const businessName = metadata?.brand || 'Unknown Business';

              txs.push({
                date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                type: 'Redemption',
                service: serviceName,
                business: businessName,
                amount: Number(amount).toString(),
                status: 'Completed',
                tokenId: Number(tokenId),
                timestamp,
              });
            }
          }
        } catch (error) {
          // ServiceRedeemed events may not exist yet
          console.log('No redemption events found');
        }

        // Sort by timestamp descending (newest first)
        txs.sort((a, b) => b.timestamp - a.timestamp);
        setTransactions(txs);
      } catch (error) {
        console.error('Error fetching transaction history:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTransactions();
  }, [address, publicClient, contractAddress]);

  if (!address) {
    return (
      <Card className="p-8 text-center border-2">
        <p className="text-muted-foreground">Connect your wallet to view transaction history</p>
      </Card>
    );
  }

  const filteredTransactions = transactions.filter((tx) => {
    if (filter === 'all') return true;
    if (filter === 'purchases') return tx.type === 'Purchase';
    if (filter === 'redemptions') return tx.type === 'Redemption';
    if (filter === 'transfers') return tx.type === 'Transfer' || tx.type === 'Sent' || tx.type === 'Received';
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Transaction History</h2>
        <select
          className="px-4 py-2 border border-input bg-background text-sm rounded-md"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="all">All Transactions</option>
          <option value="purchases">Purchases</option>
          <option value="redemptions">Redemptions</option>
          <option value="transfers">Transfers</option>
        </select>
      </div>

      {isLoading ? (
        <Card className="p-8 text-center border-2">
          <p className="text-muted-foreground">Loading transaction history...</p>
        </Card>
      ) : filteredTransactions.length === 0 ? (
        <Card className="p-8 text-center border-2 border-dashed">
          <p className="text-muted-foreground mb-2">No transactions found</p>
          <p className="text-sm text-muted-foreground">
            {filter === 'all'
              ? 'Purchase some service tokens to get started'
              : `No ${filter} to display`}
          </p>
        </Card>
      ) : (
        <Card className="border-2">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-border">
                <tr className="text-left">
                  <th className="p-4 text-sm font-medium">Date</th>
                  <th className="p-4 text-sm font-medium">Type</th>
                  <th className="p-4 text-sm font-medium">Service</th>
                  <th className="p-4 text-sm font-medium">Business</th>
                  <th className="p-4 text-sm font-medium">Amount</th>
                  <th className="p-4 text-sm font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((item, idx) => (
                  <tr key={idx} className="border-b border-border last:border-0 hover:bg-muted/50">
                    <td className="p-4 text-sm">{item.date}</td>
                    <td className="p-4 text-sm">
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          item.type === "Purchase" || item.type === "Received"
                            ? "bg-accent/10 text-accent"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {item.type}
                      </span>
                    </td>
                    <td className="p-4 text-sm font-medium">{item.service}</td>
                    <td className="p-4 text-sm text-muted-foreground">{item.business}</td>
                    <td className="p-4 text-sm font-bold">{item.amount} token{item.amount !== '1' ? 's' : ''}</td>
                    <td className="p-4">
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          item.status === "Active"
                            ? "bg-accent/10 text-accent"
                            : item.status === "Completed"
                              ? "bg-muted text-muted-foreground"
                              : "bg-destructive/10 text-destructive"
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
