import { BrowserContextOptions, BrowserType, LaunchOptions } from 'playwright'

export type TTorOpts = {
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
}
