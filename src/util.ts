import assign from 'assign-deep'
import { loadImageAsyncOption } from '../types/lazyload'

const inBrowser = typeof window !== 'undefined' && window !== null

export const hasIntersectionObserver = checkIntersectionObserver()

function checkIntersectionObserver(): boolean {
  if (inBrowser &&
    'IntersectionObserver' in window &&
    'IntersectionObserverEntry' in window &&
    'intersectionRatio' in window.IntersectionObserverEntry.prototype) {
    // Minimal polyfill for Edge 15's lack of `isIntersecting`
    // See: https://github.com/w3c/IntersectionObserver/issues/211
    if (!('isIntersecting' in window.IntersectionObserverEntry.prototype)) {
      Object.defineProperty(window.IntersectionObserverEntry.prototype,
        'isIntersecting', {
        get: function () {
          return this.intersectionRatio > 0
        }
      })
    }
    return true
  }
  return false
}

export const modeType = {
  event: 'event',
  observer: 'observer'
}

function remove(arr: Array<any>, item: any) {
  if (!arr.length) return
  const index = arr.indexOf(item)
  if (index > -1) return arr.splice(index, 1)
}

function getBestSelectionFromSrcset(el: Element, scale: number): string {
  if (el.tagName !== 'IMG' || !el.getAttribute('data-srcset')) return ''

  let options = el.getAttribute('data-srcset')!.trim().split(',')
  const result: Array<[tmpWidth: number, tmpSrc: string]> = []
  const container = el.parentNode as HTMLElement
  const containerWidth = container.offsetWidth * scale

  let spaceIndex: number
  let tmpSrc: string
  let tmpWidth: number

  options.forEach(item => {
    item = item.trim()
    spaceIndex = item.lastIndexOf(' ')
    if (spaceIndex === -1) {
      tmpSrc = item
      tmpWidth = 99999
    } else {
      tmpSrc = item.substr(0, spaceIndex)
      tmpWidth = parseInt(item.substr(spaceIndex + 1, item.length - spaceIndex - 2), 10)
    }
    result.push([tmpWidth, tmpSrc])
  })

  result.sort((a, b) => {
    if (a[0] < b[0]) {
      return 1
    }
    if (a[0] > b[0]) {
      return -1
    }
    if (a[0] === b[0]) {
      if (b[1].indexOf('.webp', b[1].length - 5) !== -1) {
        return 1
      }
      if (a[1].indexOf('.webp', a[1].length - 5) !== -1) {
        return -1
      }
    }
    return 0
  })
  let bestSelectedSrc = ''
  let tmpOption

  for (let i = 0; i < result.length; i++) {
    tmpOption = result[i]
    bestSelectedSrc = tmpOption[1]
    const next = result[i + 1]
    if (next && next[0] < containerWidth) {
      bestSelectedSrc = tmpOption[1]
      break
    } else if (!next) {
      bestSelectedSrc = tmpOption[1]
      break
    }
  }

  return bestSelectedSrc
}

const getDPR = (scale = 1): number => inBrowser ? (window.devicePixelRatio || scale) : scale

// https://developers.google.com/speed/webp/faq#how_can_i_detect_browser_support_using_javascript
function supportWebp() {
  if (!inBrowser) return false

  let support: boolean = true

  type TkTestImages = {
    lossy: string;
    lossless: string;
    alpha: string;
    animation: string;
  }
  function checkWebpFeature(feature: keyof TkTestImages , callback: Function) {
    const kTestImages: TkTestImages = {
      lossy: 'UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEADsD+JaQAA3AAAAAA',
      lossless: 'UklGRhoAAABXRUJQVlA4TA0AAAAvAAAAEAcQERGIiP4HAA==',
      alpha: 'UklGRkoAAABXRUJQVlA4WAoAAAAQAAAAAAAAAAAAQUxQSAwAAAARBxAR/Q9ERP8DAABWUDggGAAAABQBAJ0BKgEAAQAAAP4AAA3AAP7mtQAAAA==',
      animation: 'UklGRlIAAABXRUJQVlA4WAoAAAASAAAAAAAAAAAAQU5JTQYAAAD/////AABBTk1GJgAAAAAAAAAAAAAAAAAAAGQAAABWUDhMDQAAAC8AAAAQBxAREYiI/gcA'
    }
    const img = new Image()
    img.onload = function () {
      const result = (img.width > 0) && (img.height > 0)
      callback(result)
    }
    img.onerror = function () {
      // eslint-disable-next-line node/no-callback-literal
      callback(false)
    }
    img.src = 'data:image/webp;base64,' + kTestImages[feature]
  }

  checkWebpFeature('lossy', (isSupported: boolean) => { support = isSupported })
  checkWebpFeature('lossless', (isSupported: boolean) => { support = isSupported })
  checkWebpFeature('alpha', (isSupported: boolean) => { support = isSupported })
  checkWebpFeature('animation', (isSupported: boolean) => { support = isSupported })

  return support
}

