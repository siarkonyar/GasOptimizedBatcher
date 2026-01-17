import { parseUnits } from "viem";

export const getRandomAmount = () => {
    // random integer between 1 and 100 USDC
    const min = 1;
    const max = 100;
    const randomInt = Math.floor(Math.random() * (max - min + 1)) + min;
    return parseUnits(randomInt.toString(), 6);
  };