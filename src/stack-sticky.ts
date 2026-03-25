export type StickyDirection = 'top' | 'bottom' | 'left' | 'right'
export type RootTarget = string | ParentNode

const DEFAULT_SELECTOR = '.position-sticky:visible, .sticky-top:visible'
const VISIBLE_PSEUDO_REGEX = /:visible/g
const SCROLLABLE_OVERFLOW_REGEX = /auto|scroll|overlay/

function isVisible(elem: Element): boolean {
  if (!(elem instanceof HTMLElement || elem instanceof SVGElement)) {
    return false
  }

  return Boolean(elem.getClientRects().length)
}

function findVisibleElements(root: RootTarget, selector: string): HTMLElement[] {
  const rootNode = typeof root === 'string' ? document.querySelector(root) : root

  if (!rootNode) {
    return []
  }

  const isVisibleRequired = selector.includes(':visible')
  const cleanSelector = selector
    .split(',')
    .map(s => s.trim().replace(VISIBLE_PSEUDO_REGEX, ''))
    .join(', ')

  const elements = Array.from(rootNode.querySelectorAll(cleanSelector)).filter(
    (el): el is HTMLElement => el instanceof HTMLElement,
  )

  return isVisibleRequired ? elements.filter(isVisible) : elements
}

function getScrollParent(node: HTMLElement | null): Element | Document {
  if (!node) {
    return document
  }

  const position = window.getComputedStyle(node).position
  const excludeStaticParent = position === 'absolute'

  if (position === 'fixed') {
    return node.ownerDocument || document
  }

  let parent = node.parentElement

  while (parent) {
    const style = window.getComputedStyle(parent)

    if (excludeStaticParent && style.position === 'static') {
      parent = parent.parentElement
      continue
    }

    if (SCROLLABLE_OVERFLOW_REGEX.test(style.overflow + style.overflowY + style.overflowX)) {
      return parent
    }

    parent = parent.parentElement
  }

  return node.ownerDocument || document
}

function getDistance(element: HTMLElement, target: RootTarget): number {
  let distance = 0
  let curr: Node | null = element.parentNode
  const targetNode = typeof target === 'string' ? document.querySelector(target) : target

  while (curr && curr !== targetNode && curr !== document) {
    distance += 1
    curr = curr.parentNode
  }

  return curr === targetNode ? distance : Number.POSITIVE_INFINITY
}

function findSameScrollParentElements(root: RootTarget, selector: string, scrollParent: Element | Document): HTMLElement[] {
  return findVisibleElements(root, selector).filter(el => getScrollParent(el) === scrollParent)
}

function isReverseStackDirection(type: StickyDirection): boolean {
  return type === 'bottom' || type === 'right'
}

function orderStickyElements(elements: HTMLElement[], type: StickyDirection): HTMLElement[] {
  return isReverseStackDirection(type) ? [...elements].reverse() : elements
}

export interface StackStickyOptions {
  type?: StickyDirection
  root?: RootTarget
  selector?: string
  offset?: number
}

function getStickySize(element: HTMLElement, type: StickyDirection): number {
  return type === 'left' || type === 'right' ? element.offsetWidth : element.offsetHeight
}

export function stackSticky({
  type = 'top',
  root = document,
  selector = DEFAULT_SELECTOR,
  offset = 0,
}: StackStickyOptions = {}): void {
  const rootNode = typeof root === 'string' ? document.querySelector(root) : root

  if (!rootNode) {
    return
  }

  const stickyElements = orderStickyElements(
    findVisibleElements(rootNode, selector).filter((element) => {
      const computed = window.getComputedStyle(element)
      return computed[type] === 'auto'
    }),
    type,
  )

  stickyElements.forEach((element) => {
    const scrollParent = getScrollParent(element)
    let sameLevelStickyElements: HTMLElement[]
    let index: number
    let lastElement: HTMLElement | undefined

    if (getDistance(element, rootNode) >= getDistance(element, scrollParent)) {
      sameLevelStickyElements = orderStickyElements(
        findSameScrollParentElements(scrollParent, selector, scrollParent),
        type,
      )
      index = sameLevelStickyElements.indexOf(element)

      if (index === 0) {
        element.style[type] = '0px'
        return
      }

      lastElement = sameLevelStickyElements[index - 1]

      if (sameLevelStickyElements.length - 1 === index) {
        element.setAttribute('scroll-last-sticky', 'true')
      }
    }
    else {
      sameLevelStickyElements = orderStickyElements(
        findSameScrollParentElements(rootNode, selector, scrollParent),
        type,
      )
      index = sameLevelStickyElements.indexOf(element)

      if (index === 0) {
        const lastStickyCandidates = Array.from(
          (scrollParent || document).querySelectorAll('[scroll-last-sticky]'),
        ).filter((el): el is HTMLElement => el instanceof HTMLElement)

        const filtered = lastStickyCandidates.filter(el => getScrollParent(el) === scrollParent)
        lastElement = filtered[0]
      }
      else {
        lastElement = sameLevelStickyElements[index - 1]
      }
    }

    if (lastElement) {
      const lastElementStyle = window.getComputedStyle(lastElement)
      const lastTypeVal = Number.parseInt(lastElementStyle[type], 10) || 0
      element.style[type] = `${lastTypeVal + getStickySize(lastElement, type) + offset}px`
    }
  })
}
