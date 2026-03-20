import 'package:flutter/cupertino.dart';
import '../core/design/app_colors.dart';
import '../features/home/root_tab_scaffold.dart';

class TimoneyApp extends StatelessWidget {
  const TimoneyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return const CupertinoApp(
      debugShowCheckedModeBanner: false,
      title: 'Timevest',
      theme: CupertinoThemeData(
        scaffoldBackgroundColor: AppColors.bg,
        primaryColor: AppColors.accent,
        textTheme: CupertinoTextThemeData(
          textStyle: TextStyle(color: AppColors.text),
          navTitleTextStyle: TextStyle(color: AppColors.text, fontWeight: FontWeight.w700),
        ),
      ),
      home: RootTabScaffold(),
    );
  }
}
