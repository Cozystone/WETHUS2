class MatchExplanation {
  final String pairKey;
  final String relationshipType;
  final List<String> highlights;
  final List<String> cautions;
  final String whyText;

  const MatchExplanation({
    required this.pairKey,
    required this.relationshipType,
    required this.highlights,
    required this.cautions,
    required this.whyText,
  });
}
