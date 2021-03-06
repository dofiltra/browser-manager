import { BrowserContextOptions, BrowserType, LaunchOptions } from 'playwright'

export type TTorOpts = {
  proto?: string
  host: string
  port: number
  torPath?: string
}

export type TBrowserOpts = {
  appPath?: string
  profileName?: string
  browserType?: BrowserType
  device?: any
  idleCloseSeconds?: number
  launchOpts?: LaunchOptions
  browserContextOpts?: BrowserContextOptions
  torOpts?: TTorOpts
  maxOpenedBrowsers?: number
  lockCloseFirst?: number
}

export type TNewPageOpts = {
  url?: string
  waitUntil?: 'domcontentloaded' | 'load' | 'networkidle'
  autoCloseTimeout?: number
  blackList?: TBlackListOpts
}

export type TBlackListOpts = {
  urls?: string[]
  resourceTypes?: (
    | 'image'
    | 'stylesheet'
    | 'media'
    | 'font'
    | 'script'
    | 'texttrack'
    | 'xhr'
    | 'fetch'
    | 'eventsource'
    | 'websocket'
    | 'manifest'
    | 'other'
  )[]
}
