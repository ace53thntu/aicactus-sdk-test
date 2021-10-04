export const isURL = (str) => {
  try {
    const isURL = new URL(str);
    return true;
  } catch (error) {
    return false;
  }
};

export const matchPage = (url) => {
  const currentURL = window.location.href;

  if (isURL(url)) {
    const parsedPageURL = new URL(url);
    const parsedCurrentURL = new URL(currentURL);
    if (parsedPageURL.pathname !== parsedCurrentURL.pathname) {
      return false;
    }
    return true;
  }
  return false;
};
