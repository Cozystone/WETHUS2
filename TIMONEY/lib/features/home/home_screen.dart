import 'package:flutter/cupertino.dart';
import '../../core/constants/app_version.dart';
import '../../core/design/app_colors.dart';
import '../../core/state/app_prefs.dart';
import '../../core/widgets/mini_line_chart.dart';
import '../../data/mock/timevest_mock_data.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  String statusKo = '지난주 같은 시점보다 12분 절약 중';
  String statusEn = 'Saving 12 min vs same time last week';

  @override
  Widget build(BuildContext context) {
    final trend = MockTimevestData.weekCurve.map((e) => e.y).toList();

    return ValueListenableBuilder<String>(
      valueListenable: AppPrefs.lang,
      builder: (context, lang, _) {
        final isKo = lang == 'ko';

        return CupertinoPageScaffold(
          backgroundColor: AppColors.bg,
          navigationBar: CupertinoNavigationBar(
            backgroundColor: AppColors.bg,
            border: null,
            middle: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Text('Timevest', style: TextStyle(fontWeight: FontWeight.w700)),
                const SizedBox(width: 6),
                Text(kAppVersionLabel, style: const TextStyle(fontSize: 12, color: AppColors.subText, fontWeight: FontWeight.w600)),
              ],
            ),
            trailing: CupertinoButton(
              padding: EdgeInsets.zero,
              onPressed: () => _showProfileSheet(context, isKo),
              child: const Text('◎', style: TextStyle(color: AppColors.text, fontSize: 18, fontWeight: FontWeight.w700)),
            ),
          ),
          child: SafeArea(
            child: ListView(
              padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
              children: [
                Text(isKo ? '총 보유 시간자산' : 'Total time assets', style: const TextStyle(fontSize: 14, color: AppColors.subText)),
                const SizedBox(height: 4),
                Text('${MockTimevestData.walletT} ${isKo ? '분' : 'min'}', style: const TextStyle(fontSize: 54, fontWeight: FontWeight.w800, letterSpacing: -1.2)),
                const SizedBox(height: 8),
                Text(
                  isKo ? '오늘 +${MockTimevestData.todayExpectedT}분 예상' : 'Today +${MockTimevestData.todayExpectedT} min est.',
                  style: const TextStyle(fontSize: 16, color: AppColors.accent, fontWeight: FontWeight.w600),
                ),
                const SizedBox(height: 2),
                Text(isKo ? statusKo : statusEn, style: const TextStyle(fontSize: 13, color: AppColors.subText)),
                const SizedBox(height: 16),
                CupertinoButton(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                  color: CupertinoColors.white,
                  borderRadius: BorderRadius.circular(12),
                  onPressed: () => _showOveruseSheet(isKo),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(isKo ? '기준 초과 시뮬레이션' : 'Overuse simulation', style: const TextStyle(color: AppColors.text, fontWeight: FontWeight.w600)),
                      const Text('▾', style: TextStyle(color: AppColors.subText, fontSize: 16, fontWeight: FontWeight.w700)),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
                _Card(
                  child: Row(
                    children: [
                      const Text('★', style: TextStyle(color: AppColors.accent, fontSize: 16, fontWeight: FontWeight.w700)),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Text('${MockTimevestData.league} · ${MockTimevestData.leagueSub}', style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
                      )
                    ],
                  ),
                ),
                const SizedBox(height: 14),
                _Card(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(isKo ? '최근 7일 자산 변화' : 'Last 7 days', style: const TextStyle(fontSize: 13, color: AppColors.subText)),
                      const SizedBox(height: 12),
                      Text('+27 ${isKo ? '분' : 'min'}', style: const TextStyle(fontSize: 26, fontWeight: FontWeight.w700, color: AppColors.up)),
                      const SizedBox(height: 10),
                      MiniLineChart(points: trend, color: AppColors.accent, height: 90),
                    ],
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  void _showOveruseSheet(bool isKo) {
    showCupertinoModalPopup(
      context: context,
      builder: (_) => CupertinoActionSheet(
        title: Text(isKo ? '기준을 넘겼어요. 어떻게 할까요?' : 'You passed your baseline. What now?'),
        message: Text(isKo ? '선택은 언제든 바꿀 수 있어요.' : 'Pick one option.'),
        actions: [
          CupertinoActionSheetAction(
            onPressed: () {
              Navigator.pop(context);
              setState(() {
                statusKo = '30분 잠금 선택 · 오늘 -2분으로 방어 중';
                statusEn = '30-min lock selected · defending with -2 min';
              });
            },
            child: Text(isKo ? '30분 잠그기' : 'Lock for 30 min'),
          ),
          CupertinoActionSheetAction(
            onPressed: () {
              Navigator.pop(context);
              setState(() {
                statusKo = '5T로 20분 연장 · 현재 보유 143분';
                statusEn = 'Use 5T for +20 min · assets now 143 min';
              });
            },
            child: Text(isKo ? '5T로 20분 더 사용하기' : 'Use 5T for +20 min'),
          ),
          CupertinoActionSheetAction(
            onPressed: () {
              Navigator.pop(context);
              setState(() {
                statusKo = '광고 1회 사용 · 오늘 남은 비상열기 0회';
                statusEn = 'Ad used · emergency open left: 0';
              });
            },
            child: Text(isKo ? '광고 보고 한 번 더 열기' : 'Watch ad for one more open'),
          ),
        ],
        cancelButton: CupertinoActionSheetAction(
          onPressed: () => Navigator.pop(context),
          child: Text(isKo ? '닫기' : 'Close'),
        ),
      ),
    );
  }

  void _showProfileSheet(BuildContext context, bool isKo) {
    showCupertinoModalPopup(
      context: context,
      builder: (_) => CupertinoActionSheet(
        title: Text(isKo ? '프로필 & 설정' : 'Profile & Settings'),
        actions: [
          CupertinoActionSheetAction(
            onPressed: () => Navigator.pop(context),
            child: Text(isKo ? '리그 상세 (준비중)' : 'League detail (soon)'),
          ),
          CupertinoActionSheetAction(
            onPressed: () => Navigator.pop(context),
            child: Text(isKo ? '권한 설정 (준비중)' : 'Permission settings (soon)'),
          ),
          CupertinoActionSheetAction(
            onPressed: () => Navigator.pop(context),
            child: Text(isKo ? '보상 광고 (준비중)' : 'Reward ads (soon)'),
          ),
        ],
        cancelButton: CupertinoActionSheetAction(
          onPressed: () => Navigator.pop(context),
          child: Text(isKo ? '닫기' : 'Close'),
        ),
      ),
    );
  }
}

class _Card extends StatelessWidget {
  final Widget child;
  const _Card({required this.child});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.card,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: AppColors.line),
      ),
      child: child,
    );
  }
}
