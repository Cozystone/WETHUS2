import 'package:flutter/cupertino.dart';
import '../../core/design/app_colors.dart';
import '../../core/widgets/mini_line_chart.dart';
import '../../data/mock/timevest_mock_data.dart';
import 'symbol_detail_screen.dart';

class MarketScreen extends StatelessWidget {
  const MarketScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return CupertinoPageScaffold(
      backgroundColor: AppColors.bg,
      navigationBar: const CupertinoNavigationBar(
        backgroundColor: AppColors.bg,
        border: null,
        middle: Text('시장', style: TextStyle(fontWeight: FontWeight.w700)),
      ),
      child: SafeArea(
        child: ListView(
          padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
          children: [
            const Text('지금 벌고 있는 시간', style: TextStyle(fontSize: 14, color: AppColors.subText)),
            const SizedBox(height: 4),
            const Text('+9분', style: TextStyle(fontSize: 48, fontWeight: FontWeight.w800, letterSpacing: -1.0)),
            const SizedBox(height: 4),
            const Text('오늘 확정 전 예상 수익', style: TextStyle(fontSize: 13, color: AppColors.subText)),
            const SizedBox(height: 18),
            ...MockTimevestData.symbols.map((s) => _SymbolCell(symbol: s)).toList(),
            const SizedBox(height: 14),
            const Text('오늘 거래 3/5회 · 광고로 1회 추가 가능', style: TextStyle(fontSize: 13, color: AppColors.subText)),
          ],
        ),
      ),
    );
  }
}

class _SymbolCell extends StatelessWidget {
  final SymbolQuote symbol;
  const _SymbolCell({required this.symbol});

  @override
  Widget build(BuildContext context) {
    final up = symbol.delta >= 0;
    final deltaColor = up ? AppColors.up : AppColors.down;

    return GestureDetector(
      onTap: () => Navigator.push(
        context,
        CupertinoPageRoute(builder: (_) => SymbolDetailScreen(symbol: symbol)),
      ),
      child: Container(
        margin: const EdgeInsets.only(bottom: 10),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: AppColors.card,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.line),
        ),
        child: Row(
          children: [
            Expanded(
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(symbol.symbol, style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w700)),
                const SizedBox(height: 3),
                Text('${symbol.price}  ${symbol.delta >= 0 ? '+' : ''}${symbol.delta}', style: TextStyle(fontSize: 13, color: deltaColor, fontWeight: FontWeight.w600)),
              ]),
            ),
            SizedBox(width: 120, child: MiniLineChart(points: symbol.spark, color: deltaColor)),
          ],
        ),
      ),
    );
  }
}
