import '../../domain/models/interaction_feedback.dart';

abstract class FeedbackRepository {
  Future<void> saveFeedback(InteractionFeedback feedback);
  Future<List<InteractionFeedback>> getAll();
}
