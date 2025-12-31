import { Navigation } from "@/components/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function AdminPanel() {
  return (
    <main className="min-h-screen bg-muted/30">
      <Navigation />

      <section className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Admin Panel</h1>
            <p className="text-muted-foreground">Platform management and oversight</p>
          </div>

          {/* Platform Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card className="p-6">
              <div className="text-sm text-muted-foreground mb-1">Total Platform TVL</div>
              <div className="text-3xl font-bold">$2.4M</div>
              <div className="text-xs text-accent mt-1">+12.5% this month</div>
            </Card>
            <Card className="p-6">
              <div className="text-sm text-muted-foreground mb-1">Active Businesses</div>
              <div className="text-3xl font-bold">156</div>
              <div className="text-xs text-muted-foreground mt-1">12 pending verification</div>
            </Card>
            <Card className="p-6">
              <div className="text-sm text-muted-foreground mb-1">Platform Revenue</div>
              <div className="text-3xl font-bold">$48K</div>
              <div className="text-xs text-accent mt-1">2% transaction fee</div>
            </Card>
            <Card className="p-6">
              <div className="text-sm text-muted-foreground mb-1">Active Disputes</div>
              <div className="text-3xl font-bold">3</div>
              <div className="text-xs text-muted-foreground mt-1">Avg resolution: 2.4 days</div>
            </Card>
          </div>

          {/* Main Content */}
          <Tabs defaultValue="verification" className="space-y-6">
            <TabsList className="bg-card border border-border">
              <TabsTrigger value="verification">Business Verification</TabsTrigger>
              <TabsTrigger value="analytics">Platform Analytics</TabsTrigger>
              <TabsTrigger value="disputes">Dispute Resolution</TabsTrigger>
              <TabsTrigger value="config">System Config</TabsTrigger>
            </TabsList>

            {/* Business Verification */}
            <TabsContent value="verification" className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Pending Verifications</h2>
                <div className="flex gap-2">
                  <select className="px-4 py-2 border border-input bg-background text-sm">
                    <option>All Applications</option>
                    <option>New Submissions</option>
                    <option>Under Review</option>
                    <option>Requires Info</option>
                  </select>
                </div>
              </div>

              <div className="space-y-4">
                {[
                  {
                    business: "Urban Fitness Center",
                    type: "Fitness & Wellness",
                    submitted: "Dec 18, 2025",
                    documents: 3,
                    status: "Under Review",
                    risk: "Low",
                  },
                  {
                    business: "Downtown Legal Services",
                    type: "Professional Services",
                    submitted: "Dec 17, 2025",
                    documents: 3,
                    status: "Under Review",
                    risk: "Low",
                  },
                  {
                    business: "QuickCut Barbers",
                    type: "Personal Care",
                    submitted: "Dec 16, 2025",
                    documents: 2,
                    status: "Incomplete Docs",
                    risk: "Medium",
                  },
                  {
                    business: "Tech Repair Hub",
                    type: "Local Services",
                    submitted: "Dec 15, 2025",
                    documents: 3,
                    status: "Under Review",
                    risk: "Medium",
                  },
                ].map((app, idx) => (
                  <Card key={idx} className="p-6 border-2">
                    <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-bold text-lg">{app.business}</h3>
                            <p className="text-sm text-muted-foreground">{app.type}</p>
                          </div>
                          <div className="flex gap-2">
                            <div
                              className={`text-xs px-2 py-1 ${
                                app.status === "Under Review"
                                  ? "bg-accent/10 text-accent"
                                  : "bg-destructive/10 text-destructive"
                              }`}
                            >
                              {app.status}
                            </div>
                            <div
                              className={`text-xs px-2 py-1 ${
                                app.risk === "Low" ? "bg-accent/10 text-accent" : "bg-muted text-muted-foreground"
                              }`}
                            >
                              {app.risk} Risk
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Submitted:</span>{" "}
                            <span className="font-medium">{app.submitted}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Documents:</span>{" "}
                            <span className="font-medium">{app.documents}/3</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 lg:flex-col">
                        <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90">
                          Review
                        </Button>
                        <Button size="sm" variant="outline" className="bg-transparent">
                          Request Info
                        </Button>
                        <Button size="sm" variant="outline" className="bg-transparent">
                          Reject
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              <div className="flex justify-between items-center text-sm">
                <div className="text-muted-foreground">Showing 4 of 12 pending applications</div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    Previous
                  </Button>
                  <Button variant="outline" size="sm">
                    Next
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* Platform Analytics */}
            <TabsContent value="analytics" className="space-y-6">
              <h2 className="text-2xl font-bold">Platform Performance</h2>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className="p-6 border-2">
                  <h3 className="font-bold mb-4">Transaction Volume</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between py-2 border-b border-border">
                      <span className="text-muted-foreground">Total Transactions</span>
                      <span className="font-medium">8,742</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-border">
                      <span className="text-muted-foreground">Token Mints</span>
                      <span className="font-medium">3,256</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-border">
                      <span className="text-muted-foreground">Redemptions</span>
                      <span className="font-medium">4,892</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-muted-foreground">LP Investments</span>
                      <span className="font-medium">594</span>
                    </div>
                  </div>
                </Card>

                <Card className="p-6 border-2">
                  <h3 className="font-bold mb-4">Revenue Breakdown</h3>
                  <div className="space-y-4">
                    {[
                      { source: "Minting Fees", revenue: 28500, percent: 60 },
                      { source: "Redemption Fees", revenue: 14250, percent: 30 },
                      { source: "LP Fees", revenue: 4750, percent: 10 },
                    ].map((item, idx) => (
                      <div key={idx}>
                        <div className="flex justify-between mb-2 text-sm">
                          <span>{item.source}</span>
                          <span className="font-bold">${item.revenue.toLocaleString()}</span>
                        </div>
                        <div className="w-full h-2 bg-muted overflow-hidden">
                          <div className="h-full bg-accent" style={{ width: `${item.percent}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card className="p-6 border-2">
                  <h3 className="font-bold mb-4">Category Distribution</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between py-2 border-b border-border">
                      <span className="text-muted-foreground">Personal Care</span>
                      <span className="font-medium">42 businesses</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-border">
                      <span className="text-muted-foreground">Fitness</span>
                      <span className="font-medium">38 businesses</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-border">
                      <span className="text-muted-foreground">Professional</span>
                      <span className="font-medium">35 businesses</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-muted-foreground">Business Services</span>
                      <span className="font-medium">41 businesses</span>
                    </div>
                  </div>
                </Card>

                <Card className="p-6 border-2 md:col-span-2 lg:col-span-3">
                  <h3 className="font-bold mb-4">Platform Growth (Monthly)</h3>
                  <div className="h-48 flex items-end justify-between gap-2">
                    {[25, 38, 45, 52, 61, 68, 72, 78, 85, 91, 95, 100].map((height, idx) => (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                        <div
                          className="w-full bg-accent/20 hover:bg-accent/30 transition-colors"
                          style={{ height: `${height}%` }}
                        />
                        <div className="text-xs text-muted-foreground">
                          {["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"][idx]}
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card className="p-6 border-2 md:col-span-2 lg:col-span-3">
                  <h3 className="font-bold mb-4">Top Performing Businesses</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="border-b border-border">
                        <tr className="text-left">
                          <th className="p-3 text-sm font-medium">Business</th>
                          <th className="p-3 text-sm font-medium">Tokens Minted</th>
                          <th className="p-3 text-sm font-medium">Redemption Rate</th>
                          <th className="p-3 text-sm font-medium">Liquidity Raised</th>
                          <th className="p-3 text-sm font-medium">Score</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          {
                            name: "Elite Hair Studio",
                            minted: 852,
                            redemption: 94,
                            liquidity: "$42,600",
                            score: 4.9,
                          },
                          { name: "FitZone Gym", minted: 756, redemption: 96, liquidity: "$60,480", score: 4.8 },
                          {
                            name: "TechHub Coworking",
                            minted: 924,
                            redemption: 89,
                            liquidity: "$32,340",
                            score: 4.7,
                          },
                          { name: "Wellness Spa", minted: 614, redemption: 92, liquidity: "$55,260", score: 4.8 },
                          { name: "Legal Advisors", minted: 342, redemption: 98, liquidity: "$68,400", score: 5.0 },
                        ].map((business, idx) => (
                          <tr key={idx} className="border-b border-border last:border-0 hover:bg-muted/50">
                            <td className="p-3 text-sm font-medium">{business.name}</td>
                            <td className="p-3 text-sm">{business.minted}</td>
                            <td className="p-3 text-sm">
                              <span className="text-accent font-medium">{business.redemption}%</span>
                            </td>
                            <td className="p-3 text-sm font-bold">{business.liquidity}</td>
                            <td className="p-3 text-sm">{business.score}/5.0</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </div>
            </TabsContent>

            {/* Dispute Resolution */}
            <TabsContent value="disputes" className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Active Disputes</h2>
                <select className="px-4 py-2 border border-input bg-background text-sm">
                  <option>All Disputes</option>
                  <option>Redemption Issues</option>
                  <option>Service Quality</option>
                  <option>Business Complaints</option>
                </select>
              </div>

              <div className="space-y-4">
                {[
                  {
                    id: "#DSP-4521",
                    type: "Redemption Failure",
                    business: "QuickCut Barbers",
                    customer: "0x742d...a3f2",
                    submitted: "Dec 19, 2025",
                    status: "Under Review",
                    priority: "High",
                  },
                  {
                    id: "#DSP-4520",
                    type: "Service Quality",
                    business: "Auto Shine",
                    customer: "0x8f21...b8c4",
                    submitted: "Dec 18, 2025",
                    status: "Awaiting Response",
                    priority: "Medium",
                  },
                  {
                    id: "#DSP-4519",
                    type: "Expired Token",
                    business: "Wellness Spa",
                    customer: "0x3a1c...d5e7",
                    submitted: "Dec 17, 2025",
                    status: "Under Review",
                    priority: "Low",
                  },
                ].map((dispute, idx) => (
                  <Card key={idx} className="p-6 border-2">
                    <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-bold text-lg mb-1">
                              {dispute.type}{" "}
                              <span className="text-muted-foreground font-mono text-sm">{dispute.id}</span>
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {dispute.business} • Customer: {dispute.customer}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <div
                              className={`text-xs px-2 py-1 ${
                                dispute.priority === "High"
                                  ? "bg-destructive/10 text-destructive"
                                  : dispute.priority === "Medium"
                                    ? "bg-accent/10 text-accent"
                                    : "bg-muted text-muted-foreground"
                              }`}
                            >
                              {dispute.priority} Priority
                            </div>
                            <div className="text-xs px-2 py-1 bg-accent/10 text-accent">{dispute.status}</div>
                          </div>
                        </div>

                        <div className="text-sm text-muted-foreground mb-4">
                          <p>
                            Customer attempted to redeem token but business claims service was not provided. Both
                            parties have submitted evidence for review.
                          </p>
                        </div>

                        <div className="text-xs text-muted-foreground">Submitted: {dispute.submitted}</div>
                      </div>

                      <div className="flex gap-2 lg:flex-col">
                        <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90">
                          Review Details
                        </Button>
                        <Button size="sm" variant="outline" className="bg-transparent">
                          Contact Parties
                        </Button>
                        <Button size="sm" variant="outline" className="bg-transparent">
                          Resolve
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              <Card className="p-6 border-2 bg-muted/50">
                <h3 className="font-bold mb-4">Dispute Statistics</h3>
                <div className="grid md:grid-cols-4 gap-6 text-sm">
                  <div>
                    <div className="text-muted-foreground mb-1">Total Disputes</div>
                    <div className="text-2xl font-bold">127</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground mb-1">Resolved</div>
                    <div className="text-2xl font-bold">124</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground mb-1">Avg Resolution Time</div>
                    <div className="text-2xl font-bold">2.4 days</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground mb-1">Resolution Rate</div>
                    <div className="text-2xl font-bold text-accent">97.6%</div>
                  </div>
                </div>
              </Card>
            </TabsContent>

            {/* System Configuration */}
            <TabsContent value="config" className="space-y-6">
              <h2 className="text-2xl font-bold">System Configuration</h2>

              <div className="grid md:grid-cols-2 gap-6">
                <Card className="p-6 border-2">
                  <h3 className="font-bold mb-4">Platform Fees</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Minting Fee (%)</label>
                      <input
                        type="number"
                        defaultValue="2"
                        step="0.1"
                        className="w-full px-4 py-2 border border-input bg-background"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Redemption Fee (%)</label>
                      <input
                        type="number"
                        defaultValue="1"
                        step="0.1"
                        className="w-full px-4 py-2 border border-input bg-background"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">LP Management Fee (%)</label>
                      <input
                        type="number"
                        defaultValue="0.5"
                        step="0.1"
                        className="w-full px-4 py-2 border border-input bg-background"
                      />
                    </div>
                    <Button className="w-full bg-accent text-accent-foreground hover:bg-accent/90">Update Fees</Button>
                  </div>
                </Card>

                <Card className="p-6 border-2">
                  <h3 className="font-bold mb-4">Risk Parameters</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Min Business Score</label>
                      <input
                        type="number"
                        defaultValue="3.5"
                        step="0.1"
                        className="w-full px-4 py-2 border border-input bg-background"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Min Redemption Rate (%)</label>
                      <input
                        type="number"
                        defaultValue="75"
                        className="w-full px-4 py-2 border border-input bg-background"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Max Token Expiry (days)</label>
                      <input
                        type="number"
                        defaultValue="180"
                        className="w-full px-4 py-2 border border-input bg-background"
                      />
                    </div>
                    <Button className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
                      Update Parameters
                    </Button>
                  </div>
                </Card>

                <Card className="p-6 border-2">
                  <h3 className="font-bold mb-4">Verification Requirements</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <input type="checkbox" defaultChecked className="w-4 h-4" />
                      <label className="text-sm">Business Registration Certificate</label>
                    </div>
                    <div className="flex items-center gap-3">
                      <input type="checkbox" defaultChecked className="w-4 h-4" />
                      <label className="text-sm">Proof of Address</label>
                    </div>
                    <div className="flex items-center gap-3">
                      <input type="checkbox" defaultChecked className="w-4 h-4" />
                      <label className="text-sm">Owner ID Verification</label>
                    </div>
                    <div className="flex items-center gap-3">
                      <input type="checkbox" className="w-4 h-4" />
                      <label className="text-sm">Financial Statements</label>
                    </div>
                    <div className="flex items-center gap-3">
                      <input type="checkbox" className="w-4 h-4" />
                      <label className="text-sm">Operating License</label>
                    </div>
                  </div>
                  <Button className="w-full mt-4 bg-accent text-accent-foreground hover:bg-accent/90">
                    Save Requirements
                  </Button>
                </Card>

                <Card className="p-6 border-2">
                  <h3 className="font-bold mb-4">Notification Settings</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <input type="checkbox" defaultChecked className="w-4 h-4" />
                      <label className="text-sm">New Business Applications</label>
                    </div>
                    <div className="flex items-center gap-3">
                      <input type="checkbox" defaultChecked className="w-4 h-4" />
                      <label className="text-sm">Dispute Submissions</label>
                    </div>
                    <div className="flex items-center gap-3">
                      <input type="checkbox" defaultChecked className="w-4 h-4" />
                      <label className="text-sm">Low Redemption Rates</label>
                    </div>
                    <div className="flex items-center gap-3">
                      <input type="checkbox" className="w-4 h-4" />
                      <label className="text-sm">Daily Analytics Summary</label>
                    </div>
                    <div className="flex items-center gap-3">
                      <input type="checkbox" className="w-4 h-4" />
                      <label className="text-sm">Weekly Revenue Reports</label>
                    </div>
                  </div>
                  <Button className="w-full mt-4 bg-accent text-accent-foreground hover:bg-accent/90">
                    Save Notifications
                  </Button>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>
    </main>
  )
}
