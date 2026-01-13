import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const MultiBatchModule = buildModule("MultiBatchModule", (m) => {
  const multiBatch = m.contract("MultiBatch");

  return { multiBatch };
});

export default MultiBatchModule;
