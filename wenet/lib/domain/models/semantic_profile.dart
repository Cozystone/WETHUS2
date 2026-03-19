class SemanticProfile {
  final String personId;
  final Map<String, double> traits; // ex) calm, curiosity, warmth
  final Map<String, double> values; // ex) growth, stability, openness
  final Map<String, double> environment; // ex) indoor/outdoor, social density
  final double relationshipPace; // 0 slow - 1 fast
  final double conversationDepth; // 0 light - 1 deep
  final String summary;

  const SemanticProfile({
    required this.personId,
    required this.traits,
    required this.values,
    required this.environment,
    required this.relationshipPace,
    required this.conversationDepth,
    required this.summary,
  });
}
