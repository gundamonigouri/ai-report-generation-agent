export function computeMetrics({ sections = [], references = [], retrievedChunks = [], userRating }) {
  const totalClaims = sections.reduce((acc, s) => acc + (s.citations?.length || 0), 0);
  const verifiedClaims = sections.reduce(
    (acc, s) => acc + (s.citations?.filter((c) => c.verified)?.length || 0),
    0
  );

  const citationCoverage = totalClaims > 0 ? (verifiedClaims / totalClaims) * 100 : references.length > 0 ? 85 : 40;

  const avgChunkRelevance =
    retrievedChunks.length > 0
      ? retrievedChunks.reduce((acc, c) => acc + (1 - Math.min(c.distance ?? 0.5, 1)), 0) / retrievedChunks.length
      : 0.5;

  const relevanceScore = Math.round(avgChunkRelevance * 100);
  const faithfulnessScore = Math.round(Math.min(citationCoverage, 95));
  const hallucinationRisk = Math.max(0, Math.round(100 - faithfulnessScore - relevanceScore * 0.3));
  const responseQuality = Math.round((relevanceScore + faithfulnessScore + (100 - hallucinationRisk)) / 3);
  const retrievalAccuracy = Math.round(avgChunkRelevance * 100);

  return {
    relevanceScore,
    faithfulnessScore,
    hallucinationRisk,
    citationCoverage: Math.round(citationCoverage),
    responseQuality,
    retrievalAccuracy,
    userRating: userRating ?? null,
  };
}
