import { v4 as uuid } from 'uuid';

const IMP_DEFINED = {
  /**
   * type: string,
   * A unique identifier for this impression within the context of
   * the bid request (typically, starts with 1 and increments
   */
  id: uuid(),
  /**
   * type: array of objec,
   * An array of Metric object (Section 3.2.5).
   */
  metric: [],
  /**
   * type: object,
   * A Banner object (Section 3.2.6); required if this impression is
   * offered as a banner ad opportunity.
   */
  banner: {},
  /**
   * type: object,
   * A Video object (Section 3.2.7); required if this impression is
   * offered as a video ad opportunity
   */
  video: {},
  /**
   * type: object,
   * An Audio object (Section 3.2.8); required if this impression is
   * offered as an audio ad opportunity.
   */
  audio: {},
  /**
   * type: object,
   * A Native object (Section 3.2.9); required if this impression is
   * offered as a native ad opportunity
   */
  native: {},
  /**
   * type: object,
   * A Pmp object (Section 3.2.11) containing any private
   * marketplace deals in effect for this impression
   */
  pmp: {},
  /**
   * type: string,
   * Name of ad mediation partner, SDK technology, or player
   * responsible for rendering ad (typically video or mobile). Used
   * by some ad servers to customize ad code by partner.
   * Recommended for video and/or apps.
   */
  displaymanager: '',
  /**
   * type: string,
   * Version of ad mediation partner, SDK technology, or player
   * responsible for rendering ad (typically video or mobile). Used
   * by some ad servers to customize ad code by partner.
   * Recommended for video and/or apps.
   */
  displaymanagerver: '',
  /**
   * type: integer,
   * 1 = the ad is interstitial or full screen, 0 = not interstitial.
   */
  instl: 0,
  /**
   * type: string,
   * Identifier for specific ad placement or ad tag that was used to
   * initiate the auction. This can be useful for debugging of any
   * issues, or for optimization by the buyer
   */
  tagid: '',
  /**
   * type: float,
   * Minimum bid for this impression expressed in CPM
   */
  bidfloor: 0,
  /**
   * type: string,
   * Currency specified using ISO-4217 alpha codes. This may be
   * different from bid currency returned by bidder if this is
   * allowed by the exchange.
   */
  bidfloorcur: 'USD',
  /**
   * type: integer,
   * Indicates the type of browser opened upon clicking the
   * creative in an app, where 0 = embedded, 1 = native. Note that
   * the Safari View Controller in iOS 9.x devices is considered a
   * native browser for purposes of this attribute
   */
  clickbrowser: 0,
  /**
   * type: integer,
   * Flag to indicate if the impression requires secure HTTPS URL
   * creative assets and markup, where 0 = non-secure, 1 = secure.
   * If omitted, the secure state is unknown, but non-secure HTTP
   * support can be assumed
   */
  secure: 1,
  /**
   * type: array of string,
   * Array of exchange-specific names of supported iframe busters
   */
  iframebuster: [],
  /**
   * type: integer,
   * Advisory as to the number of seconds that may elapse
   * between the auction and the actual impression.
   */
  exp: 0,
  /**
   * type: object,
   * Placeholder for exchange-specific extensions to OpenRTB
   */
  ext: {
    prebid: {},
    aic_ads: {
      header_bids: [],
      container_id: '',
      inventory_id: '',
    },
  },
};

/**
 * type = banner | video | native
 */
export const getImpDefinedObj = ({ type = 'banner', aic_ads, data }) => {
  const { id, secure, ext } = IMP_DEFINED;

  let result = {
    id,
    secure,
    ext: {
      ...ext,
      aic_ads: aic_ads || ext.aic_ads,
    },
  };

  switch (type) {
    case 'video':
      result.video = data;
      break;
    case 'native':
      result.native = data;
      break;

    default:
      result.banner = data;
      break;
  }

  return result;
};
