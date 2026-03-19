class RawProfileSubmission {
  final String personId;
  final String freeText;
  final Map<String, dynamic> answers;

  const RawProfileSubmission({
    required this.personId,
    required this.freeText,
    required this.answers,
  });
}
