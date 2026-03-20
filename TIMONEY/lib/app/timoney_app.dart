import 'package:flutter/cupertino.dart';
import '../core/design/app_colors.dart';
import '../features/home/root_tab_scaffold.dart';
import '../features/onboarding/onboarding_screen.dart';

class TimoneyApp extends StatefulWidget {
  const TimoneyApp({super.key});

  @override
  State<TimoneyApp> createState() => _TimoneyAppState();
}

class _TimoneyAppState extends State<TimoneyApp> {
  bool started = false;

  @override
  Widget build(BuildContext context) {
    return CupertinoApp(
      debugShowCheckedModeBanner: false,
      title: 'Timevest',
      theme: const CupertinoThemeData(
        scaffoldBackgroundColor: AppColors.bg,
        primaryColor: AppColors.accent,
        textTheme: CupertinoTextThemeData(
          textStyle: TextStyle(color: AppColors.text),
          navTitleTextStyle: TextStyle(color: AppColors.text, fontWeight: FontWeight.w700),
        ),
      ),
      home: started ? const RootTabScaffold() : OnboardingScreen(onStart: () => setState(() => started = true)),
    );
  }
}
