import { CustomStyle } from './custom-style';


export function loadLinkStyles(doc: Document, customStyle: CustomStyle, linkElm: HTMLLinkElement) {
  const url = linkElm.href;

  return fetch(url).then(rsp => rsp.text()).then(text => {

    if (hasCssVariables(text)) {
      const styleElm = doc.createElement('style');
      if (hasRelativeUrls(text)) {
        text = fixRelativeUrls(text, url);
      }
      styleElm.innerHTML = text;
      linkElm.parentNode.insertBefore(styleElm, linkElm);

      return customStyle.addStyle(styleElm).then(() => {
        linkElm.parentNode.removeChild(linkElm);
      });
    }

    return Promise.resolve();

  }).catch(err => {
    console.error(err);
  });
}

// This regexp tries to determine when a variable is declared, for example:
//
// .my-el { --highlight-color: green; }
//
// but we don't want to trigger when a classname uses "--" or a pseudo-class is
// used. We assume that the only characters that can preceed a variable
// declaration are "{", from an opening block, ";" from a preceeding rule, or a
// space. This prevents the regexp from matching a word in a selector, since
// they would need to start with a "." or "#". (We assume element names don't
// start with "--").
const CSS_VARIABLE_REGEXP = /[\s;{]--[-a-zA-Z0-9]+\s*:/m;

export function hasCssVariables(css: string) {
  return css.indexOf('var(') > -1 || CSS_VARIABLE_REGEXP.test(css);
}

// This regexp find all url() usages with relative urls
const CSS_URL_REGEXP = /url[\s]*\([\s]*['"]?(?!http)([^\'\"\)]*)[\s]*['"]?\)[\s]*/gim;

export function hasRelativeUrls(css: string) {
  return CSS_URL_REGEXP.test(css);
}


export function fixRelativeUrls(css: string, originalUrl: string) {
  // get the basepath from the original import url
  const basePath = originalUrl.replace(/[^/]*$/, '');

  // replace the relative url, with the new relative url
  return css.replace(CSS_URL_REGEXP, (fullMatch, url) => {
    // rhe new relative path is the base path + uri
    // TODO: normalize relative URL
    const relativeUrl = basePath + url;
    return fullMatch.replace(url, relativeUrl);
  });
}
