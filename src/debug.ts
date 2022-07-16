/* tslint:disable:no-console */
import { devices, chromium } from 'playwright'
import { BrowserManager } from '.'

const debug = async () => {
  try {
    const proxies = [
      // { url: 'http://45.89.19.21:16739@FSOfa5:EZaEVDGtbm' }
    ]

    const pwrt = await BrowserManager.build<BrowserManager>({
      browserType: chromium,
      launchOpts: {
        headless: false
      },
      device: devices['Pixel 5'],
      lockCloseFirst: 500,
      idleCloseSeconds: 60,
      maxOpenedBrowsers: 5

      // appPath: App.rootPath
    })

    console.log('pwrt', pwrt)

    const page = await pwrt?.newPage({
      url: 'https://scrapingant.com/blog/block-requests-playwright',
      blackList: {
        resourceTypes: ['image', 'stylesheet']
      }
    })
    // debugger
    console.log('page', page)

    await page?.close()
    await pwrt?.close()

    return { pwrt, page }
  } catch (e) {
    // console.log(e)
  }
  return {}
}

debug()
