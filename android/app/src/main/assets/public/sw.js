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
define(['./workbox-cc1d1889'], (function (workbox) { 'use strict';

  self.skipWaiting();
  workbox.clientsClaim();
  /**
   * The precacheAndRoute() method efficiently caches and responds to
   * requests for URLs in the manifest.
   * See https://goo.gl/S9QRab
   */
  workbox.precacheAndRoute([{
    "url": "registerSW.js",
    "revision": "1872c500de691dce40960bb85481de07"
  }, {
    "url": "pwa-maskable-512x512.png",
    "revision": "f99feb5056d0f0e36709b6fc8c71e399"
  }, {
    "url": "pwa-512x512.png",
    "revision": "584403487ee6ded0292eaf41efd7d3cd"
  }, {
    "url": "pwa-192x192.png",
    "revision": "3565cfd8e9405808b7c32803b29cb3f8"
  }, {
    "url": "index.html",
    "revision": "0d81bc77ea1a7445085bb081b7c6fd13"
  }, {
    "url": "icon.svg",
    "revision": "258313697842bf404cf6d023f8df1876"
  }, {
    "url": "apple-touch-icon.png",
    "revision": "64e47ad15919804583af717ce0578f25"
  }, {
    "url": "assets/index-Df37noey.css",
    "revision": null
  }, {
    "url": "assets/index-CbURy9ue.js",
    "revision": null
  }, {
    "url": "apple-touch-icon.png",
    "revision": "64e47ad15919804583af717ce0578f25"
  }, {
    "url": "icon.svg",
    "revision": "258313697842bf404cf6d023f8df1876"
  }, {
    "url": "pwa-192x192.png",
    "revision": "3565cfd8e9405808b7c32803b29cb3f8"
  }, {
    "url": "pwa-512x512.png",
    "revision": "584403487ee6ded0292eaf41efd7d3cd"
  }, {
    "url": "pwa-maskable-512x512.png",
    "revision": "f99feb5056d0f0e36709b6fc8c71e399"
  }, {
    "url": "manifest.webmanifest",
    "revision": "5dab2e5520d33140666dd880a578c06d"
  }], {});
  workbox.cleanupOutdatedCaches();
  workbox.registerRoute(new workbox.NavigationRoute(workbox.createHandlerBoundToURL("/index.html"), {
    denylist: [/^\/api\//]
  }));
  workbox.registerRoute(/^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i, new workbox.CacheFirst({
    "cacheName": "google-fonts-cache",
    plugins: [new workbox.ExpirationPlugin({
      maxEntries: 12,
      maxAgeSeconds: 31536000
    }), new workbox.CacheableResponsePlugin({
      statuses: [0, 200]
    })]
  }), 'GET');
  workbox.registerRoute(/\/api\/.*/i, new workbox.NetworkOnly(), 'GET');

}));
