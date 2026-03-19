class MatchHypothesis {
  final String aId;
  final String bId;
  final bool hardGatePassed;
  final double friendScore;
  final double peerScore;
  final double pairScore;
  final List<String> reasonCodes;

  const MatchHypothesis({
    required this.aId,
    required this.bId,
    required this.hardGatePassed,
    required this.friendScore,
    required this.peerScore,
    required this.pairScore,
    required this.reasonCodes,
  });
}
