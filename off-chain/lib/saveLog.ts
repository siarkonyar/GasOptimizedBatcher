import { SimulationLog } from "@/types/types";
import * as path from "path";
import * as fs from "fs";

export function saveLog(simulationLog: SimulationLog, folder: string) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const logFileName = `simulation-log-${timestamp}.json`;
  const logPath = path.join(process.cwd(), folder, logFileName);

  // Calculate total gas for individual and batched transactions
  const totalIndividualGas = simulationLog.individualTransactions.reduce(
    (sum, tx) => sum + BigInt(tx.gasUsed),
    BigInt(0),
  );
  const totalBatchGas = simulationLog.batches.reduce(
    (sum, batch) => sum + BigInt(batch.gasUsed),
    BigInt(0),
  );

  simulationLog.summary = {
    totalIndividualTransactions: simulationLog.individualTransactions.length,
    totalBatches: simulationLog.batches.length,
    totalIndividualGasUsed: totalIndividualGas.toString(),
    totalBatchGasUsed: totalBatchGas.toString(),
  };

  fs.writeFileSync(logPath, JSON.stringify(simulationLog, null, 2));
  console.log(`\n📝 Log saved to: ${logFileName}`);
}
