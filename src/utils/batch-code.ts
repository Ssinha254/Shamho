const BATCH_CODE_PATTERN = /^(.*?)(\d+)([^\d]*)$/;

export const generateNextBatchCode = (existingCodes: string[]): string => {
  const parsedCodes = existingCodes
    .map((code) => {
      const normalizedCode = code.trim();
      const match = normalizedCode.match(BATCH_CODE_PATTERN);

      if (!match) {
        return null;
      }

      return {
        code: normalizedCode,
        prefix: match[1],
        number: Number(match[2]),
        padding: match[2].length,
        suffix: match[3],
      };
    })
    .filter(Boolean) as Array<{
    code: string;
    prefix: string;
    number: number;
    padding: number;
    suffix: string;
  }>;

  if (!parsedCodes.length) {
    return "BATCH-001";
  }

  const latestCode = parsedCodes.reduce((current, candidate) => {
    if (candidate.number > current.number) {
      return candidate;
    }

    if (candidate.number === current.number && candidate.code > current.code) {
      return candidate;
    }

    return current;
  });

  const nextNumber = String(latestCode.number + 1).padStart(
    latestCode.padding,
    "0",
  );
  return `${latestCode.prefix}${nextNumber}${latestCode.suffix}`;
};
