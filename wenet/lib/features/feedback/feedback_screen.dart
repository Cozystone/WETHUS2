import 'package:flutter/material.dart';

class FeedbackScreen extends StatefulWidget {
  final String pairKey;
  const FeedbackScreen({super.key, required this.pairKey});

  @override
  State<FeedbackScreen> createState() => _FeedbackScreenState();
}

class _FeedbackScreenState extends State<FeedbackScreen> {
  double comfort = 4;
  double naturalness = 4;
  bool reconnect = true;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Feedback')),
      body: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Pair: ${widget.pairKey}'),
            const SizedBox(height: 12),
            const Text('편안함'),
            Slider(value: comfort, min: 1, max: 5, divisions: 4, onChanged: (v) => setState(() => comfort = v)),
            const Text('대화 자연스러움'),
            Slider(value: naturalness, min: 1, max: 5, divisions: 4, onChanged: (v) => setState(() => naturalness = v)),
            SwitchListTile(
              value: reconnect,
              onChanged: (v) => setState(() => reconnect = v),
              title: const Text('다시 연결하고 싶다'),
            ),
            const Spacer(),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () {
                  ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('피드백 저장됨 (Mock)')));
                  Navigator.popUntil(context, (route) => route.isFirst);
                },
                child: const Text('완료'),
              ),
            )
          ],
        ),
      ),
    );
  }
}
