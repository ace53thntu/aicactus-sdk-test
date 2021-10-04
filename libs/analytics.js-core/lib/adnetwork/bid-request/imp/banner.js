import { v4 as uuid } from 'uuid';

const BANNER_DEFINED = {
  /**
   * type: array of object,
   * Array of format objects (Section 3.2.10) representing the
   * banner sizes permitted. If none are specified, then use of the
   * h and w attributes is highly recommended.
   */
  format: [],
  /**
   * type: integer,
   * Exact width in device independent pixels (DIPS);
   * recommended if no format objects are specified
   */
  w: 0,
  /**
   * type: integer,
   * Exact height in device independent pixels (DIPS);
   * recommended if no format objects are specified.
   */
  h: 0,
  /**
   * type: array of integer,
   * Blocked banner ad types. Refer to List 5.2
   */
  btype: [],
  /**
   * type: array of integer,
   * Blocked creative attributes. Refer to List 5.3
   */
  battr: [],
  /**
   * type: integer,
   * Ad position on screen. Refer to List 5.4.
   */
  pos: 0,
  /**
   * type: array of string,
   * Content MIME types supported. Popular MIME types may
   * include “application/x-shockwave-flash”,
   * “image/jpg”, and “image/gif”.
   */
  mimes: [],
  /**
   * type: integer,
   * Indicates if the banner is in the top frame as opposed to an
   * iframe, where 0 = no, 1 = yes
   */
  topframe: 0,
  /**
   * type: array of integer,
   * Directions in which the banner may expand. Refer to List 5.5.
   */
  expdir: [],
  /**
   * type: array of integer,
   * List of supported API frameworks for this impression. Refer to
   * List 5.6. If an API is not explicitly listed, it is assumed not to be
   * supported
   */
  api: [],
  /**
   * type: string,
   * Unique identifier for this banner object. Recommended when
   * Banner objects are used with a Video object (Section 3.2.7) to
   * represent an array of companion ads. Values usually start at 1
   * and increase with each object; should be unique within an
   * impression.
   */
  id: uuid(),
  /**
   * type: integer,
   * Relevant only for Banner objects used with a Video object
   * (Section 3.2.7) in an array of companion ads. Indicates the
   * companion banner rendering mode relative to the associated
   * video, where 0 = concurrent, 1 = end-card
   */
  vcm: 0,
  /**
   * type: object,
   * Placeholder for exchange-specific extensions to OpenRTB
   */
  ext: {},
};

const BANNER_FORMAT_DEFINED = {
  /**
   * type: integer,
   * Width in device independent pixels (DIPS)
   */
  w: 0,
  /**
   * type: integer,
   * Height in device independent pixels (DIPS).
   */
  h: 0,
  /**
   * type: integer,
   * Relative width when expressing size as a ratio
   */
  wratio: 0,
  /**
   * type: integer,
   * Relative height when expressing size as a ratio.
   */
  hratio: 0,
  /**
   * type: integer,
   * The minimum width in device independent pixels (DIPS) at
   * which the ad will be displayed the size is expressed as a ratio
   */
  wmin: 0,
  /**
   * type: object,
   * Placeholder for exchange-specific extensions to OpenRTB
   */
  ext: {},
};
