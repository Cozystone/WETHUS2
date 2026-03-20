import 'package:flutter/cupertino.dart';
import '../../core/design/app_colors.dart';
import '../market/market_screen.dart';
import '../settings/settings_screen.dart';
import 'home_screen.dart';

class RootTabScaffold extends StatelessWidget {
  const RootTabScaffold({super.key});

  @override
  Widget build(BuildContext context) {
    return CupertinoTabScaffold(
      backgroundColor: AppColors.bg,
      tabBar: CupertinoTabBar(
        activeColor: AppColors.accent,
        inactiveColor: AppColors.subText,
        items: const [
          BottomNavigationBarItem(icon: Text('H', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700)), label: 'Home'),
          BottomNavigationBarItem(icon: Text('M', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700)), label: 'Market'),
          BottomNavigationBarItem(icon: Text('S', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700)), label: 'Settings'),
        ],
      ),
      tabBuilder: (context, index) {
        switch (index) {
          case 0:
            return const HomeScreen();
          case 1:
            return const MarketScreen();
          case 2:
            return const SettingsScreen();
          default:
            return const SizedBox.shrink();
        }
      },
    );
  }
}
