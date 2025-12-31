'use client';

import { Navigation } from "@/components/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useServiceCredit } from "@/hooks/useServiceCredit"
import { useAccount } from "wagmi"
import { formatEther } from "viem"
import { useState } from "react"
import { toast } from "sonner"
import { ServiceCard } from "@/components/service-card"
import { uploadMetadataToIPFS, saveServiceMetadata } from "@/lib/metadata-storage"

export default function BusinessDashboard() {
  const { address, isConnected } = useAccount();
  const {
    useProviderInfo,
    useProviderStats,
    useNextTokenId,
    registerProvider,
    createService,
    isPending
  } = useServiceCredit();

  const providerInfo = useProviderInfo(address);
  const providerStats = useProviderStats(address);
  const nextTokenId = useNextTokenId();
  const isRegistered = providerInfo.data?.[5] || false;

  const [serviceForm, setServiceForm] = useState({
    name: '',
    brand: '',
    description: '',
    image: '',
    price: '',
    expiryDays: 30,
    maxSupply: 100,
    serviceType: 0,
  });
  const [isUploadingMetadata, setIsUploadingMetadata] = useState(false);

  // Get total services count
  const totalServices = providerStats.data ? Number(providerStats.data[0]) : 0;

  const handleRegister = async () => {
    try {
      await registerProvider();
      toast.success('Registration successful!');
    } catch (error: any) {
      toast.error(error.message || 'Registration failed');
    }
  };

  const handleCreateService = async () => {
    if (!serviceForm.name || !serviceForm.brand || !serviceForm.price || !serviceForm.image) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setIsUploadingMetadata(true);

      // Step 1: Upload metadata to IPFS
      const metadata = await uploadMetadataToIPFS({
        name: serviceForm.name,
        brand: serviceForm.brand,
        description: serviceForm.description || `${serviceForm.name} service credit`,
        image: serviceForm.image,
        category: 'Service',
      });

      toast.success('Metadata uploaded to IPFS!');

      // Step 2: Create service on blockchain
      setIsUploadingMetadata(false);
      await createService({
        price: serviceForm.price,
        expiryDays: serviceForm.expiryDays,
        maxSupply: serviceForm.maxSupply,
        serviceType: serviceForm.serviceType,
        tokenURI: metadata.ipfsUrl || '',
      });

      // Step 3: Save metadata locally with the new token ID
      const newTokenId = nextTokenId.data ? Number(nextTokenId.data) - 1 : totalServices;
      saveServiceMetadata(newTokenId, metadata);

      toast.success(`Service "${serviceForm.name}" created successfully!`);
      setServiceForm({
        name: '',
        brand: '',
        description: '',
        image: '',
        price: '',
        expiryDays: 30,
        maxSupply: 100,
        serviceType: 0
      });
    } catch (error: any) {
      setIsUploadingMetadata(false);
      toast.error(error.message || 'Service creation failed');
    }
  };

  if (!isConnected) {
    return (
      <main className="min-h-screen bg-muted/30">
        <Navigation />
        <section className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <Card className="p-8 text-center">
              <h2 className="text-xl font-bold mb-4">Connect Your Wallet</h2>
              <p className="text-muted-foreground">Please connect your wallet to access the business dashboard</p>
            </Card>
          </div>
        </section>
      </main>
    );
  }

  if (!isRegistered) {
    return (
      <main className="min-h-screen bg-muted/30">
        <Navigation />
        <section className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <Card className="p-8 text-center">
              <h2 className="text-xl font-bold mb-4">Register Your Business</h2>
              <p className="text-muted-foreground mb-6">
                You need to register as a service provider to start tokenizing your services
              </p>
              <div className="flex gap-4 justify-center">
                <Button 
                  onClick={handleRegister}
                  disabled={isPending}
                  className="bg-accent text-accent-foreground hover:bg-accent/90"
                >
                  {isPending ? 'Registering...' : 'Register as Provider'}
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => window.location.href = '/business/register'}
                >
                  Full Registration
                </Button>
              </div>
            </Card>
          </div>
        </section>
      </main>
    );
  }
  return (
    <main className="min-h-screen bg-muted/30">
      <Navigation />

      <section className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Business Dashboard</h1>
            <p className="text-muted-foreground">Manage your service tokens and access instant liquidity</p>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card className="p-6">
              <div className="text-sm text-muted-foreground mb-1">Total Services</div>
              <div className="text-3xl font-bold">
                {providerStats.data ? Number(providerStats.data[0]) : 0}
              </div>
              <div className="text-xs text-muted-foreground mt-1">Created services</div>
            </Card>
            <Card className="p-6">
              <div className="text-sm text-muted-foreground mb-1">Value Locked</div>
              <div className="text-3xl font-bold">
                {providerStats.data ? `${formatEther(providerStats.data[1])} MNT` : '0 MNT'}
              </div>
              <div className="text-xs text-muted-foreground mt-1">In active credits</div>
            </Card>
            <Card className="p-6">
              <div className="text-sm text-muted-foreground mb-1">Verification</div>
              <div className="text-3xl font-bold">
                {providerStats.data?.[2] ? '✓' : '⏳'}
              </div>
              <div className="text-xs text-accent mt-1">
                {providerStats.data?.[2] ? 'Verified' : 'Pending'}
              </div>
            </Card>
            <Card className="p-6">
              <div className="text-sm text-muted-foreground mb-1">Next Token ID</div>
              <div className="text-3xl font-bold">
                #{nextTokenId.data ? Number(nextTokenId.data) : 1}
              </div>
              <div className="text-xs text-muted-foreground mt-1">For new service</div>
            </Card>
          </div>

          {/* Main Content */}
          <Tabs defaultValue="services" className="space-y-6">
            <TabsList className="bg-card border border-border">
              <TabsTrigger value="services">Service Management</TabsTrigger>
              <TabsTrigger value="mint">Mint Service Tokens</TabsTrigger>
              <TabsTrigger value="redemptions">Redemptions</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

            {/* Service Management */}
            <TabsContent value="services" className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Your Services</h2>
              </div>

              {totalServices === 0 ? (
                <Card className="p-8 text-center border-2 border-dashed">
                  <p className="text-muted-foreground mb-4">No services created yet</p>
                  <p className="text-sm text-muted-foreground">Go to "Mint Service Tokens" tab to create your first service</p>
                </Card>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {Array.from({ length: totalServices }, (_, i) => (
                    <ServiceCard key={i + 1} tokenId={i + 1} />
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Mint Service Tokens */}
            <TabsContent value="mint" className="space-y-6">
              <Card className="p-8 border-2">
                <h2 className="text-2xl font-bold mb-6">Create & Mint Service Tokens</h2>
                <p className="text-sm text-muted-foreground mb-6">
                  Create a new service and mint tokens for it. You can define the service details and initial token supply.
                </p>

                <div className="space-y-6 max-w-2xl">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Service Name *</label>
                      <input
                        type="text"
                        placeholder="e.g., Premium Haircut"
                        value={serviceForm.name}
                        onChange={(e) => setServiceForm({...serviceForm, name: e.target.value})}
                        className="w-full px-4 py-2 border border-input bg-background rounded-md"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Brand Name *</label>
                      <input
                        type="text"
                        placeholder="e.g., Elite Hair Studio"
                        value={serviceForm.brand}
                        onChange={(e) => setServiceForm({...serviceForm, brand: e.target.value})}
                        className="w-full px-4 py-2 border border-input bg-background rounded-md"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Description (optional)</label>
                    <textarea
                      placeholder="Describe your service..."
                      value={serviceForm.description}
                      onChange={(e) => setServiceForm({...serviceForm, description: e.target.value})}
                      className="w-full px-4 py-2 border border-input bg-background rounded-md min-h-[80px]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Image URL *</label>
                    <input
                      type="url"
                      placeholder="https://example.com/image.jpg"
                      value={serviceForm.image}
                      onChange={(e) => setServiceForm({...serviceForm, image: e.target.value})}
                      className="w-full px-4 py-2 border border-input bg-background rounded-md"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Direct URL to an image representing your service
                    </p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Price per Token (MNT) *</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={serviceForm.price}
                        onChange={(e) => setServiceForm({...serviceForm, price: e.target.value})}
                        className="w-full px-4 py-2 border border-input bg-background rounded-md"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Max Supply *</label>
                      <input
                        type="number"
                        min="1"
                        placeholder="100"
                        value={serviceForm.maxSupply}
                        onChange={(e) => setServiceForm({...serviceForm, maxSupply: Number(e.target.value)})}
                        className="w-full px-4 py-2 border border-input bg-background rounded-md"
                      />
                    </div>
                  </div>

                  {serviceForm.name && serviceForm.brand && serviceForm.image && (
                    <Card className="p-6 bg-muted/50 border-2">
                      <h3 className="font-bold mb-4">Service Preview</h3>
                      <div className="space-y-3">
                        {serviceForm.image && (
                          <div className="w-full h-48 rounded-md overflow-hidden bg-muted">
                            <img
                              src={serviceForm.image}
                              alt={serviceForm.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.src = 'https://via.placeholder.com/400x300?text=Image+Not+Found';
                              }}
                            />
                          </div>
                        )}
                        <div className="space-y-2 text-sm">
                          <div>
                            <span className="text-muted-foreground text-xs">Brand</span>
                            <p className="font-medium">{serviceForm.brand}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground text-xs">Service</span>
                            <p className="font-bold text-lg">{serviceForm.name}</p>
                          </div>
                          {serviceForm.description && (
                            <div>
                              <span className="text-muted-foreground text-xs">Description</span>
                              <p className="text-sm">{serviceForm.description}</p>
                            </div>
                          )}
                          <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                            <div>
                              <span className="text-muted-foreground text-xs">Price</span>
                              <p className="font-bold text-accent">{serviceForm.price} MNT</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground text-xs">Max Supply</span>
                              <p className="font-medium">{serviceForm.maxSupply}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  )}

                  <Button
                    onClick={handleCreateService}
                    disabled={isPending || isUploadingMetadata || !serviceForm.name || !serviceForm.brand || !serviceForm.image || !serviceForm.price || serviceForm.maxSupply < 1}
                    className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
                    size="lg"
                  >
                    {isUploadingMetadata ? 'Uploading to IPFS...' : isPending ? 'Creating Service...' : 'Create Service'}
                  </Button>

                  <div className="text-xs text-muted-foreground bg-background p-4 rounded border">
                    <p className="font-medium mb-2">ℹ️ What happens when you create a service:</p>
                    <ul className="space-y-1 ml-4 list-disc">
                      <li>A new service token type will be created on the blockchain</li>
                      <li>No tokens are minted yet - just the service definition</li>
                      <li>Customers can then purchase tokens from the marketplace</li>
                      <li>You'll receive payment when customers buy tokens</li>
                    </ul>
                  </div>
                </div>
              </Card>
            </TabsContent>

            {/* Redemptions */}
            <TabsContent value="redemptions" className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Recent Redemptions</h2>
                <select className="px-4 py-2 border border-input bg-background text-sm">
                  <option>Last 7 days</option>
                  <option>Last 30 days</option>
                  <option>Last 90 days</option>
                </select>
              </div>

              <Card className="border-2">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b border-border">
                      <tr className="text-left">
                        <th className="p-4 text-sm font-medium">Date</th>
                        <th className="p-4 text-sm font-medium">Service</th>
                        <th className="p-4 text-sm font-medium">Token ID</th>
                        <th className="p-4 text-sm font-medium">Customer</th>
                        <th className="p-4 text-sm font-medium">Value</th>
                        <th className="p-4 text-sm font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        {
                          date: "Dec 20, 2025",
                          service: "Premium Haircut",
                          token: "#4521",
                          customer: "0x742d...a3f2",
                          value: "$50",
                        },
                        {
                          date: "Dec 20, 2025",
                          service: "Express Cut",
                          token: "#4520",
                          customer: "0x8f21...b8c4",
                          value: "$30",
                        },
                        {
                          date: "Dec 19, 2025",
                          service: "Hair Coloring",
                          token: "#4519",
                          customer: "0x3a1c...d5e7",
                          value: "$120",
                        },
                        {
                          date: "Dec 19, 2025",
                          service: "Premium Haircut",
                          token: "#4518",
                          customer: "0x6d42...f9a1",
                          value: "$50",
                        },
                        {
                          date: "Dec 18, 2025",
                          service: "Express Cut",
                          token: "#4517",
                          customer: "0x9e51...c2b8",
                          value: "$30",
                        },
                      ].map((item, idx) => (
                        <tr key={idx} className="border-b border-border last:border-0 hover:bg-muted/50">
                          <td className="p-4 text-sm">{item.date}</td>
                          <td className="p-4 text-sm font-medium">{item.service}</td>
                          <td className="p-4 text-sm text-muted-foreground font-mono">{item.token}</td>
                          <td className="p-4 text-sm text-muted-foreground font-mono">{item.customer}</td>
                          <td className="p-4 text-sm font-bold">{item.value}</td>
                          <td className="p-4">
                            <span className="text-xs px-2 py-1 bg-accent/10 text-accent">Redeemed</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>

              <div className="flex justify-between items-center text-sm">
                <div className="text-muted-foreground">Showing 5 of 186 redemptions</div>
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

            {/* Analytics */}
            <TabsContent value="analytics" className="space-y-6">
              <h2 className="text-2xl font-bold">Performance Analytics</h2>

              <div className="grid md:grid-cols-2 gap-6">
                <Card className="p-6 border-2">
                  <h3 className="font-bold mb-4">Revenue Breakdown</h3>
                  <div className="space-y-4">
                    {[
                      { service: "Premium Haircut", revenue: 6375, percent: 42 },
                      { service: "Hair Coloring", revenue: 5100, percent: 34 },
                      { service: "Express Cut", revenue: 2400, percent: 16 },
                      { service: "Styling Session", revenue: 1125, percent: 8 },
                    ].map((item, idx) => (
                      <div key={idx}>
                        <div className="flex justify-between mb-2 text-sm">
                          <span>{item.service}</span>
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
                  <h3 className="font-bold mb-4">Redemption Trends</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between py-2 border-b border-border">
                      <span className="text-muted-foreground">Average Redemption Time</span>
                      <span className="font-medium">42 days</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-border">
                      <span className="text-muted-foreground">Peak Redemption Day</span>
                      <span className="font-medium">Saturday</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-border">
                      <span className="text-muted-foreground">Repeat Customer Rate</span>
                      <span className="font-medium">68%</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-muted-foreground">Expired Token Rate</span>
                      <span className="font-medium">8%</span>
                    </div>
                  </div>
                </Card>

                <Card className="p-6 border-2 md:col-span-2">
                  <h3 className="font-bold mb-4">Monthly Liquidity Flow</h3>
                  <div className="h-48 flex items-end justify-between gap-2">
                    {[45, 62, 58, 78, 85, 72, 68, 82, 95, 88, 92, 100].map((height, idx) => (
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
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>
    </main>
  )
}
