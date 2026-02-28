def analyse_gas(data):
    batch_size = data["batchSize"]
    batch_interval = data["batchIntervalMinutes"]
    throughput = data["throughput"]

    total_individual = int(data["summary"]["totalIndividualGasUsed"])
    total_batch = int(data["summary"]["totalBatchGasUsed"])

    gas_saved = total_individual - total_batch
    percentage_saved = (gas_saved / total_individual * 100) if total_individual > 0 else 0

    return {
        "totalIndividualGasUsed": total_individual,
        "totalBatchGasUsed": total_batch,
        "gasSaved": gas_saved,
        "percentageSaved": round(percentage_saved, 2),
    }