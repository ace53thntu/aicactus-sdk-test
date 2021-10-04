import * as miscUtils from './utils/misc';

import { EVENT_TYPES_VALUE, TYPES_VAL } from './constants';
import {
  getClassName,
  getPropertiesFromElement,
  getText,
  includeTrackClassName,
  isElementNode,
  isTag,
  isTextNode,
  isValueToBeTracked,
  noTrackClassName,
  shouldTrackDomEvent,
  shouldTrackElement,
} from './utils/autotrack-utils';

import { getElementByXpath } from './utils/dom';

function addDomEventHandlers({ sdk, container, trackEvents = [] }) {
  const handler = (e) => {
    e = e || window.event;
    let target = e.target || e.srcElement;

    if (isTextNode(target)) {
      target = target.parentNode;
    }
    if (shouldTrackDomEvent(target, e)) {
      console.log('to be tracked ', e.type);
    } else {
      console.log('not to be tracked ', e.type);
    }

    trackWindowEvent(e, sdk, container, trackEvents);
  };

  registerEvent(document, 'submit', handler, true);
  registerEvent(document, 'change', handler, true);
  registerEvent(document, 'click', handler, true);
}

function registerEvent(element, type, handler, useCapture) {
  if (!element) {
    console.log(
      '[Autotrack] register_event:: No valid element provided to registerEvent'
    );
    return;
  }

  element.addEventListener(type, handler, !!useCapture);
}

function isExplicitNoTrack(el) {
  const classes = getClassName(el).split(' ');
  if (classes.indexOf(noTrackClassName) >= 0) {
    return true;
  }
  return false;
}

function trackWindowEvent(e, sdk, container, trackEvents = []) {
  let target = e.target || e.srcElement;
  let formValues;
  if (isTextNode(target)) {
    target = target.parentNode;
  }

  if (shouldTrackDomEvent(target, e)) {
    if (target.tagName.toLowerCase() == 'form') {
      formValues = {};
      for (let i = 0; i < target.elements.length; i++) {
        const formElement = target.elements[i];
        if (
          shouldTrackElement(formElement) &&
          isValueToBeTrackedFromTrackingList(formElement)
        ) {
          const name = formElement.id ? formElement.id : formElement.name;
          if (name && typeof name === 'string') {
            const key = formElement.id ? formElement.id : formElement.name;
            // formElement.value gives the same thing
            let value = formElement.id
              ? document.getElementById(formElement.id).value
              : document.getElementsByName(formElement.name)[0].value;
            if (
              formElement.type === 'checkbox' ||
              formElement.type === 'radio'
            ) {
              value = formElement.checked;
            }
            if (key.trim() !== '') {
              formValues[encodeURIComponent(key)] = encodeURIComponent(value);
            }
          }
        }
      }
    }

    const targetElementList = [];

    let curEl = target;

    if (isExplicitNoTrack(curEl)) {
      return false;
    }

    while (curEl.parentNode && !isTag(curEl, 'body')) {
      if (shouldTrackElement(curEl)) {
        targetElementList.push(curEl);
      }
      curEl = curEl.parentNode;
    }

    const elementsJson = [];
    let href;

    targetElementList.forEach((el) => {
      // if the element or a parent element is an anchor tag
      // include the href as a property
      if (el.tagName.toLowerCase() === 'a') {
        href = el.getAttribute('href');
        href = isValueToBeTracked(href) && href;
      }
      elementsJson.push(getPropertiesFromElement(el));
    });

    if (targetElementList && targetElementList.length == 0) {
      return false;
    }

    let elementText = '';
    const text = getText(target);
    if (text && text.length) {
      elementText = text;
    }

    const props = {
      eventType: e.type,
      elements: elementsJson,
      elAttrHref: href,
      elText: elementText,
    };

    if (shouldTrackElement(target)) {
      props.elValue = target.value;
    }

    if (formValues) {
      props.formValues = formValues;
    }

    trackEvents.forEach(function (trackEvt) {
      if (trackEvt?.params && Object.keys(trackEvt.params).length) {
        let node = null;
        const { params } = trackEvt;
        const {
          elementType,
          element,
          properties = [],
          event: eventName,
        } = params;

        if (elementType === TYPES_VAL.xpath && element) {
          node = getElementByXpath(element);
        }

        if (elementType === TYPES_VAL.element && element) {
          node = document.querySelector(element);
        }

        if (
          node === target ||
          (miscUtils.isElement(node) &&
            (node.contains(target) || target.contains(node)))
        ) {
          let eventProps = {};
          if (properties?.length) {
            properties.forEach((item) => {
              if (!item.type) {
                eventProps[item.name] = item.possibleValues;
              }
            });
          }
          sdk.track(eventName, eventProps);
        }
      }
    });

    return true;
  }
}

export { addDomEventHandlers };
