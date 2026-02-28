import sys
import os
import glob
import pandas as pd

sys.path.insert(0, os.path.dirname(__file__))

from utils import load_json, print_header
from gas_analysis import modules/analyse_gas
from latency_analysis import modules/analyse_latency

ETHEREUM_LOGS_PATH = os.path.join(
    os.path.dirname(__file__),
    "..",
    "off-chain", "simulation", "EthereumSimulationLogs"
)

OUTPUT_PATH = os.path.join(os.path.dirname(__file__), "results", "ethereum_results.csv")


def main():
    logs_dir = os.path.abspath(ETHEREUM_LOGS_PATH)

    if not os.path.isdir(logs_dir):
        print(f"Error: Could not find Ethereum logs directory at:\n  {logs_dir}")
        sys.exit(1)

    json_files = sorted(glob.glob(os.path.join(logs_dir, "*.json")))

    if not json_files:
        print(f"No JSON files found in: {logs_dir}")
        sys.exit(1)

    print_header("Ethereum Gas & Latency Analysis")
    print(f"  Found {len(json_files)} log file(s) in:\n  {logs_dir}\n")

    rows = []

    for json_file in json_files:
        filename = os.path.basename(json_file)
        print(f"  Processing: {filename}")

        try:
            data = load_json(json_file)

            # Shared top-level keys
            shared = {
                "batchSize": data["batchSize"],
                "batchIntervalMinutes": data["batchIntervalMinutes"],
                "throughput": data["throughput"],
            }

            gas_result     = analyse_gas(data)
            latency_result = analyse_latency(data)

            merged = {
                "file": filename,
                **shared,
                **gas_result,
                **latency_result,
            }

            rows.append(merged)

        except Exception as e:
            print(f"  [WARN] Skipping {filename}: {e}")

    if not rows:
        print("No data processed. Exiting.")
        sys.exit(1)

    df = pd.DataFrame(rows)

    col_order = [
        "file",
        "batchSize",
        "batchIntervalMinutes",
        "throughput",
        "totalIndividualGasUsed",
        "totalBatchGasUsed",
        "gasSaved",
        "percentageSaved",
        "avgLatencyMs",
        "minLatencyMs",
        "maxLatencyMs",
        "totalTransactionsAnalysed",
    ]
    df = df[[c for c in col_order if c in df.columns]]

    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    df.to_csv(OUTPUT_PATH, index=False)

    print_header("Summary")
    print(df.to_string(index=False))
    print(f"\n✅ Results saved to: {OUTPUT_PATH}")


if __name__ == "__main__":
    main()