import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("ServiceFiModule", (m) => {
  // Parameters
  const feeCollector = m.getParameter("feeCollector", m.getAccount(0));
  const metadataUri = m.getParameter("metadataUri", "https://api.servicefi.io/metadata/{id}.json");
  const discountBps = m.getParameter("discountBps", 1000); // 10% discount
  const minLockPeriod = m.getParameter("minLockPeriod", 8 * 24 * 60 * 60); // 7 days

  // Step 1: Deploy RedemptionOracle (without ServiceCreditToken)
  // const redemptionOracle = m.contract("RedemptionOracle");
  
  
  // Step 2: Deploy ServiceCreditToken
  const serviceCreditToken = m.contract("ServiceCreditToken", [
    metadataUri,
    feeCollector,
    "0x4888103Ce5C13F47b7e6772126118B49651197F8",
  ]);

  // // Step 3: Set ServiceCreditToken address in RedemptionOracle
  // m.call(redemptionOracle, "setServiceCreditToken", [serviceCreditToken]);

  // // Step 4: Deploy LiquidityPool
  // const liquidityPool = m.contract("LiquidityPool", [
  //   "0x61cc6f64dcd101ee029c860ff6a1a21a23fa35d5",
  //   discountBps,
  //   minLockPeriod,
  // ]);

  return {
    serviceCreditToken,
    // liquidityPool,
    // redemptionOracle,
  };
});
