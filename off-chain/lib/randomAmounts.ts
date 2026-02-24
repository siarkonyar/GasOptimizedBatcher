import { parseUnits } from "viem";

export const getRandomAmount = () => {
    const min = 1;
    const max = 3;
    const randomInt = Math.floor(Math.random() * (max - min + 1)) + min;
    return parseUnits(randomInt.toString(), 6);
  };