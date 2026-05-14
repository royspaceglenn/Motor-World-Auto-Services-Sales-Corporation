import 'package:flutter_test/flutter_test.dart';

import 'package:efcp_viewer/main.dart';

void main() {
  testWidgets('loads viewer shell', (WidgetTester tester) async {
    await tester.pumpWidget(const EfcpViewerApp());
    expect(find.text('EFCP Motor Parts and Trading'), findsOneWidget);
  });
}
