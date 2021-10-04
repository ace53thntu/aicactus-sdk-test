export const CORE_DATA = {
  user: {
    gender: 'O',
  },
  device: {
    ua:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 14_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148',
    ifa: '00000000-0000-0000-0000-000000000000',
    osv: '14.2',
  },
  id: '431243214321',
  container_id: '66ce201f-f265-4a60-b389-691ae988b32e',
  inventory_id: '19d78a5e-0f77-423d-9b4e-51e3572e243e',
  imp: [
    {
      ext: {
        prebid: {},
      },
      banner: {
        api: [5],
        format: [
          {
            w: 300,
            h: 250,
          },
        ],
      },
      id: '19AF7FAE-D937-42C8-9CED-8582679CB24E',
      secure: 1,
    },
  ],

  app: {
    bundle: 'org.prebid.PrebidDemoSwift',
    ver: '1.10',
    publisher: {
      id: '1001',
    },
    ext: {
      prebid: {
        source: 'prebid-mobile',
        version: '1.10',
      },
    },
  },
  at: 2,
  tmax: 10000,
};

export const BID_REQUEST_DATA = {
  at: 1,
  user: {
    gender: 'O',
  },
  source: {
    tid: '82E8D65D-95B3-4513-8EC8-72B5BD6E1C90',
  },
  device: {
    w: 375,
    lmt: 0,
    devtime: 1615741060,
    model: 'Simulator',
    ext: {
      atts: 3,
    },
    make: 'Apple',
    connectiontype: 1,
    h: 667,
    os: 'iOS',
    pxratio: 2,
    ua:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 14_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148',
    ifa: '00000000-0000-0000-0000-000000000000',
    osv: '14.2',
  },
  id: '984CB797-AF04-4350-88B4-76B98030F8A3',
  imp: [
    {
      ext: {
        prebid: {
          storedauctionresponse: {
            id: '1001-rubicon-300x250',
          },
          storedrequest: {
            id: '1001-1',
          },
        },
      },
      banner: {
        api: [5],
        format: [
          {
            w: 300,
            h: 250,
          },
        ],
      },
      id: '19AF7FAE-D937-42C8-9CED-8582679CB24E',
      secure: 1,
    },
  ],
  ext: {
    prebid: {
      storedrequest: {
        id: '1001',
      },
      targeting: {},
      cache: {
        bids: {},
      },
    },
  },
  app: {
    bundle: 'org.prebid.PrebidDemoSwift',
    ver: '1.10',
    publisher: {
      id: '1001',
    },
    ext: {
      prebid: {
        source: 'prebid-mobile',
        version: '1.10',
      },
    },
  },
};
