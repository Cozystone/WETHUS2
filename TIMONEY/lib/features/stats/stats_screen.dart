import 'package:flutter/cupertino.dart';

class StatsScreen extends StatelessWidget {
  const StatsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const CupertinoPageScaffold(
      navigationBar: CupertinoNavigationBar(middle: Text('Stats')),
      child: SafeArea(
        child: Center(
          child: Text('Monthly insights and trends (mock)'),
        ),
      ),
    );
  }
}
