/**
 * Helper to check if an element is visible
 */
const isVisible = (elem) => {
  return !!(elem.offsetWidth || elem.offsetHeight || elem.getClientRects().length);
};

/**
 * Helper to find elements matching a selector, optionally filtering by visibility
 */
const findVisibleElements = (root, selector) => {
  const rootNode = typeof root === 'string' ? document.querySelector(root) : root;
  if (!rootNode) return [];
  
  const isVisibleRequired = selector.includes(':visible');
  const cleanSelector = selector.split(',')
    .map(s => s.trim().replace(/:visible/g, ''))
    .join(', ');
  
  const elements = Array.from((rootNode || document).querySelectorAll(cleanSelector));
  return isVisibleRequired ? elements.filter(isVisible) : elements;
};

/**
 * Helper to find the nearest scrollable parent
 */
const getScrollParent = (node) => {
  if (!node) return document;
  const position = window.getComputedStyle(node).position;
  const excludeStaticParent = position === 'absolute';
  
  if (position === 'fixed') return node.ownerDocument || document;

  let parent = node.parentElement;
  while (parent) {
    const style = window.getComputedStyle(parent);
    if (excludeStaticParent && style.position === 'static') {
      parent = parent.parentElement;
      continue;
    }
    if (/(auto|scroll|overlay)/.test(style.overflow + style.overflowY + style.overflowX)) {
      return parent;
    }
    parent = parent.parentElement;
  }
  return node.ownerDocument || document;
};

/**
 * Helper to calculate the distance between an element and its ancestor
 */
const getDistance = (element, target) => {
  let distance = 0;
  let curr = element.parentNode;
  const targetNode = typeof target === 'string' ? document.querySelector(target) : target;
  while (curr && curr !== targetNode && curr !== document) {
    distance++;
    curr = curr.parentNode;
  }
  return curr === targetNode ? distance : Infinity;
};

/**
 * Helper to find sticky elements in the same scroll context
 */
const findSameScrollParentElements = (root, selector, scrollParent) => {
  return findVisibleElements(root, selector).filter((el) => getScrollParent(el) === scrollParent);
};

/**
 * Automatically stacks sticky elements (call after all elements are rendered).
 * Scroll containers take priority: once a scroll container is encountered, stacking starts from 0.
 * Paged containers (root/tab): continue from the scroll-container stack; within the same paged container,
 * stacking = scroll-container stack + same-page stack.
 * @param {String} [type='top'] CSS sticky alignment property: top/bottom/left/right
 * @param {String|Element} [root=document] Root node where calculation starts
 * @param {String|Element} [selector='.position-sticky:visible, .sticky-top:visible'] Selector for sticky targets
 */
const stackSticky = (type = 'top', root = document, selector = '.position-sticky:visible, .sticky-top:visible') => {
  const offset = 0;
  const rootNode = typeof root === 'string' ? document.querySelector(root) : root;
  if (!rootNode) return;

  const stickyElements = findVisibleElements(rootNode, selector).filter((element) => {
    return window.getComputedStyle(element)[type] === 'auto';
  });

  stickyElements.forEach((element) => {
    const scrollParent = getScrollParent(element);
    let sameLevelStickyElements, index, lastElement;

    if (getDistance(element, rootNode) >= getDistance(element, scrollParent)) {
      // If the scroll parent is closer, the first sticky starts stacking from 0.
      sameLevelStickyElements = findSameScrollParentElements(scrollParent, selector, scrollParent);
      index = sameLevelStickyElements.indexOf(element);
      
      if (index === 0) {
        element.style[type] = '0px';
        return;
      }
      
      lastElement = sameLevelStickyElements[index - 1];
      if (sameLevelStickyElements.length - 1 === index) {
        element.setAttribute('scroll-last-sticky', 'true');
      }
    } else {
      // If the paged parent is closer, find the last sticky before this page under the same scroll parent.
      sameLevelStickyElements = findSameScrollParentElements(rootNode, selector, scrollParent);
      index = sameLevelStickyElements.indexOf(element);
      
      if (index === 0) {
        const lastStickyCandidates = Array.from((scrollParent || document).querySelectorAll('[scroll-last-sticky]'));
        const filtered = lastStickyCandidates.filter(el => getScrollParent(el) === scrollParent);
        lastElement = filtered[0];
      } else {
        lastElement = sameLevelStickyElements[index - 1];
      }
    }

    if (lastElement) {
      const lastElementStyle = window.getComputedStyle(lastElement);
      const lastTypeVal = parseInt(lastElementStyle[type], 10) || 0;
      element.style[type] = `${lastTypeVal + lastElement.offsetHeight + offset}px`;
    }
  });
};
