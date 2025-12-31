'use client';

import { Navigation } from "@/components/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CustomerStats } from "@/components/customer-stats"
import { BrowseServices } from "@/components/browse-services"
import { MyWallet } from "@/components/my-wallet"
import { TransactionHistory } from "@/components/transaction-history"

export default function CustomerPortal() {
  return (
    <main className="min-h-screen bg-muted/30">
      <Navigation />

      <section className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Customer Portal</h1>
            <p className="text-muted-foreground">Browse, purchase, and redeem service tokens</p>
          </div>

          {/* Quick Stats */}
          <CustomerStats />

          {/* Main Content */}
          <Tabs defaultValue="browse" className="space-y-6">
            <TabsList className="bg-card border border-border">
              <TabsTrigger value="browse">Browse Services</TabsTrigger>
              <TabsTrigger value="wallet">My Wallet</TabsTrigger>
              <TabsTrigger value="redeem">Redeem Token</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>

            {/* Browse Services */}
            <TabsContent value="browse" className="space-y-6">
              <BrowseServices />
            </TabsContent>

            {/* My Wallet */}
            <TabsContent value="wallet" className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">My Service Tokens</h2>
              </div>
              <MyWallet />
            </TabsContent>

            {/* Redeem Token */}
            <TabsContent value="redeem" className="space-y-6">
              <Card className="p-12 border-2 border-dashed max-w-2xl mx-auto text-center">
                <h2 className="text-2xl font-bold mb-4">Redeem Service Token</h2>
                <p className="text-muted-foreground mb-2">Redemption functionality requires Oracle integration</p>
                <p className="text-sm text-muted-foreground">This will be available after deploying the Redemption Oracle contract</p>
              </Card>
            </TabsContent>

            {/* Transaction History */}
            <TabsContent value="history" className="space-y-6">
              <TransactionHistory />
            </TabsContent>
          </Tabs>
        </div>
      </section>
    </main>
  )
}
