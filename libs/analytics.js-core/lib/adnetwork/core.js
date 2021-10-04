import { getBidRequestObj } from './bid-request';
import {
  makeCoreDataForBanner,
  makeCoreDataForNativeAds,
  makeCoreDataForVideo,
} from './buildRequest';
import { compareToFindWinner } from './compare';
import { INVENTORY_FORMAT } from './constants';
import { BID_REQUEST_DATA, CORE_DATA } from './mock';
import { renderAd } from './renderAd';
import * as utils from './utils';

async function requestToCore(url, bodyRequest, inventory, placementId) {
  try {
    const startTime = performance.now();
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bodyRequest),
    });
    const endTime = performance.now();
    const data = await res.json();
    const responseTime = endTime - startTime;
    const hasSeatBid = data?.seatbid?.length;

    if (hasSeatBid && hasSeatBid > 0) {
      // TODO - compare price to get bid winner
      const won = compareToFindWinner({ seatBid: data.seatbid });

      // render ads with response
      renderAd({ placementId, bid: won, responseTime, inventory });
    } else {
      // render ads default
      const adsDefault = inventory.ads_default;
      renderAd({ placementId, adsDefault, responseTime, inventory });
    }
  } catch (error) {
    // log error
    const adsDefault = inventory.ads_default;
    renderAd({ placementId, adsDefault, responseTime, inventory });
  }
}

export const bidToCore = async ({ sdk, initData = {}, adUnits = [] }) => {
  const { core, dsps = [], inventories = [], publisher_id } = initData;
  const { url, domain, name, type } = core;

  const { anonymousId, context, ...rest } = sdk.normalize({});

  const inventoryIds = adUnits.map((adUnit) => adUnit.inventoryId);

  let promises = [];

  inventoryIds.forEach((inventoryId, index) => {
    const inventory = inventories.find(
      (inventory) => inventory.id === inventoryId
    );
    if (inventory) {
      const headerBids = inventory.dsps
        .filter((item) => item.header_bidding === 1)
        .map((item) => item.id);

      let bodyRequest = {};

      switch (inventory.format) {
        case INVENTORY_FORMAT.video:
          bodyRequest = makeCoreDataForVideo({
            containerId: sdk._containerId,
            inventoryId: inventory.id,
            publisherId: publisher_id,
            headerBids,
          });
          break;
        case INVENTORY_FORMAT.nativeAd:
          bodyRequest = makeCoreDataForNativeAds({
            containerId: sdk._containerId,
            inventoryId: inventory.id,
            publisherId: publisher_id,
            headerBids,
          });
          break;
        default:
          bodyRequest = makeCoreDataForBanner({
            containerId: sdk._containerId,
            inventoryId: inventory.id,
            publisherId: publisher_id,
            headerBids,
          });
          break;
      }

      const { placementId } = adUnits[index];
      if (placementId) {
        promises.push(requestToCore(url, bodyRequest, inventory, placementId));
      }
    }
  });

  await Promise.all(promises);
};

export const bidToDsp = async ({ sdk, bidData = {} }) => {
  const { url, domain, name, type } = bidData;

  const { anonymousId, context, ...rest } = sdk.normalize({});

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(BID_REQUEST_DATA),
    });
    const data = await res.text();
  } catch (error) {
    console.log('🚀 ~ file: core.js ~ line 8 ~ bidToCore ~ error', error);
  }
};
