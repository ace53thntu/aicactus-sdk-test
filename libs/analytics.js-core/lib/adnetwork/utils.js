export function insertElement(elm, doc, target, asLastChildChild) {
  doc = doc || document;
  let parentEl;
  if (target) {
    parentEl = doc.getElementsByTagName(target);
  } else {
    parentEl = doc.getElementsByTagName('head');
  }
  try {
    parentEl = parentEl.length ? parentEl : doc.getElementsByTagName('body');
    if (parentEl.length) {
      parentEl = parentEl[0];
      let insertBeforeEl = asLastChildChild ? null : parentEl.firstChild;
      return parentEl.insertBefore(elm, insertBeforeEl);
    }
  } catch (e) {}
}

export function getIframeContentDoc(iframe) {
  var doc;
  try {
    if (iframe.contentWindow) {
      doc = iframe.contentWindow.document;
    } else if (iframe.contentDocument.document) {
      doc = iframe.contentDocument.document;
    } else {
      doc = iframe.contentDocument;
    }
  } catch (e) {}
  return doc;
}

export function checkDOMLoaded() {
  return (
    document.readyState === 'complete' || document.readyState === 'interactive'
  );
}

/* utility method to get incremental integer starting from 1 */
var getIncrementalInteger = (function () {
  var count = 0;
  return function () {
    count++;
    return count;
  };
})();

// generate a random string (to be used as a dynamic JSONP callback)
export function getUniqueIdentifierStr() {
  return getIncrementalInteger() + Math.random().toString(16).substr(2);
}

export function createInvisibleIframe() {
  const f = document.createElement('iframe');
  f.id = getUniqueIdentifierStr();
  f.height = 0;
  f.width = 0;
  f.border = '0px';
  f.hspace = '0';
  f.vspace = '0';
  f.marginWidth = '0';
  f.marginHeight = '0';
  f.style.border = '0';
  f.scrolling = 'no';
  f.frameBorder = '0';
  f.src = 'about:blank';
  f.style.display = 'none';
  return f;
}

// kiểm tra xem bid response có error hay không
export function checkResponseError(response) {
  const isError = response?.ext?.errors
    ? Object.keys(response.ext.errors).length > 0
    : false;

  return isError;
}

export function checkInventoryExistedOnDOM(inventoryId) {
  return document && document.getElementById(inventoryId);
}

export const getVastPlayer = (adm) => {
  return `<!DOCTYPE html>
  <html>
    <head>
      <script src="https://cdn.jsdelivr.net/npm/vast-player@0.2/dist/vast-player.min.js"></script>
    </head>
    <body>
      <div id="container"></div>
      <script>
        (function (VASTPlayer) {
          "use strict";
  
          var player = new VASTPlayer(document.getElementById("container"));
  
          player.once("AdStopped", function () {
            console.log("Ad finished playback!");
          });
  
          player
            .load(
              "${adm}"
            )
            .then(function startAd() {
              return player.startAd();
            })
            .catch(function (reason) {
              setTimeout(function () {
                throw reason;
              }, 0);
            });
        })(window.VASTPlayer);
      </script>
    </body>
  </html>
  `;
};

export function sortBy(data = [], key) {
  return data.sort((a, b) => a[key] - b[key]);
}
