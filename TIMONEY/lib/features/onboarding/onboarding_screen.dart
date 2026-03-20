import 'package:flutter/cupertino.dart';
import '../../core/design/app_colors.dart';

class OnboardingScreen extends StatelessWidget {
  final VoidCallback onStart;
  const OnboardingScreen({super.key, required this.onStart});

  @override
  Widget build(BuildContext context) {
    return CupertinoPageScaffold(
      backgroundColor: AppColors.bg,
      child: SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(24, 28, 24, 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Timevest', style: TextStyle(fontSize: 34, fontWeight: FontWeight.w800, letterSpacing: -1.0)),
              const SizedBox(height: 12),
              const Text('평소보다 덜 쓰면,\n시간이 자산이 됩니다.', style: TextStyle(fontSize: 24, fontWeight: FontWeight.w700, height: 1.25)),
              const SizedBox(height: 14),
              const Text('사용 가능 시간을 주는 앱이 아니라\n절약한 시간을 적립하고 관리하는 자산 앱입니다.', style: TextStyle(fontSize: 15, color: AppColors.subText, height: 1.45)),
              const Spacer(),
              SizedBox(
                width: double.infinity,
                child: CupertinoButton(
                  color: AppColors.accent,
                  borderRadius: BorderRadius.circular(14),
                  onPressed: onStart,
                  child: const Text('시작하기', style: TextStyle(color: CupertinoColors.white, fontWeight: FontWeight.w700)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
