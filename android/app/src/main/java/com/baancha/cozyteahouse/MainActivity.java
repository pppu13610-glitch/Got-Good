package com.baancha.cozyteahouse;

import android.app.ActivityManager;
import android.app.GameManager;
import android.app.GameState;
import android.content.Context;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.os.Process;
import android.view.Display;
import android.view.WindowManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebSettings;
import android.webkit.WebView;
import androidx.activity.OnBackPressedCallback;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;
import org.json.JSONObject;

public class MainActivity extends BridgeActivity {
    private int detectedDisplayHz = 60;
    private boolean isTerminating = false;
    private boolean isWebViewPaused = false;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_HARDWARE_ACCELERATED);
        enableHighRefreshRate();
        engageAndroidGameMode();
        hardenWebViewAndAttachHardwareBridge();
        hideSystemBars();

        getOnBackPressedDispatcher().addCallback(
            this,
            new OnBackPressedCallback(true) {
                @Override
                public void handleOnBackPressed() {
                    terminateAppCompletely();
                }
            }
        );
    }

    @Override
    public void onStart() {
        super.onStart();
        if (!isTerminating) {
            resumeWebViewSafely();
        }
    }

    @Override
    public void onResume() {
        super.onResume();
        if (isTerminating) return;
        resumeWebViewSafely();
        enableHighRefreshRate();
        engageAndroidGameMode();
        hideSystemBars();
        dispatchLifecycleToJs("window.__baanchaAppResume && window.__baanchaAppResume();");
    }

    @Override
    public void onPause() {
        dispatchLifecycleToJs("window.__baanchaAppPause && window.__baanchaAppPause();");
        pauseWebViewMediaSafely(false);
        super.onPause();
    }

    @Override
    public void onStop() {
        dispatchLifecycleToJs("window.__baanchaAppPause && window.__baanchaAppPause();");
        pauseWebViewMediaSafely(true);
        super.onStop();
    }

    @Override
    public void onDestroy() {
        boolean shouldKillProcess =
            (isTerminating || isFinishing()) && !isChangingConfigurations();
        stopAndClearWebViewForExit();
        super.onDestroy();
        if (shouldKillProcess) {
            new Handler(Looper.getMainLooper()).postDelayed(() -> {
                Process.killProcess(Process.myPid());
                System.exit(0);
            }, 150);
        }
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus && !isTerminating) {
            enableHighRefreshRate();
            engageAndroidGameMode();
            hideSystemBars();
        }
    }

    private void dispatchLifecycleToJs(String script) {
        try {
            if (getBridge() == null || getBridge().getWebView() == null) return;
            WebView webView = getBridge().getWebView();
            webView.evaluateJavascript(script, null);
        } catch (Throwable ignored) {
        }
    }

    private void pauseWebViewMediaSafely(boolean pauseTimers) {
        try {
            if (getBridge() == null || getBridge().getWebView() == null) return;
            WebView webView = getBridge().getWebView();
            if (!isWebViewPaused) {
                webView.onPause();
                isWebViewPaused = true;
            }
            if (pauseTimers) {
                webView.pauseTimers();
            }
        } catch (Throwable ignored) {
        }
    }

    private void resumeWebViewSafely() {
        try {
            if (getBridge() == null || getBridge().getWebView() == null) return;
            WebView webView = getBridge().getWebView();
            webView.resumeTimers();
            if (isWebViewPaused) {
                webView.onResume();
                isWebViewPaused = false;
            }
        } catch (Throwable ignored) {
        }
    }

    private void stopAndClearWebViewForExit() {
        try {
            if (getBridge() == null || getBridge().getWebView() == null) return;
            WebView webView = getBridge().getWebView();
            webView.onPause();
            webView.pauseTimers();
            webView.stopLoading();
            webView.loadUrl("about:blank");
            isWebViewPaused = true;
        } catch (Throwable ignored) {
        }
    }

    private void terminateAppCompletely() {
        runOnUiThread(() -> {
            if (isTerminating) return;
            isTerminating = true;
            dispatchLifecycleToJs("window.__baanchaAppExit && window.__baanchaAppExit();");
            stopAndClearWebViewForExit();
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                finishAndRemoveTask();
            } else {
                finishAffinity();
            }
            new Handler(Looper.getMainLooper()).postDelayed(() -> {
                Process.killProcess(Process.myPid());
                System.exit(0);
            }, 140);
        });
    }

    private void engageAndroidGameMode() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            try {
                GameManager gm = getSystemService(GameManager.class);
                if (gm != null) {
                    gm.setGameState(new GameState(false, GameState.MODE_GAMEPLAY_INTERRUPTIBLE));
                }
            } catch (Throwable ignored) {
            }
        }
    }

    private void hardenWebViewAndAttachHardwareBridge() {
        try {
            if (getBridge() == null || getBridge().getWebView() == null) return;
            WebView webView = getBridge().getWebView();
            WebSettings settings = webView.getSettings();
            settings.setAllowFileAccessFromFileURLs(false);
            settings.setAllowUniversalAccessFromFileURLs(false);
            settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
            settings.setGeolocationEnabled(false);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                settings.setSafeBrowsingEnabled(true);
            }
            webView.addJavascriptInterface(new HardwareBridge(), "BaanChaHardwareBridge");
        } catch (Throwable ignored) {
        }
    }

    private void enableHighRefreshRate() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) return;
        try {
            Display display =
                Build.VERSION.SDK_INT >= Build.VERSION_CODES.R
                    ? getDisplay()
                    : getWindowManager().getDefaultDisplay();
            if (display == null) return;
            Display.Mode current = display.getMode();
            Display.Mode[] modes = display.getSupportedModes();
            Display.Mode bestMode = current;
            for (Display.Mode m : modes) {
                if (m.getPhysicalWidth() == current.getPhysicalWidth()
                    && m.getPhysicalHeight() == current.getPhysicalHeight()
                    && m.getRefreshRate() > bestMode.getRefreshRate()) {
                    bestMode = m;
                }
            }
            detectedDisplayHz = Math.round(bestMode.getRefreshRate());
            if (bestMode.getModeId() != current.getModeId()) {
                WindowManager.LayoutParams lp = getWindow().getAttributes();
                lp.preferredDisplayModeId = bestMode.getModeId();
                getWindow().setAttributes(lp);
            }
        } catch (Throwable ignored) {
        }
    }

    private void hideSystemBars() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            WindowManager.LayoutParams lp = getWindow().getAttributes();
            lp.layoutInDisplayCutoutMode =
                WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_ALWAYS;
            getWindow().setAttributes(lp);
        } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            WindowManager.LayoutParams lp = getWindow().getAttributes();
            lp.layoutInDisplayCutoutMode =
                WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES;
            getWindow().setAttributes(lp);
        }

        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
        WindowInsetsControllerCompat controller =
            WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView());
        if (controller != null) {
            controller.setSystemBarsBehavior(
                WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
            );
            controller.hide(
                WindowInsetsCompat.Type.statusBars() | WindowInsetsCompat.Type.navigationBars()
            );
        }
    }

    private class HardwareBridge {
        @JavascriptInterface
        public String getHardwareSnapshotJson() {
            try {
                JSONObject json = new JSONObject();
                json.put("manufacturer", Build.MANUFACTURER != null ? Build.MANUFACTURER : "");
                json.put("model", Build.MODEL != null ? Build.MODEL : "");
                json.put("device", Build.DEVICE != null ? Build.DEVICE : "");
                json.put("board", Build.BOARD != null ? Build.BOARD : "");
                json.put("hardware", Build.HARDWARE != null ? Build.HARDWARE : "");
                json.put("androidRelease", Build.VERSION.RELEASE != null ? Build.VERSION.RELEASE : "");
                json.put("sdkInt", Build.VERSION.SDK_INT);
                json.put("displayId", Build.DISPLAY != null ? Build.DISPLAY : "");
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                    json.put("socModel", Build.SOC_MODEL != null ? Build.SOC_MODEL : "");
                } else {
                    json.put("socModel", "");
                }
                ActivityManager am = (ActivityManager) getSystemService(Context.ACTIVITY_SERVICE);
                if (am != null) {
                    ActivityManager.MemoryInfo mi = new ActivityManager.MemoryInfo();
                    am.getMemoryInfo(mi);
                    json.put("totalRamMb", Math.round(mi.totalMem / (1024.0 * 1024.0)));
                }
                json.put("displayHz", detectedDisplayHz);
                json.put("gameModeSupported", Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU);
                return json.toString();
            } catch (Throwable ignored) {
                return "{}";
            }
        }

        @JavascriptInterface
        public void exitAppCompletely() {
            runOnUiThread(MainActivity.this::terminateAppCompletely);
        }
    }
}
