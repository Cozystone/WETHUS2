class InteractionFeedback {
  final String pairKey;
  final int comfort; // 1~5
  final int naturalness; // 1~5
  final String relationFelt; // friend / peer / etc
  final bool reconnectIntent;
  final String notes;

  const InteractionFeedback({
    required this.pairKey,
    required this.comfort,
    required this.naturalness,
    required this.relationFelt,
    required this.reconnectIntent,
    this.notes = '',
  });
}
