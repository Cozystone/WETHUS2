import 'package:flutter/cupertino.dart';

class LedgerScreen extends StatelessWidget {
  const LedgerScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return CupertinoPageScaffold(
      navigationBar: const CupertinoNavigationBar(middle: Text('Ledger')),
      child: SafeArea(
        child: ListView(
          children: const [
            _Cell(title: 'Coffee', amount: '-₩5,000'),
            _Cell(title: 'Salary', amount: '+₩2,500,000'),
          ],
        ),
      ),
    );
  }
}

class _Cell extends StatelessWidget {
  final String title;
  final String amount;
  const _Cell({required this.title, required this.amount});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      decoration: const BoxDecoration(
        border: Border(bottom: BorderSide(color: CupertinoColors.separator, width: 0.5)),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [Text(title), Text(amount)],
      ),
    );
  }
}
