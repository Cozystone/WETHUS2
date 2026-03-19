import '../../domain/models/match_hypothesis.dart';

abstract class MatchRepository {
  Future<List<MatchHypothesis>> getMatchesFor(String personId);
}
