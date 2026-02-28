def analyse_latency(data):
    batch_size = data["batchSize"]
    batch_interval = data["batchIntervalMinutes"]
    throughput = data["throughput"]

    latencies = []

    for batch in data.get("batches", []):
        batch_timestamp = batch.get("timestamp")

        # Skip batches with no timestamp or no transactions
        if batch_timestamp is None:
            continue

        for tx in batch.get("transactions", []):
            tx_timestamp = tx.get("timeStamp")

            if tx_timestamp is None:
                continue

            latency_ms = batch_timestamp - tx_timestamp
            latencies.append(latency_ms)

    avg_latency = sum(latencies) / len(latencies) if latencies else 0
    min_latency = min(latencies) if latencies else 0
    max_latency = max(latencies) if latencies else 0

    return {
        "avgLatencyMs": round(avg_latency, 2),
        "minLatencyMs": round(min_latency, 2),
        "maxLatencyMs": round(max_latency, 2),
        "totalTransactionsAnalysed": len(latencies),
    }