import '../models/match_hypothesis.dart';
import '../models/semantic_profile.dart';
import '../models/verification_profile.dart';

class CompatibilityEngineV1 {
  static const double _minTrust = 0.40;

  MatchHypothesis scorePair({
    required SemanticProfile a,
    required SemanticProfile b,
    required VerificationProfile av,
    required VerificationProfile bv,
  }) {
    final reasonCodes = <String>[];

    if (!_passesHardGate(av, bv, reasonCodes)) {
      return MatchHypothesis(
        aId: a.personId,
        bId: b.personId,
        hardGatePassed: false,
        friendScore: 0,
        peerScore: 0,
        pairScore: 0,
        reasonCodes: reasonCodes,
      );
    }

    final aToBFriend = _directional(a, b, relation: 'friend', reasons: reasonCodes);
    final bToAFriend = _directional(b, a, relation: 'friend', reasons: reasonCodes);
    final friendPair = _harmonicMean(aToBFriend, bToAFriend);

    final aToBPeer = _directional(a, b, relation: 'peer', reasons: reasonCodes);
    final bToAPeer = _directional(b, a, relation: 'peer', reasons: reasonCodes);
    final peerPair = _harmonicMean(aToBPeer, bToAPeer);

    return MatchHypothesis(
      aId: a.personId,
      bId: b.personId,
      hardGatePassed: true,
      friendScore: friendPair,
      peerScore: peerPair,
      pairScore: (friendPair + peerPair) / 2,
      reasonCodes: reasonCodes.toSet().toList(),
    );
  }

  bool _passesHardGate(VerificationProfile a, VerificationProfile b, List<String> reasons) {
    if (!a.identityVerified || !a.ageVerified || !b.identityVerified || !b.ageVerified) {
      reasons.add('GATE_VERIFICATION_REQUIRED');
      return false;
    }

    if (a.trustScore < _minTrust || b.trustScore < _minTrust) {
      reasons.add('GATE_TRUST_TOO_LOW');
      return false;
    }

    if (a.ageGroup != b.ageGroup) {
      reasons.add('GATE_AGE_GROUP_BLOCKED');
      return false;
    }

    if (a.ageGroup == AgeGroup.minor && (a.age - b.age).abs() > 2) {
      reasons.add('GATE_MINOR_RANGE_BLOCKED');
      return false;
    }

    return true;
  }

  double _directional(SemanticProfile from, SemanticProfile to, {required String relation, required List<String> reasons}) {
    final trait = _mapSimilarity(from.traits, to.traits);
    final value = _mapSimilarity(from.values, to.values);
    final environment = _mapSimilarity(from.environment, to.environment);

    final paceGap = (from.relationshipPace - to.relationshipPace).abs();
    final depthGap = (from.conversationDepth - to.conversationDepth).abs();
    final rhythm = 1 - ((paceGap + depthGap) / 2);

    if (value > 0.75) reasons.add('VALUE_ALIGNMENT_HIGH');
    if (rhythm > 0.75) reasons.add('RHYTHM_ALIGNMENT_HIGH');
    if (environment > 0.70) reasons.add('ENVIRONMENT_MATCH');
    if (paceGap > 0.45) reasons.add('PACING_MISMATCH');

    if (relation == 'friend') {
      return _clamp01(0.30 * trait + 0.35 * value + 0.20 * environment + 0.15 * rhythm);
    }
    // peer
    return _clamp01(0.35 * trait + 0.30 * value + 0.15 * environment + 0.20 * rhythm);
  }

  double _mapSimilarity(Map<String, double> a, Map<String, double> b) {
    final keys = {...a.keys, ...b.keys};
    if (keys.isEmpty) return 0.5;
    double sum = 0;
    for (final k in keys) {
      final av = a[k] ?? 0.5;
      final bv = b[k] ?? 0.5;
      sum += 1 - (av - bv).abs();
    }
    return _clamp01(sum / keys.length);
  }

  double _harmonicMean(double x, double y) {
    const eps = 1e-9;
    return (2 * x * y) / (x + y + eps);
  }

  double _clamp01(double v) => v < 0 ? 0 : (v > 1 ? 1 : v);
}
