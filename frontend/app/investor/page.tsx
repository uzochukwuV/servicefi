'use client';

import { Navigation } from "@/components/navigation"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LPDepositForm } from "@/components/lp-deposit-form"
import { InvestorStats } from "@/components/investor-stats"
import { InvestmentOpportunities } from "@/components/investment-opportunities"
import { MyPortfolio } from "@/components/my-portfolio"

export default function InvestorDashboard() {
  return (
    <main className="min-h-screen bg-muted/30">
      <Navigation />

      <section className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Investor Dashboard</h1>
            <p className="text-muted-foreground">Provide liquidity and earn real yield from service consumption</p>
          </div>

          {/* Portfolio Overview */}
          <InvestorStats />

          {/* Main Content */}
          <Tabs defaultValue="opportunities" className="space-y-6">
            <TabsList className="bg-card border border-border">
              <TabsTrigger value="opportunities">Investment Opportunities</TabsTrigger>
              <TabsTrigger value="portfolio">My Portfolio</TabsTrigger>
              <TabsTrigger value="pools">Add Liquidity</TabsTrigger>
            </TabsList>

            {/* Investment Opportunities */}
            <TabsContent value="opportunities" className="space-y-6">
              <InvestmentOpportunities />
            </TabsContent>

            {/* My Portfolio */}
            <TabsContent value="portfolio" className="space-y-6">
              <MyPortfolio />
            </TabsContent>

            {/* Pool Management */}
            <TabsContent value="pools" className="space-y-6">
              <div className="max-w-2xl mx-auto">
                <LPDepositForm />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>
    </main>
  )
}
