import 'package:flutter/cupertino.dart';
import '../../core/design/app_colors.dart';
import '../../core/widgets/mini_line_chart.dart';
import '../../data/mock/timevest_mock_data.dart';

class SymbolDetailScreen extends StatefulWidget {
  final SymbolQuote symbol;
  const SymbolDetailScreen({super.key, required this.symbol});

  @override
  State<SymbolDetailScreen> createState() => _SymbolDetailScreenState();
}

class _SymbolDetailScreenState extends State<SymbolDetailScreen> {
  int selected = 0; // 0 1D, 1 1W, 2 1M

  @override
  Widget build(BuildContext context) {
    final up = widget.symbol.delta >= 0;
    final deltaColor = up ? AppColors.up : AppColors.down;

    return CupertinoPageScaffold(
      backgroundColor: AppColors.bg,
      navigationBar: CupertinoNavigationBar(
        backgroundColor: AppColors.bg,
        border: null,
        middle: Text(widget.symbol.symbol, style: const TextStyle(fontWeight: FontWeight.w700)),
      ),
      child: SafeArea(
        child: Stack(
          children: [
            ListView(
              padding: const EdgeInsets.fromLTRB(20, 12, 20, 120),
              children: [
                Text('${widget.symbol.price}', style: const TextStyle(fontSize: 48, fontWeight: FontWeight.w800, letterSpacing: -1.0)),
                Text('${widget.symbol.delta >= 0 ? '+' : ''}${widget.symbol.delta}', style: TextStyle(fontSize: 16, color: deltaColor, fontWeight: FontWeight.w700)),
                const SizedBox(height: 16),
                _periodTabs(),
                const SizedBox(height: 12),
                MiniLineChart(points: _periodSeries(widget.symbol.spark), color: deltaColor, height: 210),
                const SizedBox(height: 18),
                _PositionCard(symbol: widget.symbol),
              ],
            ),
            Positioned(
              left: 16,
              right: 16,
              bottom: 16,
              child: Row(children: [
                Expanded(child: _actionButton('팔기', CupertinoColors.systemGrey2, () => _tradeSheet(false))),
                const SizedBox(width: 10),
                Expanded(child: _actionButton('사기', AppColors.accent, () => _tradeSheet(true), textColor: CupertinoColors.white)),
              ]),
            ),
          ],
        ),
      ),
    );
  }

  List<int> _periodSeries(List<int> base) {
    if (selected == 0) return base;
    if (selected == 1) return [...base, base.last - 1, base.last + 2, base.last + 1, base.last + 3];
    return [...base, base.last - 2, base.last - 1, base.last + 1, base.last + 4, base.last + 2, base.last + 5];
  }

  Widget _periodTabs() {
    const labels = ['1D', '1W', '1M'];
    return Row(
      children: List.generate(labels.length, (i) {
        final active = selected == i;
        return Padding(
          padding: const EdgeInsets.only(right: 8),
          child: CupertinoButton(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
            minSize: 0,
            color: active ? AppColors.text : CupertinoColors.white,
            borderRadius: BorderRadius.circular(10),
            onPressed: () => setState(() => selected = i),
            child: Text(labels[i], style: TextStyle(color: active ? CupertinoColors.white : AppColors.text, fontWeight: FontWeight.w600)),
          ),
        );
      }),
    );
  }

  Widget _actionButton(String text, Color color, VoidCallback onTap, {Color textColor = AppColors.text}) {
    return CupertinoButton(
      onPressed: onTap,
      color: color,
      borderRadius: BorderRadius.circular(14),
      padding: const EdgeInsets.symmetric(vertical: 14),
      child: Text(text, style: TextStyle(color: textColor, fontWeight: FontWeight.w700)),
    );
  }

  void _tradeSheet(bool isBuy) {
    showCupertinoModalPopup(
      context: context,
      builder: (_) => _TradeSheet(symbol: widget.symbol, isBuy: isBuy),
    );
  }
}

class _PositionCard extends StatelessWidget {
  final SymbolQuote symbol;
  const _PositionCard({required this.symbol});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.card,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.line),
      ),
      child: const Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('보유 8T', style: TextStyle(fontWeight: FontWeight.w700)),
          SizedBox(height: 6),
          Text('평균 진입 101', style: TextStyle(color: AppColors.subText)),
          SizedBox(height: 4),
          Text('평가손익 +3T', style: TextStyle(color: AppColors.up, fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }
}

class _TradeSheet extends StatelessWidget {
  final bool isBuy;
  final SymbolQuote symbol;
  const _TradeSheet({required this.symbol, required this.isBuy});

  @override
  Widget build(BuildContext context) {
    final choices = [1, 3, 5, 10, 20];
    return CupertinoPopupSurface(
      isSurfacePainted: true,
      child: Container(
        color: AppColors.card,
        padding: const EdgeInsets.fromLTRB(18, 18, 18, 24),
        child: SafeArea(
          top: false,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('${isBuy ? '사기' : '팔기'} · ${symbol.symbol}', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
              const SizedBox(height: 6),
              Text('현재가 ${symbol.price}', style: const TextStyle(color: AppColors.subText)),
              const SizedBox(height: 14),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: choices
                    .map((v) => CupertinoButton(
                          minSize: 0,
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                          color: CupertinoColors.systemGrey6,
                          borderRadius: BorderRadius.circular(10),
                          onPressed: () {
                            Navigator.pop(context);
                            _toast(context, '${v}T ${isBuy ? '매수' : '매도'} 체결');
                          },
                          child: Text('${v}T', style: const TextStyle(color: AppColors.text, fontWeight: FontWeight.w700)),
                        ))
                    .toList(),
              ),
              const SizedBox(height: 14),
              SizedBox(
                width: double.infinity,
                child: CupertinoButton(
                  color: AppColors.accent,
                  borderRadius: BorderRadius.circular(12),
                  onPressed: () => Navigator.pop(context),
                  child: const Text('닫기', style: TextStyle(color: CupertinoColors.white)),
                ),
              )
            ],
          ),
        ),
      ),
    );
  }

  void _toast(BuildContext context, String text) {
    showCupertinoDialog(
      context: context,
      builder: (_) => CupertinoAlertDialog(
        content: Text(text),
        actions: [
          CupertinoDialogAction(onPressed: () => Navigator.pop(context), child: const Text('확인')),
        ],
      ),
    );
  }
}
