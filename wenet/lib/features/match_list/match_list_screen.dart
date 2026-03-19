import 'package:flutter/material.dart';
import '../../domain/models/match_hypothesis.dart';
import '../match_detail/match_detail_screen.dart';

class MatchListScreen extends StatelessWidget {
  final List<MatchHypothesis> matches;
  const MatchListScreen({super.key, required this.matches});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Candidate List')),
      body: ListView.separated(
        itemCount: matches.length,
        separatorBuilder: (_, __) => const Divider(height: 1),
        itemBuilder: (context, index) {
          final m = matches[index];
          return ListTile(
            title: Text('Candidate ${m.bId}'),
            subtitle: Text('Friend ${(m.friendScore * 100).toStringAsFixed(0)} / Peer ${(m.peerScore * 100).toStringAsFixed(0)}'),
            trailing: const Icon(Icons.chevron_right),
            onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => MatchDetailScreen(match: m))),
          );
        },
      ),
    );
  }
}
