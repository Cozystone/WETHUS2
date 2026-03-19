import 'package:flutter/material.dart';
import '../profile_input/profile_input_screen.dart';

class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key});

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  double pace = 0.5;
  double depth = 0.7;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Onboarding')),
      body: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('관계 속도', style: TextStyle(fontWeight: FontWeight.w700)),
            Slider(value: pace, onChanged: (v) => setState(() => pace = v)),
            const SizedBox(height: 16),
            const Text('대화 깊이', style: TextStyle(fontWeight: FontWeight.w700)),
            Slider(value: depth, onChanged: (v) => setState(() => depth = v)),
            const Spacer(),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => ProfileInputScreen(pace: pace, depth: depth))),
                child: const Text('자기소개 입력으로 이동'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
