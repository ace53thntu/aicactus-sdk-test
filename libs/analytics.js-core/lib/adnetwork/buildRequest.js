import { v4 as uuid } from 'uuid';

import { getBidRequestObj } from './bid-request';
import { getImpDefinedObj } from './bid-request/imp';

export const makeCoreDataForBanner = ({
  containerId,
  inventoryId,
  publisherId,
  headerBids = [],
}) => {
  const bidRequest = getBidRequestObj();
  const impObject = getImpDefinedObj({
    type: 'banner',
    aic_ads: {
      header_bids: headerBids,
      container_id: containerId,
      inventory_id: inventoryId,
    },
    data: {
      api: [5], // này là gì?
      // format lấy từ đâu?
      format: [
        {
          w: 300,
          h: 250,
        },
      ],
    },
  });

  return {
    ...bidRequest,
    imp: [impObject],
  };
};

export const makeCoreDataForVideo = ({
  containerId,
  inventoryId,
  publisherId,
  headerBids = [],
}) => {
  const bidRequest = getBidRequestObj();
  const impObject = getImpDefinedObj({
    type: 'video',
    aic_ads: {
      header_bids: headerBids,
      container_id: containerId,
      inventory_id: inventoryId,
    },
    data: {
      linearity: 1,
      mimes: ['video/mp4'],
      playbackmethod: [2],
      w: 300,
      h: 250,
      placement: 2,
      protocols: [2],
    },
  });

  return {
    ...bidRequest,
    imp: [impObject],
  };
};

export const makeCoreDataForNativeAds = ({
  containerId,
  inventoryId,
  publisherId,
  headerBids = [],
}) => {
  const bidRequest = getBidRequestObj();
  const impObject = getImpDefinedObj({
    type: 'native',
    aic_ads: {
      header_bids: headerBids,
      container_id: containerId,
      inventory_id: inventoryId,
    },
    data: {
      request: `{"plcmttype":1,"plcmtcnt":1,"context":2,"assets":[{"required":1,"img":{"wmin":20,"hmin":20,"type":1}}],"contextsubtype":20}`,
      ver: '1.2',
    },
  });

  return {
    ...bidRequest,
    imp: [impObject],
  };
};
