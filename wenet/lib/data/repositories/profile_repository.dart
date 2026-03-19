import '../../domain/models/raw_profile_submission.dart';
import '../../domain/models/semantic_profile.dart';
import '../../domain/models/verification_profile.dart';

abstract class ProfileRepository {
  Future<void> saveRaw(RawProfileSubmission submission);
  Future<SemanticProfile?> getSemanticProfile(String personId);
  Future<VerificationProfile?> getVerification(String personId);
}
