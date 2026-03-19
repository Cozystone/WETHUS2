import 'package:flutter/cupertino.dart';

class SettingsScreen extends StatelessWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return CupertinoPageScaffold(
      navigationBar: const CupertinoNavigationBar(middle: Text('Settings')),
      child: SafeArea(
        child: ListView(
          children: const [
            _SettingRow('Currency', 'KRW'),
            _SettingRow('Language', 'Korean'),
            _SettingRow('Theme', 'iOS Light'),
          ],
        ),
      ),
    );
  }
}

class _SettingRow extends StatelessWidget {
  final String title;
  final String value;
  const _SettingRow(this.title, this.value);

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      decoration: const BoxDecoration(
        border: Border(bottom: BorderSide(color: CupertinoColors.separator, width: 0.5)),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [Text(title), Text(value, style: const TextStyle(color: CupertinoColors.systemGrey))],
      ),
    );
  }
}
