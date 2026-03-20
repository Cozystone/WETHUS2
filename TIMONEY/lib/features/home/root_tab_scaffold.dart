import 'package:flutter/cupertino.dart';
import '../../core/design/app_colors.dart';
import '../market/market_screen.dart';
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
          BottomNavigationBarItem(icon: Text('⌂', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700)), label: '홈'),
          BottomNavigationBarItem(icon: Text('▤', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700)), label: '시장'),
        ],
      ),
      tabBuilder: (context, index) {
        switch (index) {
          case 0:
            return const HomeScreen();
          case 1:
            return const MarketScreen();
          default:
            return const SizedBox.shrink();
        }
      },
    );
  }
}
