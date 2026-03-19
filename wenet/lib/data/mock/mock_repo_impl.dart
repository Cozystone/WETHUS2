import '../../domain/models/interaction_feedback.dart';
import '../../domain/models/match_hypothesis.dart';
import '../../domain/models/raw_profile_submission.dart';
import '../../domain/models/semantic_profile.dart';
import '../../domain/models/verification_profile.dart';
import '../../domain/services/compatibility_engine.dart';
import '../repositories/feedback_repository.dart';
import '../repositories/match_repository.dart';
import '../repositories/profile_repository.dart';

class MockStore {
  final Map<String, SemanticProfile> profiles = {};
  final Map<String, VerificationProfile> verifications = {};
  final List<InteractionFeedback> feedbacks = [];
}

class MockProfileRepository implements ProfileRepository {
  final MockStore store;
  MockProfileRepository(this.store);

  @override
  Future<SemanticProfile?> getSemanticProfile(String personId) async => store.profiles[personId];

  @override
  Future<VerificationProfile?> getVerification(String personId) async => store.verifications[personId];

  @override
  Future<void> saveRaw(RawProfileSubmission submission) async {
    // MVP mock parser: replace with LLM parser later.
    store.profiles[submission.personId] = SemanticProfile(
      personId: submission.personId,
      traits: {'calm': 0.7, 'curiosity': 0.8, 'warmth': 0.6},
      values: {'growth': 0.9, 'stability': 0.6, 'kindness': 0.8},
      environment: {'indoor': 0.6, 'social': 0.5},
      relationshipPace: 0.45,
      conversationDepth: 0.75,
      summary: submission.freeText,
    );
  }
}

class MockFeedbackRepository implements FeedbackRepository {
  final MockStore store;
  MockFeedbackRepository(this.store);

  @override
  Future<List<InteractionFeedback>> getAll() async => store.feedbacks;

  @override
  Future<void> saveFeedback(InteractionFeedback feedback) async {
    store.feedbacks.add(feedback);
  }
}

class MockMatchRepository implements MatchRepository {
  final MockStore store;
  final CompatibilityEngineV1 engine;
  MockMatchRepository(this.store, this.engine);

  @override
  Future<List<MatchHypothesis>> getMatchesFor(String personId) async {
    final me = store.profiles[personId];
    final meV = store.verifications[personId];
    if (me == null || meV == null) return [];

    final out = <MatchHypothesis>[];
    for (final entry in store.profiles.entries) {
      if (entry.key == personId) continue;
      final other = entry.value;
      final otherV = store.verifications[other.personId];
      if (otherV == null) continue;
      out.add(engine.scorePair(a: me, b: other, av: meV, bv: otherV));
    }

    out.sort((a, b) => b.pairScore.compareTo(a.pairScore));
    return out;
  }
}

MockStore seedMockStore() {
  final s = MockStore();
  s.profiles['u1'] = const SemanticProfile(
    personId: 'u1',
    traits: {'calm': 0.8, 'curiosity': 0.7, 'warmth': 0.7},
    values: {'growth': 0.85, 'stability': 0.75, 'kindness': 0.8},
    environment: {'indoor': 0.7, 'social': 0.45},
    relationshipPace: 0.35,
    conversationDepth: 0.8,
    summary: '조용하지만 깊은 대화를 좋아하는 타입',
  );
  s.verifications['u1'] = const VerificationProfile(
    personId: 'u1',
    identityVerified: true,
    ageVerified: true,
    ageGroup: AgeGroup.adult,
    age: 27,
    trustScore: 0.82,
  );

  s.profiles['u2'] = const SemanticProfile(
    personId: 'u2',
    traits: {'calm': 0.75, 'curiosity': 0.82, 'warmth': 0.65},
    values: {'growth': 0.88, 'stability': 0.62, 'kindness': 0.77},
    environment: {'indoor': 0.6, 'social': 0.55},
    relationshipPace: 0.42,
    conversationDepth: 0.78,
    summary: '배움과 탐구를 즐기고 꾸준함을 중시',
  );
  s.verifications['u2'] = const VerificationProfile(
    personId: 'u2',
    identityVerified: true,
    ageVerified: true,
    ageGroup: AgeGroup.adult,
    age: 28,
    trustScore: 0.79,
  );

  s.profiles['u3'] = const SemanticProfile(
    personId: 'u3',
    traits: {'calm': 0.35, 'curiosity': 0.9, 'warmth': 0.5},
    values: {'growth': 0.6, 'stability': 0.3, 'kindness': 0.55},
    environment: {'indoor': 0.2, 'social': 0.85},
    relationshipPace: 0.84,
    conversationDepth: 0.3,
    summary: '빠른 템포의 활동적 네트워킹 선호',
  );
  s.verifications['u3'] = const VerificationProfile(
    personId: 'u3',
    identityVerified: true,
    ageVerified: true,
    ageGroup: AgeGroup.adult,
    age: 29,
    trustScore: 0.76,
  );

  return s;
}
