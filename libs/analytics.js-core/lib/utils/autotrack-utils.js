export const noTrackClassName = 'aicactus-sdk-no-track';
export const includeTrackClassName = 'aicactus-sdk-include';

/**
 * Get the className of an element, accounting for edge cases where element.className is an object
 * @param {Element} el - element to get the className of
 * @returns {string} the element's class
 */
export function getClassName(el) {
  switch (typeof el.className) {
    case 'string':
      return el.className;
    case 'object': // handle cases where className might be SVGAnimatedString or some other type
      return el.className.baseVal || el.getAttribute('class') || '';
    default:
      // future proof
      return '';
  }
}

/**
 * Check whether an element has nodeType Node.ELEMENT_NODE
 * @param {Element} el - element to check
 * @returns {boolean} whether el is of the correct nodeType
 */
export function isElementNode(el) {
  return el && el.nodeType === 1; // Node.ELEMENT_NODE - use integer constant for browser portability
}

/**
 * Check whether an element is of a given tag type.
 * Due to potential reference discrepancies (such as the webcomponents.js polyfill),
 * we want to match tagNames instead of specific references because something like
 * element === document.body won't always work because element might not be a native
 * element.
 * @param {Element} el - element to check
 * @param {string} tag - tag name (e.g., "div")
 * @returns {boolean} whether el is of the given tag type
 */
export function isTag(el, tag) {
  return el && el.tagName && el.tagName.toLowerCase() === tag.toLowerCase();
}

/**
 * Check whether an element has nodeType Node.TEXT_NODE
 * @param {Element} el - element to check
 * @returns {boolean} whether el is of the correct nodeType
 */
export function isTextNode(el) {
  return el && el.nodeType === 3; // Node.TEXT_NODE - use integer constant for browser portability
}

/**
 * Check whether a DOM event should be "tracked" or if it may contain sentitive data
 * using a variety of heuristics.
 * @param {Element} el - element to check
 * @param {Event} event - event to check
 * @returns {boolean} whether the event should be tracked
 */
export function shouldTrackDomEvent(el, event) {
  if (!el || isTag(el, 'html') || !isElementNode(el)) {
    return false;
  }
  var tag = el.tagName.toLowerCase();
  switch (tag) {
    case 'html':
      return false;
    case 'form':
      return event.type === 'submit';
    case 'input':
      if (['button', 'submit'].indexOf(el.getAttribute('type')) === -1) {
        return event.type === 'change';
      } else {
        return event.type === 'click';
      }
    case 'select':
    case 'textarea':
      return event.type === 'change';
    default:
      return event.type === 'click';
  }
}

/**
 * Check whether a DOM element should be "tracked" or if it may contain sentitive data
 * using a variety of heuristics.
 * excerpt from https://github.com/mixpanel/mixpanel-js/blob/master/src/autotrack-utils.js
 * @param {Element} el - element to check
 * @returns {boolean} whether the element should be tracked
 */
export function shouldTrackElement(el) {
  if (!el.parentNode || isTag(el, 'body')) return false;

  let curEl = el;
  while (curEl.parentNode && !isTag(curEl, 'body')) {
    let classes = getClassName(el).split(' ');

    // if explicitly specified "aicactus-sdk-no-track", even at parent level, dont track the child nodes too.
    if (classes.indexOf(noTrackClassName) >= 0) {
      return false;
    }
    curEl = curEl.parentNode;

    // if explicitly set "aicactus-sdk-include", at element level, then track the element even if the element is hidden or sensitive.
    let classes = getClassName(el).split(' ');
    if (classes.indexOf(includeTrackClassName) >= 0) {
      return true;
    }

    // for general elements, do not track input/select/textarea(s)
    // if (
    //   isTag(el, 'input') ||
    //   isTag(el, 'select') ||
    //   isTag(el, 'textarea') ||
    //   el.getAttribute('contenteditable') === 'true'
    // ) {
    //   return false;
    // } else if (el.getAttribute('contenteditable') === 'inherit') {
    //   for (
    //     curEl = el.parentNode;
    //     curEl.parentNode && !isTag(curEl, 'body');
    //     curEl = curEl.parentNode
    //   ) {
    //     if (curEl.getAttribute('contenteditable') === 'true') {
    //       return false;
    //     }
    //   }
    // }

    // do not track hidden/password elements
    let type = el.type || '';
    if (typeof type === 'string') {
      // it's possible for el.type to be a DOM element if el is a form with a child input[name="type"]
      switch (type.toLowerCase()) {
        case 'hidden':
          return false;
        case 'password':
          return false;
      }
    }

    // filter out data from fields that look like sensitive field -
    // safeguard - match with regex with possible strings as id or name of an element for creditcard, password, ssn, pan, adhar
    let name = el.name || el.id || '';
    if (typeof name === 'string') {
      // it's possible for el.name or el.id to be a DOM element if el is a form with a child input[name="name"]
      let sensitiveNameRegex = /^adhar|cc|cardnum|ccnum|creditcard|csc|cvc|cvv|exp|pan|pass|pwd|routing|seccode|securitycode|securitynum|socialsec|socsec|ssn/i;
      if (sensitiveNameRegex.test(name.replace(/[^a-zA-Z0-9]/g, ''))) {
        return false;
      }
    }
  }
  return true;
}