function throttle(action: Function, delay: number) {
  let timeout: any = null
  let lastRun = 0
  return function () {
    if (timeout) {
      return
    }
    const elapsed = Date.now() - lastRun
    // @ts-ignore
    const context = this
    const args = arguments
    const runCallback = function () {
      lastRun = Date.now()
      timeout = false
      action.apply(context, args)
    }
    if (elapsed >= delay) {
      runCallback()
    } else {
      timeout = setTimeout(runCallback, delay)
    }
  }
}

function testSupportsPassive(): boolean {
  if (!inBrowser) return false
  let support = false
  try {
    const opts = Object.defineProperty({}, 'passive', {
      get: function () {
        support = true
      }
    })
    window.addEventListener('test', noop, opts)
  } catch (e) { }
  return support
}

const supportsPassive = testSupportsPassive()

const _ = {
  on(el: Element, type: string, func: ()=>void, capture = false) {
    if (supportsPassive) {
      el.addEventListener(type, func, {
        capture: capture,
        passive: true
      })
    } else {
      el.addEventListener(type, func, capture)
    }
  },
  off(el: Element, type: string, func: ()=>void, capture = false) {
    el.removeEventListener(type, func, capture)
  }
}

const loadImageAsync = (
  item: loadImageAsyncOption,
  resolve: Function,
  reject: Function
) => {
  let image: HTMLImageElement | null = new Image()
  if (!item || !item.src) {
    const err = new Error('image src is required')
    return reject(err)
  }

  if (item.cors) {
    image.crossOrigin = item.cors
  }

  image.src = item.src

  image.onload = function () {
    resolve({
      naturalHeight: image!.naturalHeight,
      naturalWidth: image!.naturalWidth,
      src: image!.src
    })
    image = null
  }

  image.onerror = function (e) {
    reject(e)
  }
}

// keyof CSSStyleDeclaration
const style = (el: HTMLElement, prop: 'overflow' | 'overflowY' | 'overflowX'): string => {
  return typeof getComputedStyle !== 'undefined'
    ? getComputedStyle(el, null).getPropertyValue(prop)
    : el.style[prop]
}

const overflow = (el:HTMLElement): string => {
  return style(el, 'overflow') + style(el, 'overflowY') + style(el, 'overflowX')
}

const scrollParent = (el:HTMLElement) => {
  if (!inBrowser) return
  if (!(el instanceof Element)) {
    return window
  }

  let parent = el

  while (parent) {
    if (parent === document.body || parent === document.documentElement) {
      break
    }

    if (!parent.parentNode) {
      break
    }

    if (/(scroll|auto)/.test(overflow(parent))) {
      return parent
    }

    parent = parent.parentNode as HTMLElement
  }

  return window
}

function isObject(obj: any): boolean {
  return obj !== null && typeof obj === 'object'
}

function noop(): void { }

class ImageCache {
  max: number;
  _caches: Array<string>;
  constructor (max: number) {
    this.max = max || 100
    this._caches = []
  }

  has (key: string): boolean {
    return this._caches.indexOf(key) > -1
  }

  add (key: string) {
    if (this.has(key)) return
    this._caches.push(key)
    if (this._caches.length > this.max) {
      this.free()
    }
  }

  free () {
    this._caches.shift()
  }
}

export {
  ImageCache,
  inBrowser,
  remove,
  assign,
  noop,
  _,
  isObject,
  throttle,
  supportWebp,
  getDPR,
  scrollParent,
  loadImageAsync,
  getBestSelectionFromSrcset
}
