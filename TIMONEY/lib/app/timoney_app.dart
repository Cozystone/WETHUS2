import 'package:flutter/cupertino.dart';
import 'package:flutter/foundation.dart';
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
      builder: (context, child) {
        if (!kIsWeb) return child ?? const SizedBox.shrink();

        const phoneW = 390.0;
        const phoneH = 844.0;

        return ColoredBox(
          color: const Color(0xFFEFF3FB),
          child: Center(
            child: SingleChildScrollView(
              child: SizedBox(
                width: phoneW + 20,
                height: phoneH + 20,
                child: Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: const Color(0xFF111111),
                    borderRadius: BorderRadius.circular(44),
                    boxShadow: const [
                      BoxShadow(
                        color: Color(0x33000000),
                        blurRadius: 36,
                        offset: Offset(0, 18),
                      ),
                    ],
                  ),
                  child: Stack(
                    children: [
                      ClipRRect(
                        borderRadius: BorderRadius.circular(34),
                        child: SizedBox(
                          width: phoneW,
                          height: phoneH,
                          child: child ?? const SizedBox.shrink(),
                        ),
                      ),
                      Positioned(
                        top: 2,
                        left: 0,
                        right: 0,
                        child: Center(
                          child: Container(
                            width: 150,
                            height: 30,
                            decoration: BoxDecoration(
                              color: const Color(0xFF111111),
                              borderRadius: BorderRadius.circular(18),
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        );
      },
      home: started
          ? const RootTabScaffold()
          : OnboardingScreen(onStart: () => setState(() => started = true)),
    );
  }
}
