class AssetPoint {
  final int x;
  final int y;
  const AssetPoint(this.x, this.y);
}

class SymbolQuote {
  final String symbol;
  final int price;
  final int delta;
  final List<int> spark;
  const SymbolQuote({required this.symbol, required this.price, required this.delta, required this.spark});
}

class MockTimevestData {
  static const int walletT = 148;
  static const int todayExpectedT = 12;
  static const int comparedT = 12;
  static const String league = '골드 리그 6위';
  static const String leagueSub = '승급까지 18점';

  static const List<AssetPoint> weekCurve = [
    AssetPoint(0, 121), AssetPoint(1, 126), AssetPoint(2, 124), AssetPoint(3, 132), AssetPoint(4, 139), AssetPoint(5, 142), AssetPoint(6, 148),
  ];

  static const List<SymbolQuote> symbols = [
    SymbolQuote(symbol: 'YouTube', price: 103, delta: 2, spark: [98, 99, 100, 101, 103, 102, 103]),
    SymbolQuote(symbol: 'Instagram', price: 97, delta: -4, spark: [104, 103, 102, 100, 99, 98, 97]),
    SymbolQuote(symbol: 'TikTok', price: 110, delta: 3, spark: [102, 103, 105, 107, 108, 109, 110]),
  ];
}
