import { Navigation } from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import Link from "next/link"

export default function Home() {
  return (
    <main className="min-h-screen">
      <Navigation />

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-3xl">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-tight text-balance mb-6">
              Turn Future Services Into <span className="text-accent">Instant Liquidity</span>
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed mb-8 text-pretty">
              ServiceFi enables service businesses to tokenize their capacity and access immediate working capital. Real
              yield from real work—no speculation required.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90" asChild>
                <Link href="/marketplace">Browse Services</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/how-it-works">Learn How It Works</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-muted/50">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            <div>
              <div className="text-4xl font-bold mb-2">$2.4M</div>
              <div className="text-sm text-muted-foreground">Total Liquidity Provided</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">156</div>
              <div className="text-sm text-muted-foreground">Active Businesses</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">8.2%</div>
              <div className="text-sm text-muted-foreground">Average LP Yield</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">94%</div>
              <div className="text-sm text-muted-foreground">Redemption Rate</div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Overview */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-balance">A New Category of RealFi</h2>
          <p className="text-lg text-muted-foreground mb-12 max-w-2xl text-pretty">
            Time-based, consumption-backed real-world assets that bring DeFi capital to everyday service economies.
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="p-8 border-2 hover:border-accent transition-colors">
              <div className="w-12 h-12 bg-accent/10 flex items-center justify-center rounded-lg mb-6">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3">Businesses Mint Tokens</h3>
              <p className="text-muted-foreground leading-relaxed">
                Service providers create ERC1155 tokens representing real services—haircuts, gym sessions, consultations—with
                IPFS metadata, fixed prices and expiration dates.
              </p>
            </Card>

            <Card className="p-8 border-2 hover:border-accent transition-colors">
              <div className="w-12 h-12 bg-accent/10 flex items-center justify-center rounded-lg mb-6">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3">Instant Liquidity</h3>
              <p className="text-muted-foreground leading-relaxed">
                DeFi pools provide instant liquidity by purchasing tokens at discounted rates. Businesses get immediate
                working capital to pay rent, staff, and operations.
              </p>
            </Card>

            <Card className="p-8 border-2 hover:border-accent transition-colors">
              <div className="w-12 h-12 bg-accent/10 flex items-center justify-center rounded-lg mb-6">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3">Real Yield</h3>
              <p className="text-muted-foreground leading-relaxed">
                Customers redeem tokens for services. The discount spread becomes yield for liquidity providers—backed
                by real economic activity, not speculation.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Platform Features */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-balance text-center">Complete DeFi Ecosystem for Service Tokens</h2>
          <p className="text-lg text-muted-foreground mb-12 max-w-2xl mx-auto text-pretty text-center">
            Everything you need to tokenize, trade, and earn yield from service credits—all on Mantle Network.
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="p-6 border-2">
              <div className="w-10 h-10 bg-accent/10 flex items-center justify-center rounded-lg mb-4">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                </svg>
              </div>
              <h3 className="font-bold mb-2">Liquidity Pools</h3>
              <p className="text-sm text-muted-foreground">
                Provide MNT liquidity to earn yield from service redemptions. Lock funds for 7+ days to receive LP discounts.
              </p>
            </Card>

            <Card className="p-6 border-2">
              <div className="w-10 h-10 bg-accent/10 flex items-center justify-center rounded-lg mb-4">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="font-bold mb-2">Order Book Marketplace</h3>
              <p className="text-sm text-muted-foreground">
                Trade service tokens peer-to-peer with price bounds (90-105% of fixed price). Dynamic discounts based on expiry.
              </p>
            </Card>

            <Card className="p-6 border-2">
              <div className="w-10 h-10 bg-accent/10 flex items-center justify-center rounded-lg mb-4">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="font-bold mb-2">IPFS Metadata</h3>
              <p className="text-sm text-muted-foreground">
                All service data stored on IPFS via Pinata. Decentralized metadata for names, images, descriptions, and categories.
              </p>
            </Card>

            <Card className="p-6 border-2">
              <div className="w-10 h-10 bg-accent/10 flex items-center justify-center rounded-lg mb-4">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="font-bold mb-2">Redemption Oracle</h3>
              <p className="text-sm text-muted-foreground">
                Secure redemption verification system. Customers redeem tokens for real services with on-chain proof.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold mb-12 text-balance">Real Services, Real Businesses</h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: "Personal Services", items: ["Haircuts", "Spa Treatments", "Fitness Classes"] },
              {
                title: "Professional Services",
                items: ["Legal Consultations", "Medical Appointments", "Therapy Sessions"],
              },
              { title: "Business Services", items: ["Coworking Hours", "Cloud Storage", "SaaS Subscriptions"] },
              { title: "Local Services", items: ["Car Washes", "Dry Cleaning", "Home Maintenance"] },
            ].map((category, idx) => (
              <Card key={idx} className="p-6 border-2">
                <h3 className="font-bold mb-4">{category.title}</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {category.items.map((item, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-accent rounded-full" />
                      {item}
                    </li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Why ServiceFi */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-balance text-center">Why ServiceFi?</h2>
          <p className="text-lg text-muted-foreground mb-12 max-w-2xl mx-auto text-pretty text-center">
            The only protocol designed specifically for service-based businesses and real-world utility tokens.
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="p-6 border-2">
              <h3 className="font-bold text-lg mb-3">For Businesses</h3>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>Get immediate working capital by pre-selling future services</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>No debt, no dilution—just prepaid revenue</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>Built-in customer acquisition and loyalty rewards</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>Decentralized metadata stored on IPFS for transparency</span>
                </li>
              </ul>
            </Card>

            <Card className="p-6 border-2">
              <h3 className="font-bold text-lg mb-3">For Customers</h3>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>Purchase services at discounted rates (save 2-15%)</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>Resell unused tokens on secondary marketplace</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>Trade tokens with dynamic pricing (30-105% based on expiry)</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>Secure redemption process verified by oracle</span>
                </li>
              </ul>
            </Card>

            <Card className="p-6 border-2">
              <h3 className="font-bold text-lg mb-3">For Investors</h3>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>Earn real yield from actual service consumption</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>Provide liquidity to pools and earn 10% LP discounts</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>Diversify across service categories and risk levels</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>Transparent on-chain data for all investments</span>
                </li>
              </ul>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="border-2 border-border p-12 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-balance">Ready to Turn Services Into Liquidity?</h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto text-pretty">
              Join the ServiceFi ecosystem. Whether you're a business seeking capital, a customer wanting discounts, or
              an investor seeking real yield.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90" asChild>
                <Link href="/business">List Your Business</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/investor">Become an LP</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="font-bold text-lg mb-4">ServiceFi</div>
              <p className="text-sm text-muted-foreground">Tokenized service credits for instant business liquidity.</p>
            </div>
            <div>
              <div className="font-bold mb-4">Product</div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="/how-it-works" className="hover:text-accent transition-colors">
                    How It Works
                  </Link>
                </li>
                <li>
                  <Link href="/marketplace" className="hover:text-accent transition-colors">
                    Marketplace
                  </Link>
                </li>
                <li>
                  <Link href="/about" className="hover:text-accent transition-colors">
                    About
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <div className="font-bold mb-4">For</div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="/business" className="hover:text-accent transition-colors">
                    Businesses
                  </Link>
                </li>
                <li>
                  <Link href="/customer" className="hover:text-accent transition-colors">
                    Customers
                  </Link>
                </li>
                <li>
                  <Link href="/investor" className="hover:text-accent transition-colors">
                    Investors
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <div className="font-bold mb-4">Resources</div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="#" className="hover:text-accent transition-colors">
                    Documentation
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-accent transition-colors">
                    Whitepaper
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-accent transition-colors">
                    GitHub
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-border text-sm text-muted-foreground text-center">
            © 2025 ServiceFi. Built on Mantle Network.
          </div>
        </div>
      </footer>
    </main>
  )
}
