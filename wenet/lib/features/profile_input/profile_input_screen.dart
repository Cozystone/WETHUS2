import 'package:flutter/material.dart';
import '../profile_review/profile_review_screen.dart';

class ProfileInputScreen extends StatefulWidget {
  final double pace;
  final double depth;
  const ProfileInputScreen({super.key, required this.pace, required this.depth});

  @override
  State<ProfileInputScreen> createState() => _ProfileInputScreenState();
}

class _ProfileInputScreenState extends State<ProfileInputScreen> {
  final controller = TextEditingController();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Free Text Profile')),
      body: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            TextField(
              controller: controller,
              maxLines: 8,
              decoration: const InputDecoration(
                hintText: '자신의 라이프스타일/대화 성향/원하는 관계를 자유롭게 적어주세요',
                border: OutlineInputBorder(),
              ),
            ),
            const Spacer(),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () => Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (_) => ProfileReviewScreen(
                      freeText: controller.text,
                      pace: widget.pace,
                      depth: widget.depth,
                    ),
                  ),
                ),
                child: const Text('AI 프로필 확인'),
              ),
            )
          ],
        ),
      ),
    );
  }
}
