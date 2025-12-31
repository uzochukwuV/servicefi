import { useReadContract, useWriteContract, useWatchContractEvent } from "wagmi";
import { CONTRACT_ADDRESSES } from "@/lib/contracts/addresses";
import { ServiceTokenMarketplaceABI } from "@/lib/contracts/abis";
import { mantleSepoliaTestnet } from "viem/chains";

const MARKETPLACE_ADDRESS = CONTRACT_ADDRESSES.mantleSepoliaTestnet.marketplace as `0x${string}`;

export function useMarketplace() {
  const writeContract = useWriteContract();

  // Read Functions
  const useListing = (listingId: bigint) => {
    return useReadContract({
      address: MARKETPLACE_ADDRESS,
      abi: ServiceTokenMarketplaceABI,
      functionName: "listings",
      args: [listingId],
      chainId: mantleSepoliaTestnet.id,
    });
  };

  const useOffer = (offerId: bigint) => {
    return useReadContract({
      address: MARKETPLACE_ADDRESS,
      abi: ServiceTokenMarketplaceABI,
      functionName: "offers",
      args: [offerId],
      chainId: mantleSepoliaTestnet.id,
    });
  };

  const usePriceBounds = (tokenId: bigint) => {
    return useReadContract({
      address: MARKETPLACE_ADDRESS,
      abi: ServiceTokenMarketplaceABI,
      functionName: "priceBounds",
      args: [tokenId],
      chainId: mantleSepoliaTestnet.id,
    });
  };

  const useActiveListings = (tokenId: bigint) => {
    return useReadContract({
      address: MARKETPLACE_ADDRESS,
      abi: ServiceTokenMarketplaceABI,
      functionName: "getActiveListings",
      args: [tokenId],
      chainId: mantleSepoliaTestnet.id,
    });
  };

  const useBestAsk = (tokenId: bigint) => {
    return useReadContract({
      address: MARKETPLACE_ADDRESS,
      abi: ServiceTokenMarketplaceABI,
      functionName: "getBestAsk",
      args: [tokenId],
      chainId: mantleSepoliaTestnet.id,
    });
  };

  const useUserActiveListings = (userAddress?: `0x${string}`) => {
    return useReadContract({
      address: MARKETPLACE_ADDRESS,
      abi: ServiceTokenMarketplaceABI,
      functionName: "getUserActiveListings",
      args: userAddress ? [userAddress] : undefined,
      chainId: mantleSepoliaTestnet.id,
      query: {
        enabled: !!userAddress,
      },
    });
  };

  const getSuggestedPrice = (tokenId: bigint) => {
    return useReadContract({
      address: MARKETPLACE_ADDRESS,
      abi: ServiceTokenMarketplaceABI,
      functionName: "getSuggestedPrice",
      args: [tokenId],
      chainId: mantleSepoliaTestnet.id,
    });
  };

  // Write Functions
  const createListing = {
    writeContractAsync: async ({
      args,
    }: {
      args: [bigint, bigint, bigint, number];
    }) => {
      return writeContract.writeContractAsync({
        address: MARKETPLACE_ADDRESS,
        abi: ServiceTokenMarketplaceABI,
        functionName: "createListing",
        args,
        chainId: mantleSepoliaTestnet.id,
      });
    },
  };

  const buyListing = {
    writeContractAsync: async ({
      args,
      value,
    }: {
      args: [bigint, bigint];
      value: bigint;
    }) => {
      return writeContract.writeContractAsync({
        address: MARKETPLACE_ADDRESS,
        abi: ServiceTokenMarketplaceABI,
        functionName: "buyListing",
        args,
        value,
        chainId: mantleSepoliaTestnet.id,
      });
    },
  };

  const cancelListing = {
    writeContractAsync: async ({ args }: { args: [bigint] }) => {
      return writeContract.writeContractAsync({
        address: MARKETPLACE_ADDRESS,
        abi: ServiceTokenMarketplaceABI,
        functionName: "cancelListing",
        args,
        chainId: mantleSepoliaTestnet.id,
      });
    },
  };

  const makeOffer = {
    writeContractAsync: async ({
      args,
      value,
    }: {
      args: [bigint, bigint, bigint, number];
      value: bigint;
    }) => {
      return writeContract.writeContractAsync({
        address: MARKETPLACE_ADDRESS,
        abi: ServiceTokenMarketplaceABI,
        functionName: "makeOffer",
        args,
        value,
        chainId: mantleSepoliaTestnet.id,
      });
    },
  };

  const acceptOffer = {
    writeContractAsync: async ({ args }: { args: [bigint] }) => {
      return writeContract.writeContractAsync({
        address: MARKETPLACE_ADDRESS,
        abi: ServiceTokenMarketplaceABI,
        functionName: "acceptOffer",
        args,
        chainId: mantleSepoliaTestnet.id,
      });
    },
  };

  const cancelOffer = {
    writeContractAsync: async ({ args }: { args: [bigint] }) => {
      return writeContract.writeContractAsync({
        address: MARKETPLACE_ADDRESS,
        abi: ServiceTokenMarketplaceABI,
        functionName: "cancelOffer",
        args,
        chainId: mantleSepoliaTestnet.id,
      });
    },
  };

  const updatePriceBounds = {
    writeContractAsync: async ({ args }: { args: [bigint] }) => {
      return writeContract.writeContractAsync({
        address: MARKETPLACE_ADDRESS,
        abi: ServiceTokenMarketplaceABI,
        functionName: "updatePriceBounds",
        args,
        chainId: mantleSepoliaTestnet.id,
      });
    },
  };

  // Event Watchers
  const watchListingCreated = (onLogs: (logs: any[]) => void) => {
    return useWatchContractEvent({
      address: MARKETPLACE_ADDRESS,
      abi: ServiceTokenMarketplaceABI,
      eventName: "ListingCreated",
      onLogs,
      chainId: mantleSepoliaTestnet.id,
    });
  };

  const watchListingSold = (onLogs: (logs: any[]) => void) => {
    return useWatchContractEvent({
      address: MARKETPLACE_ADDRESS,
      abi: ServiceTokenMarketplaceABI,
      eventName: "ListingSold",
      onLogs,
      chainId: mantleSepoliaTestnet.id,
    });
  };

  const watchOfferMade = (onLogs: (logs: any[]) => void) => {
    return useWatchContractEvent({
      address: MARKETPLACE_ADDRESS,
      abi: ServiceTokenMarketplaceABI,
      eventName: "OfferMade",
      onLogs,
      chainId: mantleSepoliaTestnet.id,
    });
  };

  const watchOfferAccepted = (onLogs: (logs: any[]) => void) => {
    return useWatchContractEvent({
      address: MARKETPLACE_ADDRESS,
      abi: ServiceTokenMarketplaceABI,
      eventName: "OfferAccepted",
      onLogs,
      chainId: mantleSepoliaTestnet.id,
    });
  };

  return {
    // Read hooks
    useListing,
    useOffer,
    usePriceBounds,
    useActiveListings,
    useBestAsk,
    useUserActiveListings,
    getSuggestedPrice,

    // Write hooks
    createListing,
    buyListing,
    cancelListing,
    makeOffer,
    acceptOffer,
    cancelOffer,
    updatePriceBounds,

    // Event watchers
    watchListingCreated,
    watchListingSold,
    watchOfferMade,
    watchOfferAccepted,
  };
}
