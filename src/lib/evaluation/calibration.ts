import { prisma } from "@/lib/prisma";

export async function recordCalibration(
  provider: string,
  model: string,
  promptVersion: string,
  llmBand: number,
  humanBand: number,
) {
  const deviation = Math.abs(llmBand - humanBand);

  const existing = await prisma.evaluationCalibration.findFirst({
    where: { provider, model, promptVersion },
  });

  if (existing) {
    const newSampleSize = (existing.sampleSize ?? 0) + 1;
    const newDeviation =
      ((existing.averageDeviation ?? 0) * (existing.sampleSize ?? 0) + deviation) / newSampleSize;

    await prisma.evaluationCalibration.update({
      where: { id: existing.id },
      data: {
        averageDeviation: newDeviation,
        sampleSize: newSampleSize,
      },
    });
  } else {
    await prisma.evaluationCalibration.create({
      data: {
        provider,
        model,
        promptVersion,
        calibrationSetId: null,
        averageDeviation: deviation,
        sampleSize: 1,
      },
    });
  }
}

export async function getCalibrationStats(provider: string, model: string) {
  return prisma.evaluationCalibration.findFirst({
    where: { provider, model },
  });
}