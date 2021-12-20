import _ from 'lodash'
import moment from 'moment'
import path from 'path'
import { Browser, BrowserContext, chromium, devices, Page } from 'playwright'
import { sleep } from 'time-helpers'
import { TorManager } from 'tor-mgr'
import { Disposable } from './disposable'
import { TNewPageOpts, TBrowserOpts } from './types'

class BrowserManager extends Disposable {
  public static openedBrowsers = 0

  protected browser?: Browser
  protected browserContext?: BrowserContext

  static async build<T>(browserOpts: TBrowserOpts): Promise<T | null> {
    const {
      device = devices['Pixel 5'],
      browserType = chromium,
      maxOpenedBrowsers = 0,
      idleCloseSeconds = 50,
      lockCloseFirst = 60,
      browserContextOpts,
      profileName,
      launchOpts,
      torOpts,
      appPath
    } = { ...browserOpts }

    if (maxOpenedBrowsers === 0) {
      return null
    }

    if (BrowserManager.openedBrowsers >= maxOpenedBrowsers!) {
      await sleep(_.random(5e3, 20e3))
      return await BrowserManager.build(browserOpts)
    }

    const browserMgr = new this()

    try {
      if (!browserMgr.browserContext) {
        BrowserManager.openedBrowsers++

        const { host: hostTor, port: portTor, torPath, proto = 'socks5' } = { ...torOpts }
        const args = [
          '--disable-web-security',
          '--ignore-certificate-errors',
          ...(launchOpts?.args || []),
          ...[hostTor && portTor && `--proxy-server=${proto}://${hostTor}:${portTor}`].filter((x) => x)
        ]

        if (hostTor && portTor) {
          await new TorManager({ path: torPath && path.resolve(torPath) }).restart()
        }

        const opts = {
          headless: launchOpts?.headless !== true,
          locale: 'en-US',
          args,
          ...device,
          ...browserContextOpts
        }

        if (profileName && appPath) {
          const userPath = path.join(appPath, 'node_modules', '.browser_profiles', profileName)
          browserMgr.browserContext = await browserType.launchPersistentContext(userPath, opts)
        } else {
          browserMgr.browser = await browserType.launch({
            ...opts,
            ...launchOpts
          })
          browserMgr.browserContext = await browserMgr.browser.newContext({
            ...opts,
            ...browserContextOpts
          })
        }

        browserMgr.lockClose(lockCloseFirst)
        browserMgr.idleCloser(idleCloseSeconds)
      }
    } catch (e: any) {
      // console.log(`Pwrt.init: ${e}`)
    }

    return browserMgr as unknown as T
  }

  async newPage({ url, blackList, autoCloseTimeout, waitUntil = 'domcontentloaded' }: TNewPageOpts) {
    this.lockClose(60)
    try {
      const page = await this.browserContext!.newPage()
      const { urls: blackUrls = [], resourceTypes: blackTypes = [] } = { ...blackList }

      if (blackUrls?.length || blackTypes?.length) {
        await page?.route('**/*', (route) => {
          const isBlackUrl = blackUrls?.some((bl) => new RegExp(bl).test(route.request().url()))
          const isBlackType = blackTypes?.includes(route.request().resourceType() as any)

          return isBlackUrl || isBlackType ? route.abort() : route.continue()
        })
      }

      if (url) {
        await page.goto(url, {
          waitUntil
        })
      }

      this.autoClosePage(page, autoCloseTimeout)
      this.lockClose()
      return page
    } catch (e: any) {
      // log(e)
    }

    try {
      await this.close()

      const page = await this.browserContext!.newPage()
      this.autoClosePage(page, autoCloseTimeout)
      this.lockClose()
      return page
    } catch (e: any) {
      //   logTg(`newPage: ${e}`)
    }

    return null
  }

  async getRespResult<T>(
    page: Page,
    url?: string,
    postDataText?: string,

    resultAs?: 'json' | 'text'
  ): Promise<T | string | null> {
    try {
      this.lockClose(60)
      const resp = await page.waitForResponse(
        (response) => {
          const statusDetect = response.status() === 200
          const urlDetect = !url || response.url().includes(url)
          const postData = response.request().postData()
          const postDataTextDetect =
            !postDataText || postData?.includes(postDataText) || postData?.includes(JSON.stringify(postDataText))

          if (!statusDetect || !urlDetect || !postDataTextDetect) {
            return false
          }

          return true
        },
        {
          timeout: 10e3
        }
      )

      this.lockClose()
      if (!resp.ok()) {
        return null
      }

      if (resultAs === 'text') {
        return await resp.text()
      }

      return (await resp.json()) as T
    } catch (e) {
      //   console.log(e)
    }

    return null
  }

  async isLive() {
    this.lockClose()
    return this.browserContext?.browser()
  }

  async checkIp() {
    try {
      const pageIp = await this.newPage({
        url: 'https://api.ipify.org',
        waitUntil: 'networkidle',
        autoCloseTimeout: 15e3
      })
      const ip = await pageIp?.innerText('pre')
      pageIp?.close()

      return ip
    } catch (e) {
      return e
    }
  }

  async close(title = '') {
    try {
      if (!this.browser && !this.browserContext) {
        return `already closed... ${BrowserManager.openedBrowsers}, ${title}`
      }

      if (this.browserContext?.browser()) {
        await this.browserContext?.close()
      }
      await this.browser?.close()

      delete this.browser
      delete this.browserContext
    } catch (e) {
      return e
    }
    if (BrowserManager.openedBrowsers) {
      BrowserManager.openedBrowsers--
    }
  }

  private idleCloser(idleCloseSeconds?: number) {
    if (!idleCloseSeconds) {
      return
    }

    const browserMgr = this
    let timerId = setTimeout(async function tick() {
      const secs = moment(new Date()).diff(moment(browserMgr._lastActivity), 'seconds')
      if (secs > idleCloseSeconds) {
        clearTimeout(timerId)
        return await browserMgr.close()
      }

      timerId = setTimeout(tick, idleCloseSeconds * 1000)
    }, idleCloseSeconds * 1100)
  }

  private async autoClosePage(page: Page, timeout?: number) {
    if (!timeout) {
      return
    }

    setTimeout(() => {
      page?.close()
    }, timeout)
  }
}

export { BrowserManager, Disposable }
export * from 'playwright'
