import 'package:flutter/cupertino.dart';
import '../ledger/ledger_screen.dart';
import '../settings/settings_screen.dart';
import '../stats/stats_screen.dart';

class RootTabScaffold extends StatelessWidget {
  const RootTabScaffold({super.key});

  @override
  Widget build(BuildContext context) {
    return CupertinoTabScaffold(
      tabBar: const CupertinoTabBar(items: [
        BottomNavigationBarItem(icon: Icon(CupertinoIcons.home), label: 'Home'),
        BottomNavigationBarItem(icon: Icon(CupertinoIcons.list_bullet), label: 'Ledger'),
        BottomNavigationBarItem(icon: Icon(CupertinoIcons.chart_bar), label: 'Stats'),
        BottomNavigationBarItem(icon: Icon(CupertinoIcons.settings), label: 'Settings'),
      ]),
      tabBuilder: (context, index) {
        switch (index) {
          case 0:
            return const CupertinoPageScaffold(
              navigationBar: CupertinoNavigationBar(middle: Text('TIMONEY')),
              child: SafeArea(child: Center(child: Text('TIMONEY Home (iOS style)'))),
            );
          case 1:
            return const LedgerScreen();
          case 2:
            return const StatsScreen();
          case 3:
            return const SettingsScreen();
          default:
            return const SizedBox.shrink();
        }
      },
    );
  }
}
