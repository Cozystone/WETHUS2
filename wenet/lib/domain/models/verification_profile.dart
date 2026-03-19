enum AgeGroup { minor, adult }

class VerificationProfile {
  final String personId;
  final bool identityVerified;
  final bool ageVerified;
  final AgeGroup ageGroup;
  final int age;
  final double trustScore; // 0~1

  const VerificationProfile({
    required this.personId,
    required this.identityVerified,
    required this.ageVerified,
    required this.ageGroup,
    required this.age,
    required this.trustScore,
  });
}
