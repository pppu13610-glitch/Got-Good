package com.baancha.cozyteahouse;

import android.os.Build;
import android.os.Bundle;
import android.view.Display;
import android.view.WindowManager;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        enableHighRefreshRate();
        hideSystemBars();
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) {
            enableHighRefreshRate();
            hideSystemBars();
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
}
