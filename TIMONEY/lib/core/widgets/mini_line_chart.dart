import 'dart:math';
import 'package:flutter/cupertino.dart';
import '../design/app_colors.dart';

class MiniLineChart extends StatelessWidget {
  final List<int> points;
  final Color color;
  final double height;

  const MiniLineChart({super.key, required this.points, required this.color, this.height = 56});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: height,
      width: double.infinity,
      child: CustomPaint(painter: _LinePainter(points: points, color: color)),
    );
  }
}

class _LinePainter extends CustomPainter {
  final List<int> points;
  final Color color;
  _LinePainter({required this.points, required this.color});

  @override
  void paint(Canvas canvas, Size size) {
    if (points.length < 2) return;

    final minV = points.reduce(min).toDouble();
    final maxV = points.reduce(max).toDouble();
    final range = (maxV - minV).abs() < 1 ? 1 : (maxV - minV);

    final grid = Paint()
      ..color = AppColors.line
      ..strokeWidth = 1;
    canvas.drawLine(Offset(0, size.height - 1), Offset(size.width, size.height - 1), grid);

    final line = Paint()
      ..color = color
      ..strokeWidth = 2.4
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round;

    final path = Path();
    for (int i = 0; i < points.length; i++) {
      final x = i * (size.width / (points.length - 1));
      final normalized = (points[i] - minV) / range;
      final y = size.height - (normalized * (size.height - 6)) - 3;
      if (i == 0) {
        path.moveTo(x, y);
      } else {
        path.lineTo(x, y);
      }
    }
    canvas.drawPath(path, line);
  }

  @override
  bool shouldRepaint(covariant _LinePainter oldDelegate) {
    return oldDelegate.points != points || oldDelegate.color != color;
  }
}
