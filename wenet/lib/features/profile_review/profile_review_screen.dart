import 'package:flutter/material.dart';
import '../../data/mock/mock_repo_impl.dart';
import '../../domain/services/compatibility_engine.dart';
import '../match_list/match_list_screen.dart';

class ProfileReviewScreen extends StatelessWidget {
  final String freeText;
  final double pace;
  final double depth;

  const ProfileReviewScreen({
    super.key,
    required this.freeText,
    required this.pace,
    required this.depth,
  });

  @override
  Widget build(BuildContext context) {
    final store = seedMockStore();
    final matchRepo = MockMatchRepository(store, CompatibilityEngineV1());

    return Scaffold(
      appBar: AppBar(title: const Text('Generated Profile Review')),
      body: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('요약 프로필 (Mock)', style: TextStyle(fontWeight: FontWeight.w700)),
            const SizedBox(height: 8),
            Text('자기소개: ${freeText.isEmpty ? '(입력 없음)' : freeText}'),
            Text('관계 속도: ${pace.toStringAsFixed(2)}'),
            Text('대화 깊이: ${depth.toStringAsFixed(2)}'),
            const Spacer(),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () async {
                  final matches = await matchRepo.getMatchesFor('u1');
                  if (!context.mounted) return;
                  Navigator.push(context, MaterialPageRoute(builder: (_) => MatchListScreen(matches: matches)));
                },
                child: const Text('후보 보기'),
              ),
            )
          ],
        ),
      ),
    );
  }
}
