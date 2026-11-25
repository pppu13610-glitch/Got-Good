/**
 * Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// If the loader is already loaded, just stop.
if (!self.define) {
  let registry = {};

  // Used for `eval` and `importScripts` where we can't get script URL by other means.
  // In both cases, it's safe to use a global var because those functions are synchronous.
  let nextDefineUri;

  const singleRequire = (uri, parentUri) => {
    uri = new URL(uri + ".js", parentUri).href;
    return registry[uri] || (
      
        new Promise(resolve => {
          if ("document" in self) {
            const script = document.createElement("script");
            script.src = uri;
            script.onload = resolve;
            document.head.appendChild(script);
          } else {
            nextDefineUri = uri;
            importScripts(uri);
            resolve();
          }
        })
      
      .then(() => {
        let promise = registry[uri];
        if (!promise) {
          throw new Error(`Module ${uri} didn’t register its module`);
        }
        return promise;
      })
    );
  };

  self.define = (depsNames, factory) => {
    const uri = nextDefineUri || ("document" in self ? document.currentScript.src : "") || location.href;
    if (registry[uri]) {
      // Module is already loading or loaded.
      return;
    }
    let exports = {};
    const require = depUri => singleRequire(depUri, uri);
    const specialDeps = {
      module: { uri },
      exports,
      require
    };
    registry[uri] = Promise.all(depsNames.map(
      depName => specialDeps[depName] || require(depName)
    )).then(deps => {
      factory(...deps);
      return exports;
    });
  };
}
define(['./workbox-afac4cd2'], (function (workbox) { 'use strict';

  self.skipWaiting();
  workbox.clientsClaim();
  /**
   * The precacheAndRoute() method efficiently caches and responds to
   * requests for URLs in the manifest.
   * See https://goo.gl/S9QRab
   */
  workbox.precacheAndRoute([{
    "url": "pwa-maskable-512x512.png",
    "revision": "7aeba57b80502553e6713903c2d6ab64"
  }, {
    "url": "pwa-512x512.png",
    "revision": "7403b09cda53ef68b823c2d1a3b50007"
  }, {
    "url": "pwa-192x192.png",
    "revision": "34b3cc77c14f1a63c84f50b10472222a"
  }, {
    "url": "index.html",
    "revision": "c47bbfd207c869586736325354101c41"
  }, {
    "url": "icon.svg",
    "revision": "b8792c44d1136ce91daf58aacca73847"
  }, {
    "url": "apple-touch-icon.png",
    "revision": "f8df6dcc599c4b75955e6035fc612a28"
  }, {
    "url": "src/assets/images/tea_house_backdrop_1795626509107.jpg",
    "revision": "91af1b26ff8ecff27d7265a9c303c57a"
  }, {
    "url": "src/assets/images/guest_writer_1795626509986.jpg",
    "revision": "38967d5adbf7b4587422a4b52e92e1fd"
  }, {
    "url": "src/assets/images/guest_grandma_1795626510510.jpg",
    "revision": "2497e8d45b00e1887e5b46fe4efa6b79"
  }, {
    "url": "src/assets/images/guest_cat_1795626509273.jpg",
    "revision": "75e367219ed737a9c7eefe00a6e32a91"
  }, {
    "url": "assets/workbox-window.prod.es5-Bd17z0YL.js",
    "revision": null
  }, {
    "url": "assets/index-BpEvBlN1.js",
    "revision": null
  }, {
    "url": "assets/index-9zPdtXjF.css",
    "revision": null
  }, {
    "url": "apple-touch-icon.png",
    "revision": "f8df6dcc599c4b75955e6035fc612a28"
  }, {
    "url": "icon.svg",
    "revision": "b8792c44d1136ce91daf58aacca73847"
  }, {
    "url": "pwa-192x192.png",
    "revision": "34b3cc77c14f1a63c84f50b10472222a"
  }, {
    "url": "pwa-512x512.png",
    "revision": "7403b09cda53ef68b823c2d1a3b50007"
  }, {
    "url": "pwa-maskable-512x512.png",
    "revision": "7aeba57b80502553e6713903c2d6ab64"
  }, {
    "url": "manifest.webmanifest",
    "revision": "3995921c966ab84f8f65907dde34d511"
  }], {});
  workbox.cleanupOutdatedCaches();
  workbox.registerRoute(new workbox.NavigationRoute(workbox.createHandlerBoundToURL("index.html")));
  workbox.registerRoute(/^https:\/\/fonts\.googleapis\.com\/.*/i, new workbox.CacheFirst({
    "cacheName": "google-fonts-cache",
    plugins: [new workbox.ExpirationPlugin({
      maxEntries: 10,
      maxAgeSeconds: 31536000
    }), new workbox.CacheableResponsePlugin({
      statuses: [0, 200]
    })]
  }), 'GET');
  workbox.registerRoute(/^https:\/\/fonts\.gstatic\.com\/.*/i, new workbox.CacheFirst({
    "cacheName": "gstatic-fonts-cache",
    plugins: [new workbox.ExpirationPlugin({
      maxEntries: 10,
      maxAgeSeconds: 31536000
    }), new workbox.CacheableResponsePlugin({
      statuses: [0, 200]
    })]
  }), 'GET');

}));
