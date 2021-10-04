import * as utils from './utils';

export function renderAd({
  placementId,
  bid,
  adsDefault,
  responseTime,
  inventory,
}) {
  // const {width, height} = bid;
  const DOMLoaded = utils.checkDOMLoaded();

  if (DOMLoaded) {
    if (!bid) {
      // nếu không có bid response thì dùng ads default
      const seatBid = adsDefault.bid_info.seatbid[0];
      if (seatBid) {
        const adItem = seatBid.bid[0];
        if (adItem) {
          loadAd(placementId, adItem.adm, {
            width: 300,
            height: 300,
            responseTime,
            inventory,
          });
        }
      }
    } else {
      const adItem = bid?.bid[0];
      if (adItem) {
        if (inventory.format === 'video') {
          loadVideoAd(placementId, adItem.adm, {
            width: 300,
            height: 300,
            responseTime,
            inventory,
          });
        } else {
          if (inventory.format === 'banner') {
            loadBannerAd(placementId, adItem.adm, {
              width: 300,
              height: 300,
              responseTime,
              inventory,
            });
          } else {
            loadNativeAd(placementId, adItem, {});
          }
        }
      }
    }
  } else {
    // use window load event???
  }
}

function loadBannerAd(placementId, content, options = {}) {
  const { width, height, responseTime, inventory } = options;

  const placement = document.getElementById(placementId);
  if (placement) {
    const iframe = utils.createInvisibleIframe();
    iframe.height = width;
    iframe.width = height;
    iframe.style.display = 'inline';
    iframe.style.overflow = 'hidden';

    placement.appendChild(iframe);
    const div = document.createElement('div');
    div.innerHTML = `
      <div>Inventory: ${inventory.id}</div>
      <div>Performance Time: ${responseTime}</div>
    `;
    placement.appendChild(div);

    const iframeDoc = utils.getIframeContentDoc(iframe);
    iframeDoc.open();
    iframeDoc.write(content);
    iframeDoc.close();
  } else {
    // log warning...
  }
}

function loadVideoAd(placementId, content, options = {}) {
  const { width, height, responseTime, inventory } = options;
  const placement = document.getElementById(placementId);
  if (placement) {
    const iframe = utils.createInvisibleIframe();
    iframe.height = width;
    iframe.width = height;
    iframe.style.display = 'inline';
    iframe.style.overflow = 'hidden';
    iframe.allow = 'autoplay';

    placement.appendChild(iframe);
    const div = document.createElement('div');
    div.innerHTML = `
      <div>Inventory: ${inventory.id}</div>
      <div>Performance Time: ${responseTime}</div>
    `;
    placement.appendChild(div);

    const iframeDoc = utils.getIframeContentDoc(iframe);
    iframeDoc.open();
    iframeDoc.write(utils.getVastPlayer(content));
    iframeDoc.close();
  } else {
    // log warning...
  }
}

function loadNativeAd(placementId, adItem, options = {}) {
  console.log(
    '🚀 ~ file: renderAd.js ~ line 114 ~ loadNativeAd ~ adItem',
    adItem
  );
  const parsed = JSON.parse(adItem.adm);
  console.log(
    '🚀 ~ file: renderAd.js ~ line 116 ~ loadNativeAd ~ parsed',
    parsed
  );
}
