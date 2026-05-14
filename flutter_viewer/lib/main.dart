import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';

/// Read-only EFCP viewer (loads the same web app as `viewer.html`).
///
/// Build with a custom URL:
/// `flutter build apk --release --dart-define=VIEWER_URL=https://YOUR_PROJECT.web.app/viewer.html`
///
/// Deploy the web viewer first: from repo root, `npm run viewer:deploy`.
const String kViewerUrl = String.fromEnvironment(
  'VIEWER_URL',
  defaultValue: 'https://motorparts-64836.web.app/viewer.html',
);

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const EfcpViewerApp());
}

class EfcpViewerApp extends StatelessWidget {
  const EfcpViewerApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'EFCP Viewer',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF4338CA)),
        useMaterial3: true,
      ),
      home: const ViewerScreen(),
    );
  }
}

class ViewerScreen extends StatefulWidget {
  const ViewerScreen({super.key});

  @override
  State<ViewerScreen> createState() => _ViewerScreenState();
}

class _ViewerScreenState extends State<ViewerScreen> {
  late final WebViewController _controller;
  var _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setNavigationDelegate(
        NavigationDelegate(
          onPageStarted: (_) => setState(() {
            _loading = true;
            _error = null;
          }),
          onPageFinished: (_) => setState(() => _loading = false),
          onWebResourceError: (WebResourceError err) => setState(() {
            _loading = false;
            _error = err.description;
          }),
        ),
      )
      ..loadRequest(Uri.parse(kViewerUrl));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('EFCP Motor Parts and Trading'),
        actions: [
          IconButton(
            tooltip: 'Refresh',
            onPressed: () => _controller.reload(),
            icon: const Icon(Icons.refresh),
          ),
        ],
      ),
      body: Stack(
        alignment: Alignment.topCenter,
        children: [
          WebViewWidget(controller: _controller),
          if (_loading) const LinearProgressIndicator(minHeight: 2),
          if (_error != null)
            Positioned(
              left: 0,
              right: 0,
              bottom: 0,
              child: Material(
                color: Colors.red.shade50,
                child: Padding(
                  padding: const EdgeInsets.all(12),
                  child: Text(
                    _error!,
                    style: TextStyle(color: Colors.red.shade900),
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}
