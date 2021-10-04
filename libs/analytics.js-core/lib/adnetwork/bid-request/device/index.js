const DEVICE_DEFINED = {
  /**
   * type: string,
   * Browser user agent string.
   */
  ua: navigator.userAgent,
  /**
   * type: object,
   * Location of the device assumed to be the user’s current
   * location defined by a Geo object (Section 3.2.19)
   */
  geo: {},
  /**
   * type: integer
   * Standard “Do Not Track” flag as set in the header by the
   * browser, where 0 = tracking is unrestricted, 1 = do not track
   */
  dnt: 0,
  /**
   * type: integer
   * “Limit Ad Tracking” signal commercially endorsed (e.g., iOS,
   * Android), where 0 = tracking is unrestricted, 1 = tracking must
   * be limited per commercial guidelines
   */
  lmt: 0,
  /**
   * type: string,
   * IPv4 address closest to device
   */
  ip: '',
  /**
   * type: string,
   * IP address closest to device as IPv6.
   */
  ipv6: '',
  /**
   * type: integer,
   * The general type of device. Refer to List 5.21
   */
  devicetype: 0,
  /**
   * type: string,
   * Device make (e.g., “Apple”).
   */
  make: '',
  /**
   * type: string,
   * Device model (e.g., “iPhone”)
   */
  model: '',
  /**
   * type: string,
   * Device operating system (e.g., “iOS”)
   */
  os: '',
  /**
   * type: string,
   * Device operating system version (e.g., “3.1.2”).
   */
  osv: '',
  /**
   * type: string,
   * Hardware version of the device (e.g., “5S” for iPhone 5S).
   */
  hwv: '',
  /**
   * type: integer,
   * Physical height of the screen in pixels
   */
  h: 0,
  /**
   * type: integer,
   * Physical width of the screen in pixels
   */
  w: 0,
  /**
   * type: integer,
   * Screen size as pixels per linear inch
   */
  ppi: 0,
  /**
   * type: float,
   * The ratio of physical pixels to device independent pixels.
   */
  pxratio: 0.0,
  /**
   * type: integer,
   * Support for JavaScript, where 0 = no, 1 = yes
   */
  js: 1,
  /**
   * type: integer,
   * Indicates if the geolocation API will be available to JavaScript
   * code running in the banner, where 0 = no, 1 = yes.
   */
  geofetch: 1,
  /**
   * type: string,
   * Version of Flash supported by the browser.
   */
  flashver: '',
  /**
   * type: string,
   * Browser language using ISO-639-1-alpha-2.
   */
  language: navigator.language,
  /**
   * type: string,
   * Carrier or ISP (e.g., “VERIZON”) using exchange curated string
   * names which should be published to bidders a priori
   */
  carrier: '',
  /**
   * type: string,
   * Mobile carrier as the concatenated MCC-MNC code (e.g.,
   * “310-005” identifies Verizon Wireless CDMA in the USA).
   * Refer to https://en.wikipedia.org/wiki/Mobile_country_code
   * for further examples. Note that the dash between the MCC
   * and MNC parts is required to remove parsing ambiguity
   */
  mccmnc: '',
  /**
   * type: integer,
   * Network connection type. Refer to List 5.22
   */
  connectiontype: 0,
  /**
   * type: string,
   * ID sanctioned for advertiser use in the clear (i.e., not hashed)
   */
  ifa: '',
  /**
   * type: string,
   * Hardware device ID (e.g., IMEI); hashed via SHA1
   */
  didsha1: '',
  /**
   * type: string,
   * Hardware device ID (e.g., IMEI); hashed via MD5
   */
  didmd5: '',
  /**
   * type: string,
   * Platform device ID (e.g., Android ID); hashed via SHA1
   */
  dpidsha1: '',
  /**
   * type: string,
   * Platform device ID (e.g., Android ID); hashed via MD5
   */
  dpidmd5: '',
  /**
   * type: string,
   * MAC address of the device; hashed via SHA1
   */
  macsha1: '',
  /**
   * type: string,
   * MAC address of the device; hashed via MD5
   */
  macmd5: '',
  /**
   * type: object,
   * Placeholder for exchange-specific extensions to OpenRTB
   */
  ext: {},
};

export const getDeviceObj = () => {
  let result = {};

  const { ua, language } = DEVICE_DEFINED;

  result = {
    ua,
    language,
  };

  return result;
};
