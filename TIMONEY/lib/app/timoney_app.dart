import 'package:flutter/cupertino.dart';
import '../features/home/root_tab_scaffold.dart';

class TimoneyApp extends StatelessWidget {
  const TimoneyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return const CupertinoApp(
      debugShowCheckedModeBanner: false,
      title: 'TIMONEY',
      home: RootTabScaffold(),
    );
  }
}
