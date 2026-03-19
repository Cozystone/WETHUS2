import 'package:flutter/material.dart';
import '../../domain/models/match_hypothesis.dart';
import '../../domain/services/explanation_generator.dart';
import '../feedback/feedback_screen.dart';

class MatchDetailScreen extends StatelessWidget {
  final MatchHypothesis match;
  const MatchDetailScreen({super.key, required this.match});

  @override
  Widget build(BuildContext context) {
    final generator = ExplanationGenerator();
    final friendExp = generator.build(match, relationshipType: 'friend');
    final peerExp = generator.build(match, relationshipType: 'peer');

    return Scaffold(
      appBar: AppBar(title: const Text('Match Explanation')),
      body: Padding(
        padding: const EdgeInsets.all(20),
        child: ListView(
          children: [
            Text('Pair Score ${(match.pairScore * 100).toStringAsFixed(0)}', style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
            const SizedBox(height: 12),
            Text(friendExp.whyText),
            const SizedBox(height: 8),
            Text(peerExp.whyText),
            const SizedBox(height: 12),
            const Text('Highlights', style: TextStyle(fontWeight: FontWeight.w700)),
            ...friendExp.highlights.map((e) => Text('• $e')),
            const SizedBox(height: 12),
            const Text('Cautions', style: TextStyle(fontWeight: FontWeight.w700)),
            ...friendExp.cautions.map((e) => Text('• $e')),
            const SizedBox(height: 20),
            ElevatedButton(
              onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => FeedbackScreen(pairKey: '${match.aId}:${match.bId}'))),
              child: const Text('피드백 남기기'),
            )
          ],
        ),
      ),
    );
  }
}
