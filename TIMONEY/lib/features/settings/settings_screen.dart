import 'package:flutter/cupertino.dart';
import '../../core/design/app_colors.dart';
import '../../core/state/app_prefs.dart';

class SettingsScreen extends StatelessWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return CupertinoPageScaffold(
      backgroundColor: AppColors.bg,
      navigationBar: const CupertinoNavigationBar(
        backgroundColor: AppColors.bg,
        border: null,
        middle: Text('Settings'),
      ),
      child: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: ValueListenableBuilder<String>(
            valueListenable: AppPrefs.lang,
            builder: (context, lang, _) {
              return Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Language', style: TextStyle(fontSize: 14, color: AppColors.subText)),
                  const SizedBox(height: 10),
                  CupertinoSlidingSegmentedControl<String>(
                    groupValue: lang,
                    children: const {
                      'ko': Padding(padding: EdgeInsets.symmetric(horizontal: 16, vertical: 8), child: Text('한국어')),
                      'en': Padding(padding: EdgeInsets.symmetric(horizontal: 16, vertical: 8), child: Text('English')),
                    },
                    onValueChanged: (value) {
                      if (value != null) AppPrefs.lang.value = value;
                    },
                  ),
                ],
              );
            },
          ),
        ),
      ),
    );
  }
}
