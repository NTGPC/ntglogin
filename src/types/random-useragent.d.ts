declare module 'random-useragent' {
  interface UserAgent {
    browserName?: string
  }
  export function getRandom(filter?: (ua: UserAgent) => boolean): string
}

