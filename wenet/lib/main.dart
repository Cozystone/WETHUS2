import 'package:flutter/material.dart';
import 'features/intro/intro_screen.dart';

void main() {
  runApp(const WenetApp());
}

class WenetApp extends StatelessWidget {
  const WenetApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'WENET',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.indigo),
        scaffoldBackgroundColor: const Color(0xFFF8F9FB),
      ),
      home: const IntroScreen(),
    );
  }
}
