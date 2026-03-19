import '../models/match_explanation.dart';
import '../models/match_hypothesis.dart';

class ExplanationGenerator {
  MatchExplanation build(MatchHypothesis h, {required String relationshipType}) {
    final highlights = <String>[];
    final cautions = <String>[];

    for (final code in h.reasonCodes) {
      switch (code) {
        case 'VALUE_ALIGNMENT_HIGH':
          highlights.add('핵심 가치관이 유사해 관계의 안정성이 높습니다.');
          break;
        case 'RHYTHM_ALIGNMENT_HIGH':
          highlights.add('대화 깊이와 관계 속도가 잘 맞습니다.');
          break;
        case 'ENVIRONMENT_MATCH':
          highlights.add('선호 환경/생활 리듬이 유사합니다.');
          break;
        case 'PACING_MISMATCH':
          cautions.add('관계 진행 속도에 차이가 있어 초반 조율이 필요합니다.');
          break;
        case 'GATE_VERIFICATION_REQUIRED':
          cautions.add('인증이 완료되지 않아 연결이 제한됩니다.');
          break;
        case 'GATE_AGE_GROUP_BLOCKED':
          cautions.add('연령 그룹 정책으로 연결이 제한됩니다.');
          break;
      }
    }

    final score = relationshipType == 'friend' ? h.friendScore : h.peerScore;
    final whyText = h.hardGatePassed
        ? '이 연결은 ${relationshipType.toUpperCase()} 기준 ${_pct(score)} 적합도를 보입니다.'
        : '현재는 안전/인증 정책으로 인해 연결이 제한됩니다.';

    return MatchExplanation(
      pairKey: '${h.aId}:${h.bId}',
      relationshipType: relationshipType,
      highlights: highlights,
      cautions: cautions,
      whyText: whyText,
    );
  }

  String _pct(double s) => '${(s * 100).toStringAsFixed(0)}%';
}
