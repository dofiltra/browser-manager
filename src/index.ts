import _ from 'lodash'
import moment from 'moment'
import path from 'path'
import { Browser, BrowserContext, chromium, devices, Page } from 'playwright'
import { sleep } from 'time-helpers'
import { TorManager } from 'tor-mgr'
import { Disposable } from './disposable'
import { TNewPageOpts, TBrowserOpts } from './types'

class BrowserManager extends Disposable {
  public static MAX_OPEN_BROWSERS = 0
  public static openedBrowsers = 0

  protected browser?: Browser
  protected browserContext?: BrowserContext

  static async build(browserOpts: TBrowserOpts): Promise<BrowserManager> {
    const {
      maxOpenedBrowsers = BrowserManager.MAX_OPEN_BROWSERS,
      device = devices['Pixel 5'],
      browserType = chromium,
      idleCloseSeconds = 20,
      lockCloseFirst = 60,
      launchOpts,
      browserContextOpts,
      profileName,
      torOpts,
      appPath
    } = { ...browserOpts }

    if (BrowserManager.openedBrowsers >= maxOpenedBrowsers!) {
      await sleep(_.random(5e3, 20e3))
      return await BrowserManager.build(browserOpts)
    }

    const browserMgr = new BrowserManager()

    try {
      if (!browserMgr.browserContext) {
        BrowserManager.openedBrowsers++
        browserMgr.lockClose(30)

        const { host, port, torPath } = { ...torOpts }

        const args = [
          '--disable-web-security',
          ...(launchOpts?.args || []),
          ...[host && port && `--proxy-server=socks5://${host}:${port}`].filter((x) => x)
        ]

        if (host && port) {
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
      //  logTg(`Pwrt.init: ${e}`)
    }

    return browserMgr
  }

  async newPage({ url, autoCloseTimeout, waitUntil = 'domcontentloaded' }: TNewPageOpts) {
    this.lockClose(60)
    try {
      const page = await this.browserContext!.newPage()
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

  async getRespResult(
    page: Page,
    url?: string,
    postDataText?: string,

    resultAs?: 'json' | 'text'
  ) {
    try {
      this.lockClose(60)
      const resp = await page.waitForResponse(
        (response) => {
          const statusDetect = response.status() === 200
          const urlDetect = !url || response.url().indexOf(url) > -1
          const postDataTextDetect =
            !postDataText || (response.request().postData()?.indexOf(JSON.stringify(postDataText)) || -1) > -1

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

      return await resp.json()
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

export { BrowserManager }
