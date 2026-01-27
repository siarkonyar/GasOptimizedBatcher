import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const ETHBatchModule = buildModule("ETHBatchModule", (m) => {
  const ETHBatch = m.contract("ETHBatch");

  return { ETHBatch };
});

export default ETHBatchModule;
