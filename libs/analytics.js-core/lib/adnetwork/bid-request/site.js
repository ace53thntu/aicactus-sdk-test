export const SITE_DEFINED = {
  /**
   * type: string,
   * Exchange-specific site ID
   */
  id: '',
  /**
   * type: string,
   * Site name (may be aliased at the publisher’s request).
   */
  name: '',
  /**
   * type: string,
   * Domain of the site (e.g., “mysite.foo.com”).
   */
  domain: '',
  /**
   * type: array of string,
   * Array of IAB content categories of the site. Refer to List 5.1
   */
  cat: [],
  /**
   * type: array of string,
   * Array of IAB content categories that describe the current
   * section of the site. Refer to List 5.1.
   */
  sectioncat: [],
  /**
   * type: array of string,
   * Array of IAB content categories that describe the current page
   * or view of the site. Refer to List 5.1.
   */
  pagecat: [],
  /**
   * type: string,
   * URL of the page where the impression will be shown
   */
  page: `${window.location.origin}${window.location.pathname}`,
  /**
   * type: string,
   * Referrer URL that caused navigation to the current page
   */
  ref: document.referrer,
  /**
   * type: string,
   * Search string that caused navigation to the current page
   */
  search: window.location.search,
  /**
   * type: integer,
   * Indicates if the site has been programmed to optimize layout
   * when viewed on mobile devices, where 0 = no, 1 = yes.
   */
  mobile: 0,
  /**
   * type: integer,
   * Indicates if the site has a privacy policy, where 0 = no, 1 = yes.
   */
  privacypolicy: 0,
  /**
   * type: object,
   * Details about the Publisher (Section 3.2.15) of the site
   */
  publisher: {
    /**
     * type: string,
     * Exchange-specific publisher ID
     */
    id: '',
    /**
     * type: string,
     * Publisher name (may be aliased at the publisher’s request)
     */
    name: '',
    /**
     * type: array of string,
     * Array of IAB content categories that describe the publisher.
     * Refer to List 5.1.
     */
    cat: [],
    /**
     * type: string,
     * Highest level domain of the publisher (e.g., “publisher.com”).
     */
    domain: '',
    /**
     * type: object,
     * Placeholder for exchange-specific extensions to OpenRTB
     */
    ext: {},
  },
  /**
   * type: object,
   * Details about the Content (Section 3.2.16) within the site.
   */
  content: {
    id: '',
    episode: 0,
    title: '',
    series: '',
    season: '',
    artist: '',
    genre: '',
    album: '',
    isrc: '',
    producer: {},
    url: '',
    cat: [],
    prodq: 0,
    context: 0,
    contentrating: '',
    userrating: '',
    qagmediarating: 0,
    keywords: '',
    livestream: 0,
    sourcerelationship: 0,
    len: 0,
    language: '',
    embeddable: 0,
    data: {},
    ext: {},
  },
  /**
   * type: string,
   * Comma separated list of keywords about the site
   */
  keywords: '',
  /**
   * type: object,
   * Placeholder for exchange-specific extensions to OpenRTB
   */
  ext: {},
};

export const getSiteDefinedObj = () => {
  const { page, ref, search } = SITE_DEFINED;

  return {
    page,
    ref,
    search,
  };
};