// excerpt from https://github.com/mixpanel/mixpanel-js/blob/master/src/autotrack-utils.js
export function isValueToBeTracked(value) {
  if (value === null || value === undefined) {
    return false;
  }

  if (typeof value === 'string') {
    value = value.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, '');

    // check to see if input value looks like a credit card number
    // see: https://www.safaribooksonline.com/library/view/regular-expressions-cookbook/9781449327453/ch04s20.html
    const ccRegex = /^(?:(4[0-9]{12}(?:[0-9]{3})?)|(5[1-5][0-9]{14})|(6(?:011|5[0-9]{2})[0-9]{12})|(3[47][0-9]{13})|(3(?:0[0-5]|[68][0-9])[0-9]{11})|((?:2131|1800|35[0-9]{3})[0-9]{11}))$/;
    if (ccRegex.test((value || '').replace(/[- ]/g, ''))) {
      return false;
    }

    // check to see if input value looks like a social security number
    const ssnRegex = /(^\d{3}-?\d{2}-?\d{4}$)/;
    if (ssnRegex.test(value)) {
      return false;
    }

    // check to see if input value looks like a adhar number
    const adharRegex = /(^\d{4}-?\d{4}-?\d{4}$)/;
    if (adharRegex.test(value)) {
      return false;
    }

    // check to see if input value looks like a PAN number
    const panRegex = /(^\w{5}-?\d{4}-?\w{1}$)/;
    if (panRegex.test(value)) {
      return false;
    }
  }

  return true;
}

export function getText(el) {
  let text = '';
  el.childNodes.forEach(function (value) {
    if (value.nodeType === Node.TEXT_NODE) {
      let textContent = value.nodeValue.replace(
        /^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g,
        ''
      );

      // take each word from the text content and check whether the value should be tracked. Also, replace the whitespaces.
      let textValue = textContent
        .split(/(\s+)/)
        .filter(isValueToBeTracked)
        .join('')
        .replace(/[\r\n]/g, ' ');
      text += textValue;
    }
  });
  return text.trim();
}

export function getPropertiesFromElement(elem) {
  const props = {
    classes: getClassName(elem).split(' '),
    tag_name: elem.tagName.toLowerCase(),
  };

  const attrLength = elem?.attributes?.length ?? 0;
  for (let i = 0; i < attrLength; i++) {
    const { name } = elem?.attributes?.[i] ?? {};
    const { value } = elem?.attributes?.[i] ?? {};

    if (name && value && isValueToBeTracked(value)) {
      props[`attr__${name}`] = value;
    }
    if (name && value && (name == 'name' || name == 'id')) {
      props.field_value =
        name == 'id'
          ? document.getElementById(value).value
          : document.getElementsByName(value)[0].value;

      if (elem?.type === 'checkbox' || elem?.type === 'radio') {
        props.field_value = elem.checked;
      }
    }
  }

  let nthChild = 1;
  let nthOfType = 1;
  let currentElem = elem;
  while ((currentElem = previousElementSibling(currentElem))) {
    nthChild++;
    if (currentElem.tagName === elem.tagName) {
      nthOfType++;
    }
  }
  props.nth_child = nthChild;
  props.nth_of_type = nthOfType;

  return props;
}

export function previousElementSibling(el) {
  if (el.previousElementSibling) {
    return el.previousElementSibling;
  }
  do {
    el = el.previousSibling;
  } while (el && !isElementNode(el));
  return el;
}
